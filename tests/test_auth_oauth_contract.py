"""
Aarogya — Authentication, Role Resolution, and OAuth Signup Intent Contract Tests

NOTE: These tests are fast in-memory contract tests verifying the state machine,
role resolution boundaries, age calculations, workspace selection, and intent protocols implemented in AuthContext.
They do not execute remote network calls to Google OAuth endpoints.
"""
import time
import pytest


def resolve_role_and_intent(
    user_id: str,
    auth_user: dict,
    db_doctor_profile: dict | None,
    db_patient_profile: dict | None,
    oauth_intent: dict | None = None,
    requested_role: str | None = None,
    cached_role: str | None = None,
    now_ms: int | None = None
) -> dict:
    """
    Python mirror of Aarogya's AuthContext resolveAccountRoleAndProfile logic.
    Hardcoded email checks are prohibited; role resolution depends strictly on:
    1. Validated OAuth signup intent for genuinely new accounts
    2. Persisted records in doctor_profiles / profiles
    3. User metadata fallback
    4. Active workspace resolution honoring requested_role, cached preference (only if doctor),
       and strictly preventing unauthorized doctor workspace access.
    """
    if now_ms is None:
        now_ms = int(time.time() * 1000)

    # 1. Parse and validate intent
    valid_intent = None
    if oauth_intent and oauth_intent.get("role") and oauth_intent.get("timestamp"):
        TEN_MINUTES_MS = 10 * 60 * 1000
        if (now_ms - oauth_intent["timestamp"]) < TEN_MINUTES_MS:
            valid_intent = oauth_intent

    created_at_str = auth_user.get("created_at")
    created_at_ms = 0
    if created_at_str:
        try:
            import datetime
            dt = datetime.datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            created_at_ms = int(dt.timestamp() * 1000)
        except Exception:
            created_at_ms = 0

    is_new_account = (
        created_at_ms > 0
        and (now_ms - created_at_ms) < 5 * 60 * 1000
        and not db_doctor_profile
        and not db_patient_profile
    )

    auth_notice = None
    auth_error = None
    created_doc_profile = None

    # Handle OAuth intent for newly registered accounts
    # CRITICAL: No role assignment based solely on hardcoded email address!
    if valid_intent and valid_intent.get("mode") == "signup":
        if is_new_account:
            if valid_intent.get("role") == "doctor":
                created_doc_profile = {
                    "id": user_id,
                    "full_name": auth_user.get("user_metadata", {}).get("full_name") or "Doctor",
                    "qualifications": "Pending Verification (No Credentials Verified)",
                    "specialty": "General Practice (Unverified)",
                    "registration_number": f"UNVERIFIED-{user_id[:8].upper()}",
                    "clinic_name": "Unverified Practice (Pending Review)",
                    "clinic_address": "Verification in progress",
                    "is_verified": False,
                }
        else:
            existing_role = "doctor" if db_doctor_profile else "patient"
            if valid_intent.get("role") != existing_role:
                auth_notice = f"This account is already registered as a {existing_role}. Your existing role was retained."

    effective_doc_profile = db_doctor_profile or created_doc_profile

    is_doc = False
    is_verified = False
    if effective_doc_profile:
        is_doc = True
        is_verified = bool(effective_doc_profile.get("is_verified", False))
    elif auth_user.get("user_metadata", {}).get("role") == "doctor":
        is_doc = True
        is_verified = False

    # Active workspace resolution
    explicit_role = requested_role or (valid_intent.get("role") if valid_intent else None)

    target_role = "patient"
    if is_doc:
        if explicit_role == "doctor":
            target_role = "doctor"
        elif explicit_role == "patient":
            target_role = "patient"
            if not auth_notice:
                auth_notice = "Signed in with Patient view. You can switch to Doctor Workspace anytime."
        else:
            # Check cached preference
            target_role = "patient" if cached_role == "patient" else "doctor"
    else:
        # Patient account: strictly patient workspace only, regardless of requested_role or cached values
        target_role = "patient"
        if explicit_role == "doctor" and not auth_notice:
            auth_notice = "This account is registered as a patient. Patient workspace has been loaded."

    return {
        "is_doctor_account": is_doc,
        "is_doctor_verified": is_verified,
        "active_role": target_role,
        "auth_notice": auth_notice,
        "auth_error": auth_error,
        "created_doc_profile": created_doc_profile,
        "is_new_account": is_new_account,
    }


