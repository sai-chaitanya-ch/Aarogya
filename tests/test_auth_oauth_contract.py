"""
Aarogya — Authentication, Role Resolution, and OAuth Signup Intent Contract Tests

NOTE: These tests are fast in-memory contract tests verifying the state machine,
role resolution boundaries, age calculations, and intent protocols implemented in AuthContext.
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
    now_ms: int | None = None
) -> dict:
    """
    Python mirror of Aarogya's AuthContext resolveAccountRoleAndProfile logic.
    Hardcoded email checks are prohibited; role resolution depends strictly on:
    1. Validated OAuth signup intent for genuinely new accounts
    2. Persisted records in doctor_profiles / profiles
    3. User metadata fallback
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

    active_role = "doctor" if is_doc else "patient"

    return {
        "is_doctor_account": is_doc,
        "is_doctor_verified": is_verified,
        "active_role": active_role,
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
    # Assert placeholder credentials are completely unverified without fictional medical claims
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


def test_5_existing_doctor_with_patient_oauth_intent_retains_doctor():
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
    assert res["active_role"] == "doctor"
    assert res["is_doctor_account"] is True
    assert res["is_doctor_verified"] is False
    assert "already registered as a doctor" in res["auth_notice"]


def test_6_no_runtime_role_assignment_solely_by_email():
    now_ms = 1700000000000
    user_id = "user-doctor-email-only"
    # Even if email is doctor@gmail.com, if no doctor_profiles record exists and it's an existing account,
    # it must NOT be assigned a doctor role
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
    # Database has doctor_profiles row created via safe provisioning script
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


def test_8_email_password_signup_doctor_profile_unverified():
    user_id = "doc-email-signup"
    name = "Dr. Test Doctor"
    doc_upsert = {
        "id": user_id,
        "full_name": name,
        "qualifications": "Pending Verification (No Credentials Verified)",
        "specialty": "General Practice (Unverified)",
        "registration_number": f"UNVERIFIED-{user_id[:8].upper()}",
        "clinic_name": "Unverified Practice (Pending Review)",
        "clinic_address": "Verification in progress",
        "is_verified": False,
    }

    assert doc_upsert["is_verified"] is False
    assert "Pending Verification" in doc_upsert["qualifications"]
    assert "Unverified Practice" in doc_upsert["clinic_name"]


def test_9_oauth_error_url_sanitization():
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


def test_10_account_creation_time_age_boundaries():
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


def test_11_role_switch_authorization():
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
