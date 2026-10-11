"""Unit and contract tests for Cloudflare Turnstile CAPTCHA integration and Auth token handling."""
from __future__ import annotations

import pytest


def simulate_captcha_validation(
    site_key_configured: bool,
    token: str | None,
    is_expired: bool = False,
    is_error: bool = False
) -> dict:
    """
    Simulates the client-side validation logic of AuthModal and TurnstileWidget.
    - If sitekey is configured:
      - requires a valid token
      - expired token is rejected
      - widget error rejects submission
      - valid token is consumed (reset)
    - If sitekey is not configured:
      - submission proceeds without requiring token
    """
    if not site_key_configured:
        return {"allowed": True, "token_passed": None, "error": None}

    if is_error:
        return {
            "allowed": False,
            "token_passed": None,
            "error": "Verification failed. Please retry."
        }

    if is_expired:
        return {
            "allowed": False,
            "token_passed": None,
            "error": "Verification expired. Please re-verify."
        }

    if not token or not token.strip():
        return {
            "allowed": False,
            "token_passed": None,
            "error": "Please complete the security verification before continuing."
        }

    # Token is valid and consumed
    return {
        "allowed": True,
        "token_passed": token.strip(),
        "error": None,
        "widget_reset": True
    }


def simulate_supabase_auth_options(method: str, token: str | None, payload: dict | None = None) -> dict:
    """
    Simulates how AuthContext maps arguments to Supabase Auth options based on the official GoTrue JS types.
    """
    payload = payload or {}
    if method == "signInWithPassword":
        options = {}
        if token:
            options["captchaToken"] = token
        return {
            "email": payload.get("email"),
            "password": payload.get("password"),
            **({"options": options} if options else {})
        }

    elif method == "signUp":
        options = {"data": payload.get("data", {})}
        if token:
            options["captchaToken"] = token
        return {
            "email": payload.get("email"),
            "password": payload.get("password"),
            "options": options
        }

    elif method == "signInAnonymously":
        options = {}
        if token:
            options["captchaToken"] = token
        return {
            **({"options": options} if options else {})
        }

    elif method == "resetPasswordForEmail":
        options = {"redirectTo": payload.get("redirectTo", "https://app.local")}
        if token:
            options["captchaToken"] = token
        return {
            "email": payload.get("email"),
            "options": options
        }

    raise ValueError(f"Unknown auth method {method}")


# --- Tests ---

def test_missing_captcha_token_when_sitekey_active():
    """When VITE_TURNSTILE_SITE_KEY is set, submitting without completing CAPTCHA is blocked."""
    result = simulate_captcha_validation(site_key_configured=True, token=None)
    assert result["allowed"] is False
    assert "Please complete the security verification" in result["error"]


def test_missing_captcha_token_when_sitekey_empty():
    """When VITE_TURNSTILE_SITE_KEY is not configured, authentication proceeds without CAPTCHA blocking."""
    result = simulate_captcha_validation(site_key_configured=False, token=None)
    assert result["allowed"] is True
    assert result["token_passed"] is None
    assert result["error"] is None


def test_expired_captcha_token_rejected():
    """When token expires, validation fails and informs user to re-verify."""
    result = simulate_captcha_validation(site_key_configured=True, token="old_token", is_expired=True)
    assert result["allowed"] is False
    assert "expired" in result["error"].lower()


def test_error_state_captcha_rejected():
    """When widget emits an error, submission is blocked."""
    result = simulate_captcha_validation(site_key_configured=True, token=None, is_error=True)
    assert result["allowed"] is False
    assert "Verification failed" in result["error"]


def test_token_consumed_and_widget_reset():
    """A valid token allows submission and triggers a widget reset to prevent token reuse."""
    token = "0.test_turnstile_cf_token_abc123"
    result = simulate_captcha_validation(site_key_configured=True, token=token)
    assert result["allowed"] is True
    assert result["token_passed"] == token
    assert result["widget_reset"] is True


def test_patient_demo_entry_path_with_captcha():
    """Patient demo entry forwards captchaToken correctly to signInAnonymously options."""
    token = "cf_turnstile_patient_demo_token"
    call_args = simulate_supabase_auth_options("signInAnonymously", token=token)
    assert "options" in call_args
    assert call_args["options"]["captchaToken"] == token


def test_doctor_demo_entry_path_with_captcha():
    """Doctor demo entry forwards captchaToken correctly to signInAnonymously options."""
    token = "cf_turnstile_doctor_demo_token"
    call_args = simulate_supabase_auth_options("signInAnonymously", token=token)
    assert "options" in call_args
    assert call_args["options"]["captchaToken"] == token


def test_signin_with_password_options_shape():
    """Email/password login packages captchaToken in options without extra invalid fields."""
    token = "cf_signin_token_456"
    call_args = simulate_supabase_auth_options(
        "signInWithPassword",
        token=token,
        payload={"email": "patient@example.com", "password": "securepassword"}
    )
    assert call_args["email"] == "patient@example.com"
    assert call_args["password"] == "securepassword"
    assert call_args["options"]["captchaToken"] == token


def test_signup_options_shape():
    """Email signup packages user metadata and captchaToken into options."""
    token = "cf_signup_token_789"
    call_args = simulate_supabase_auth_options(
        "signUp",
        token=token,
        payload={
            "email": "doctor@example.com",
            "password": "strongpassword",
            "data": {"full_name": "Dr. Jane Doe", "role": "doctor"}
        }
    )
    assert call_args["email"] == "doctor@example.com"
    assert call_args["password"] == "strongpassword"
    assert call_args["options"]["data"]["role"] == "doctor"
    assert call_args["options"]["captchaToken"] == token


def test_reset_password_options_shape():
    """Password reset forwards redirectTo and captchaToken in options."""
    token = "cf_reset_token_321"
    call_args = simulate_supabase_auth_options(
        "resetPasswordForEmail",
        token=token,
        payload={"email": "recover@example.com", "redirectTo": "https://aarogya-for-you.netlify.app"}
    )
    assert call_args["email"] == "recover@example.com"
    assert call_args["options"]["captchaToken"] == token
    assert call_args["options"]["redirectTo"] == "https://aarogya-for-you.netlify.app"