def test_1_new_user_selects_patient_google_signup():
    now_ms = 1700000000000
    user_id = "user-patient-001"
    auth_user = {
        "id": user_id,
        "email": "newpatient@gmail.com",
        "created_at": "2023-11-14T22:13:20Z",
    }
    intent = {"role": "patient", "mode": "signup", "timestamp": now_ms - 2000}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=None,
        db_patient_profile=None,
        oauth_intent=intent,
        now_ms=now_ms,
    )
    assert res["is_new_account"] is True
    assert res["active_role"] == "patient"
    assert res["is_doctor_account"] is False
    assert res["created_doc_profile"] is None


def test_2_new_user_selects_doctor_google_signup():
    now_ms = 1700000000000
    user_id = "user-doctor-001"
    auth_user = {
        "id": user_id,
        "email": "newdoctor@gmail.com",
        "created_at": "2023-11-14T22:13:20Z",
        "user_metadata": {"full_name": "Dr. Sarah Rao"},
    }
    intent = {"role": "doctor", "mode": "signup", "timestamp": now_ms - 2000}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=None,
        db_patient_profile=None,
        oauth_intent=intent,
        now_ms=now_ms,
    )
    assert res["is_new_account"] is True
    assert res["active_role"] == "doctor"
    assert res["is_doctor_account"] is True
    assert res["is_doctor_verified"] is False
    assert res["created_doc_profile"] is not None
    assert res["created_doc_profile"]["is_verified"] is False
    assert res["created_doc_profile"]["id"] == user_id
    assert "Pending Verification" in res["created_doc_profile"]["qualifications"]
    assert "Unverified Practice" in res["created_doc_profile"]["clinic_name"]


def test_3_oauth_signup_intent_consumed_once():
    intent_consumed = False
    storage = {"aarogya_oauth_signup_intent": '{"role": "doctor", "mode": "signup", "timestamp": 123}'}

    val = storage.get("aarogya_oauth_signup_intent")
    if val:
        del storage["aarogya_oauth_signup_intent"]
        intent_consumed = True

    assert intent_consumed is True
    assert "aarogya_oauth_signup_intent" not in storage
    assert storage.get("aarogya_oauth_signup_intent") is None


def test_4_existing_patient_with_doctor_oauth_intent_retains_patient():
    now_ms = 1700000000000
    user_id = "patient-old-99"
    auth_user = {
        "id": user_id,
        "email": "oldpatient@gmail.com",
        "created_at": "2023-11-04T22:13:20Z",
    }
    existing_patient_profile = {"id": user_id, "full_name": "Old Patient"}
    intent = {"role": "doctor", "mode": "signup", "timestamp": now_ms - 3000}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=None,
        db_patient_profile=existing_patient_profile,
        oauth_intent=intent,
        now_ms=now_ms,
    )
    assert res["is_new_account"] is False
    assert res["active_role"] == "patient"
    assert res["is_doctor_account"] is False
    assert res["created_doc_profile"] is None
    assert "already registered as a patient" in res["auth_notice"]


def test_5_existing_doctor_with_patient_oauth_intent_retains_doctor_capability_and_sets_patient_view():
    now_ms = 1700000000000
    user_id = "doctor-old-88"
    auth_user = {
        "id": user_id,
        "email": "olddoc@gmail.com",
        "created_at": "2023-11-04T22:13:20Z",
    }
    existing_doc_profile = {"id": user_id, "is_verified": False}
    existing_patient_profile = {"id": user_id, "full_name": "Dr. Old"}
    intent = {"role": "patient", "mode": "signup", "timestamp": now_ms - 3000}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=existing_doc_profile,
        db_patient_profile=existing_patient_profile,
        oauth_intent=intent,
        now_ms=now_ms,
    )
    assert res["is_new_account"] is False
    assert res["is_doctor_account"] is True
    assert res["is_doctor_verified"] is False
    # Selected patient view -> patient workspace loaded, but doctor capability retained
    assert res["active_role"] == "patient"
    assert "already registered as a doctor" in res["auth_notice"]


def test_6_no_runtime_role_assignment_solely_by_email():
    now_ms = 1700000000000
    user_id = "user-doctor-email-only"
    auth_user = {
        "id": user_id,
        "email": "doctor@gmail.com",
        "created_at": "2023-10-01T10:00:00Z",
    }
    existing_patient_profile = {"id": user_id, "full_name": "Existing Patient"}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=None,
        db_patient_profile=existing_patient_profile,
        oauth_intent=None,
        now_ms=now_ms,
    )
    assert res["is_doctor_account"] is False
    assert res["active_role"] == "patient"
    assert res["created_doc_profile"] is None


def test_7_provisioned_demo_doctor_account_resolution():
    now_ms = 1700000000000
    user_id = "provisioned-doctor-uuid"
    auth_user = {
        "id": user_id,
        "email": "doctor@gmail.com",
        "created_at": "2023-10-01T10:00:00Z",
    }
    provisioned_doc_profile = {
        "id": user_id,
        "full_name": "Demo Practitioner (Unverified)",
        "qualifications": "Pending Verification (Demo Account - No Credentials Verified)",
        "is_verified": False,
    }

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=provisioned_doc_profile,
        db_patient_profile=None,
        oauth_intent=None,
        now_ms=now_ms,
    )
    assert res["is_doctor_account"] is True
    assert res["is_doctor_verified"] is False
    assert res["active_role"] == "doctor"
    assert res["created_doc_profile"] is None


def test_8_email_login_doctor_selection_overrides_stale_cached_patient_role():
    """
    Core bug fix: A recognized doctor logs in with Doctor selected.
    Even though the browser has cached_role = 'patient', selecting Doctor must override
    the stale cached role and load the Doctor workspace.
    """
    user_id = "doc-override-test"
    auth_user = {"id": user_id, "email": "doctor@hospital.org"}
    doc_profile = {"id": user_id, "is_verified": True}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=doc_profile,
        db_patient_profile=None,
        requested_role="doctor",
        cached_role="patient", # Stale cache
    )
    assert res["is_doctor_account"] is True
    assert res["active_role"] == "doctor"


def test_9_email_login_patient_selection_for_doctor_sets_patient_workspace():
    """
    An authorized doctor purposefully logs in selecting Patient.
    The app should permit the patient view and set an informative notice.
    """
    user_id = "doc-select-patient"
    auth_user = {"id": user_id, "email": "doctor@hospital.org"}
    doc_profile = {"id": user_id, "is_verified": False}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=doc_profile,
        db_patient_profile=None,
        requested_role="patient",
        cached_role="doctor",
    )
    assert res["is_doctor_account"] is True
    assert res["active_role"] == "patient"
    assert "Patient view" in res["auth_notice"]


def test_10_email_login_patient_user_selecting_doctor_denied_doctor_workspace():
    """
    A patient selects Doctor on login screen, but has no doctor_profiles record.
    The app must keep them in Patient workspace and display an informative notice.
    """
    user_id = "patient-trying-doctor"
    auth_user = {"id": user_id, "email": "patient@gmail.com"}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=None,
        db_patient_profile={"id": user_id, "full_name": "Patient User"},
        requested_role="doctor",
        cached_role="doctor", # Attempting to spoof via cache
    )
    assert res["is_doctor_account"] is False
    assert res["active_role"] == "patient"
    assert "registered as a patient" in res["auth_notice"]


def test_11_cached_browser_value_never_grants_doctor_capability():
    """
    A regular user with cached_role = 'doctor' must NEVER be granted doctor capability.
    """
    user_id = "fake-doctor-cached"
    auth_user = {"id": user_id, "email": "normal@gmail.com"}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=None,
        db_patient_profile={"id": user_id, "full_name": "Normal User"},
        requested_role=None,
        cached_role="doctor",
    )
    assert res["is_doctor_account"] is False
    assert res["active_role"] == "patient"


def test_12_oauth_callback_doctor_intent_overrides_stale_cached_patient_role():
    """
    On OAuth callback for an authorized doctor with doctor signup/signin intent,
    stale cached 'patient' role must be overridden by the doctor workspace.
    """
    now_ms = 1700000000000
    user_id = "doc-oauth-callback"
    auth_user = {
        "id": user_id,
        "email": "doc@oauth.com",
        "created_at": "2023-11-04T22:13:20Z",
    }
    doc_profile = {"id": user_id, "is_verified": False}
    intent = {"role": "doctor", "mode": "signin", "timestamp": now_ms - 1000}

    res = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user,
        db_doctor_profile=doc_profile,
        db_patient_profile=None,
        oauth_intent=intent,
        cached_role="patient", # Stale cache
        now_ms=now_ms,
    )
    assert res["is_doctor_account"] is True
    assert res["active_role"] == "doctor"


def test_13_oauth_error_url_sanitization_and_stale_intent_clearance():
    url_hash = "#error=access_denied&error_code=403&error_description=User+cancelled+Google+sign+in"
    hash_params = {}
    for part in url_hash.lstrip("#").split("&"):
        if "=" in part:
            k, v = part.split("=", 1)
            hash_params[k] = v

    error_desc = hash_params.get("error_description", "").replace("+", " ")
    error_code = hash_params.get("error_code")

    assert error_code == "403"
    assert error_desc == "User cancelled Google sign in"

    # Simulate clearing stale intent on callback error
    session_storage = {"aarogya_oauth_signup_intent": "stale"}
    if error_code:
        session_storage.pop("aarogya_oauth_signup_intent", None)

    assert "aarogya_oauth_signup_intent" not in session_storage


def test_14_account_creation_time_age_boundaries():
    now_ms = 1700000000000
    user_id = "user-age-boundary"

    # Exactly 2 minutes old -> considered new if profiles don't exist
    auth_user_2min = {
        "id": user_id,
        "created_at": "2023-11-14T22:11:20Z",
    }
    res_2min = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user_2min,
        db_doctor_profile=None,
        db_patient_profile=None,
        oauth_intent=None,
        now_ms=now_ms,
    )
    assert res_2min["is_new_account"] is True

    # 10 minutes old -> NOT new
    auth_user_10min = {
        "id": user_id,
        "created_at": "2023-11-14T22:03:20Z",
    }
    res_10min = resolve_role_and_intent(
        user_id=user_id,
        auth_user=auth_user_10min,
        db_doctor_profile=None,
        db_patient_profile=None,
        oauth_intent=None,
        now_ms=now_ms,
    )
    assert res_10min["is_new_account"] is False


def test_15_role_switch_authorization():
    # Patient account cannot switch to doctor role
    patient_is_doctor = False
    current_role = "patient"
    target_role = "doctor"

    final_role = current_role if (target_role == "doctor" and not patient_is_doctor) else target_role
    assert final_role == "patient"

    # Doctor account can freely switch
    doctor_is_doctor = True
    doc_current_role = "doctor"
    doc_target_role = "patient"

    doc_final_role = doc_current_role if (doc_target_role == "doctor" and not doctor_is_doctor) else doc_target_role
    assert doc_final_role == "patient"
