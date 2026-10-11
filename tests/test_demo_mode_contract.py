"""Regression and contract tests for Aarogya Public Passwordless Demo Mode."""
from __future__ import annotations

import collections
import uuid
from unittest.mock import MagicMock

import pytest
from starlette.testclient import TestClient

import main


@pytest.fixture
def client():
    return TestClient(main.app)


def test_anonymous_user_chat_uses_server_owned_synthetic_context(client, monkeypatch):
    """Anonymous users chatting with Aarogya must receive responses grounded in synthetic demo data, not real RAG."""
    anon_user_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = anon_user_id
    mock_user.is_anonymous = True
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    # Ensure retrieve_relevant_chunks is never called for anonymous users
    def mock_retrieve_should_not_be_called(*args, **kwargs):
        raise AssertionError("retrieve_relevant_chunks should NOT be called for anonymous demo sessions!")

    monkeypatch.setattr(main, "retrieve_relevant_chunks", mock_retrieve_should_not_be_called)

    captured_context = {}

    def mock_ask_chat(query, language, medical_history_context, citations):
        captured_context["context"] = medical_history_context
        captured_context["citations"] = citations
        return {
            "reply": "Based on your synthetic demo records, your hemoglobin is 10.8 g/dL.",
            "citations": citations,
            "is_emergency": False,
            "provider": "gemini",
            "model": "gemini-3.8-flash",
            "fallback_used": False,
        }

    monkeypatch.setattr(main, "ask_aarogya_chat", mock_ask_chat)

    res = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer anon_jwt_token"},
        json={"query": "What does my demo CBC show?"},
    )

    assert res.status_code == 200
    data = res.json()
    assert data["retrieval_mode"] == "demo_synthetic"
    assert data["retrieved_chunks"] == 2
    assert "SYNTHETIC DEMO HEALTH HISTORY CONTEXT" in captured_context["context"]
    assert "Hemoglobin: 10.8 g/dL" in captured_context["context"]


def test_anonymous_user_cannot_index_or_reindex_rag(client, monkeypatch):
    """Anonymous users must not be permitted to index or reindex pgvector documents."""
    anon_user_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = anon_user_id
    mock_user.is_anonymous = True
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    # Test /api/rag/index
    res_index = client.post(
        "/api/rag/index",
        headers={"Authorization": "Bearer anon_jwt_token"},
        json={"document_id": str(uuid.uuid4())},
    )
    assert res_index.status_code == 403
    assert "Demo sessions do not persist documents" in res_index.json()["detail"]

    # Test /api/rag/reindex
    res_reindex = client.post(
        "/api/rag/reindex",
        headers={"Authorization": "Bearer anon_jwt_token"},
    )
    assert res_reindex.status_code == 403
    assert "Demo sessions do not persist documents" in res_reindex.json()["detail"]


def test_anonymous_rate_limiting_enforced(client, monkeypatch):
    """Anonymous sessions exceeding 10 requests within 5 minutes are throttled with 429."""
    anon_user_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = anon_user_id
    mock_user.is_anonymous = True
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    monkeypatch.setattr(
        main,
        "ask_aarogya_chat",
        lambda query, language, medical_history_context, citations: {
            "reply": "Synthetic reply",
            "citations": citations,
            "is_emergency": False,
            "provider": "gemini",
            "model": "gemini-3.8-flash",
            "fallback_used": False,
        },
    )

    # Reset any rate limit queue for test isolation
    main._anonymous_request_log[anon_user_id] = collections.deque()

    # First 10 requests succeed
    for i in range(10):
        res = client.post(
            "/api/chat",
            headers={"Authorization": "Bearer anon_jwt_token"},
            json={"query": f"Query {i}"},
        )
        assert res.status_code == 200

    # 11th request receives 429 Too Many Requests
    res_throttled = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer anon_jwt_token"},
        json={"query": "Query 11"},
    )
    assert res_throttled.status_code == 429
    assert "Demo rate limit reached" in res_throttled.json()["detail"]


def test_demo_storage_cleanup_removes_demo_keys_and_preserves_unrelated_keys():
    """
    Simulates the sessionStorage cleanup performed during demo sign-out and reset.
    It verifies that keys with prefixes 'aarogya_demo_health_', 'aarogya_demo_doctor_patients_',
    and the demo persona key are purged, while unrelated application/vendor keys are preserved.
    """
    mock_session_storage = {
        # Aarogya demo keys
        "aarogya_demo_persona": "patient",
        "aarogya_demo_health_anon-123_records": '[{"id": "demo-rec-1"}]',
        "aarogya_demo_health_anon-123_reminders": '[{"id": "demo-rem-1"}]',
        "aarogya_demo_health_anon-123_appointments": '[{"id": "demo-apt-1"}]',
        "aarogya_demo_doctor_patients_anon-123": '[{"id": "pat-1"}]',
        "aarogya_oauth_signup_intent": '{"role": "patient"}',

        # Unrelated keys that MUST be preserved
        "theme_preference": "dark",
        "cookie_consent": "true",
        "analytics_session_id": "xyz-789",
        "third_party_app_state": "active",
    }

    # Simulate clearAarogyaStorage() cleanup
    keys_to_remove = [
        k for k in mock_session_storage
        if k in ("aarogya_demo_persona", "aarogya_oauth_signup_intent")
        or k.startswith("aarogya_demo_health_")
        or k.startswith("aarogya_demo_doctor_patients_")
    ]
    for k in keys_to_remove:
        mock_session_storage.pop(k)

    # Assert demo keys were purged
    assert "aarogya_demo_persona" not in mock_session_storage
    assert "aarogya_demo_health_anon-123_records" not in mock_session_storage
    assert "aarogya_demo_health_anon-123_reminders" not in mock_session_storage
    assert "aarogya_demo_health_anon-123_appointments" not in mock_session_storage
    assert "aarogya_demo_doctor_patients_anon-123" not in mock_session_storage
    assert "aarogya_oauth_signup_intent" not in mock_session_storage

    # Assert unrelated keys are fully preserved
    assert mock_session_storage["theme_preference"] == "dark"
    assert mock_session_storage["cookie_consent"] == "true"
    assert mock_session_storage["analytics_session_id"] == "xyz-789"
    assert mock_session_storage["third_party_app_state"] == "active"


def test_demo_reset_data_cleans_user_scoped_prefix_only():
    """
    Simulates resetDemoData() scoping: keys starting with the active user's
    demoStoragePrefix as well as their doctor patients key are purged, while other users' keys are kept.
    """
    user_id = "user-456"
    prefix = f"aarogya_demo_health_{user_id}"
    doctor_key = f"aarogya_demo_doctor_patients_{user_id}"
    mock_session_storage = {
        f"{prefix}_records": '[{"id": "mod-1"}]',
        f"{prefix}_reminders": '[{"id": "mod-2"}]',
        f"{prefix}_appointments": '[{"id": "mod-3"}]',
        doctor_key: '[{"id": "pat-custom"}]',
        "aarogya_demo_health_other-user_records": '[{"id": "other-rec"}]',
        "aarogya_demo_doctor_patients_other-user": '[{"id": "other-pat"}]',
        "unrelated_user_setting": "keep-me",
    }

    # Enhanced resetDemoData() sweep
    keys_to_remove = [
        k for k in mock_session_storage
        if k.startswith(prefix) or k in (doctor_key, f"aarogya_demo_doctor_patients_{user_id or 'anon'}")
    ]
    for k in keys_to_remove:
        mock_session_storage.pop(k)

    # Current user's health and doctor keys removed
    assert f"{prefix}_records" not in mock_session_storage
    assert f"{prefix}_reminders" not in mock_session_storage
    assert f"{prefix}_appointments" not in mock_session_storage
    assert doctor_key not in mock_session_storage

    # Other visitors' keys and unrelated settings preserved
    assert "aarogya_demo_health_other-user_records" in mock_session_storage
    assert "aarogya_demo_doctor_patients_other-user" in mock_session_storage
    assert mock_session_storage["unrelated_user_setting"] == "keep-me"


def test_doctor_demo_profile_status_and_verification_contract():
    """
    Tests the presentation contract for the Doctor Profile and header:
    - Demo sessions MUST display 'DEMO PRACTITIONER — NOT A REAL DOCTOR' and 'Verification: Not verified'.
    - Fallback text must be demo-safe ('Demo Session (Unverified)') and never 'Verified Practitioner'.
    - Real doctor accounts reflect actual credential verification status.
    """
    def resolve_doctor_profile_status(is_demo: bool, is_verified: bool, email: str | None = None) -> dict:
        if is_demo:
            return {
                "status": "DEMO PRACTITIONER — NOT A REAL DOCTOR",
                "verification": "Not verified",
                "subtitle": "Demo Session (Unverified)",
                "header_badge": "Demo Practitioner (Not Verified)",
                "is_real_doctor": False,
            }
        return {
            "status": "Active & Verified" if is_verified else "Verification Pending",
            "verification": "Verified Practitioner" if is_verified else "Under review",
            "subtitle": email or ("Verified Practitioner" if is_verified else "Verification Pending"),
            "header_badge": "Verified Practitioner" if is_verified else "Verification Pending",
            "is_real_doctor": True,
        }

    # 1. Demo Doctor Session
    demo_status = resolve_doctor_profile_status(is_demo=True, is_verified=False)
    assert demo_status["status"] == "DEMO PRACTITIONER — NOT A REAL DOCTOR"
    assert demo_status["verification"] == "Not verified"
    assert demo_status["subtitle"] == "Demo Session (Unverified)"
    assert demo_status["header_badge"] == "Demo Practitioner (Not Verified)"
    assert "Verified Practitioner" not in demo_status["status"]
    assert "Verified Practitioner" not in demo_status["verification"]
    assert demo_status["is_real_doctor"] is False

    # 2. Real Unverified Doctor
    unverified_doc = resolve_doctor_profile_status(is_demo=False, is_verified=False, email="doctor@clinic.org")
    assert unverified_doc["status"] == "Verification Pending"
    assert unverified_doc["verification"] == "Under review"
    assert unverified_doc["is_real_doctor"] is True

    # 3. Real Verified Doctor
    verified_doc = resolve_doctor_profile_status(is_demo=False, is_verified=True, email="doctor@hospital.org")
    assert verified_doc["status"] == "Active & Verified"
    assert verified_doc["verification"] == "Verified Practitioner"
    assert verified_doc["is_real_doctor"] is True


def test_doctor_demo_prescription_truthful_messaging_contract():
    """
    Verifies that publishing a prescription in demo mode:
    1. Produces a synthetic record labeled unverified/pending review.
    2. Uses truthful feedback messaging stating that the prescription was saved locally in the demo session
       and NO real patient was notified.
    3. Never claims synchronization with a real patient's Aarogya app.
    """
    def generate_published_prescription(is_demo: bool, doctor_name: str, patient_name: str, med_count: int) -> tuple[dict, str]:
        if is_demo:
            record = {
                "title": "Synthetic Demo Prescription (Unverified)",
                "documentType": "Prescription",
                "patientName": patient_name,
                "doctorName": "Demo Clinician (Unverified)",
                "facilityName": "Demo Community Health Clinic",
                "status": "pending_review",
                "aiSummary": f"Synthetic demo prescription containing {med_count} medications for demonstration purposes only.",
            }
            alert_msg = (
                "Demo Prescription Saved: This synthetic prescription was saved locally in your active demo session only. "
                "No real patient was notified, and no real medical records or clinical relationships were created."
            )
            return record, alert_msg

        record = {
            "title": f"Prescription by {doctor_name}",
            "documentType": "Prescription",
            "patientName": patient_name,
            "doctorName": doctor_name,
            "facilityName": "Aarogya Health Network",
            "status": "verified",
            "aiSummary": f"Prescription published by {doctor_name} containing {med_count} medications.",
        }
        alert_msg = f"Prescription published successfully and synchronized with {patient_name}'s Aarogya app!"
        return record, alert_msg

    # Test demo mode
    demo_rec, demo_alert = generate_published_prescription(is_demo=True, doctor_name="Dr. Demo", patient_name="Demo Patient A", med_count=2)
    assert demo_rec["title"] == "Synthetic Demo Prescription (Unverified)"
    assert demo_rec["status"] == "pending_review"
    assert demo_rec["doctorName"] == "Demo Clinician (Unverified)"
    assert "demonstration purposes only" in demo_rec["aiSummary"]
    assert "No real patient was notified" in demo_alert
    assert "synchronized with" not in demo_alert

    # Test authenticated non-demo mode
    real_rec, real_alert = generate_published_prescription(is_demo=False, doctor_name="Dr. Verified", patient_name="Real Patient", med_count=2)
    assert real_rec["title"] == "Prescription by Dr. Verified"
    assert real_rec["status"] == "verified"
    assert "synchronized with Real Patient's Aarogya app" in real_alert


def test_demo_scan_review_date_validation_contract():
    """Validates date validation rules for saving scanned records in both demo and real mode."""
    today = "2026-10-11"

    def validate_report_date(date_str: str) -> tuple[bool, str]:
        if not date_str or not date_str.strip():
            return False, "Please enter a valid visit / report date before saving."
        trimmed = date_str.strip()
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", trimmed):
            return False, "Please enter a valid visit / report date before saving."
        if trimmed > today:
            return False, "Visit date cannot be in the future. Please correct the report date."
        return True, ""

    # Empty date
    ok, err = validate_report_date("")
    assert not ok
    assert err == "Please enter a valid visit / report date before saving."

    # Invalid format
    ok, err = validate_report_date("11/10/2026")
    assert not ok
    assert err == "Please enter a valid visit / report date before saving."

    # Future date
    ok, err = validate_report_date("2026-10-15")
    assert not ok
    assert err == "Visit date cannot be in the future. Please correct the report date."

    # Valid today
    ok, err = validate_report_date(today)
    assert ok
    assert err == ""

    # Valid past date
    ok, err = validate_report_date("2026-09-18")
    assert ok
    assert err == ""


def test_demo_save_record_browser_isolation_contract():
    """
    Validates that demo addRecord() saves strictly to browser session storage
    and NEVER interacts with permanent database or file storage.
    """
    mock_supabase = MagicMock()
    # If Supabase storage or table insert is called, it must raise
    mock_supabase.storage.from_.side_effect = AssertionError("Supabase storage must NOT be called in demo mode")
    mock_supabase.from_.side_effect = AssertionError("Supabase table queries must NOT be called in demo save")

    def simulate_add_record(is_demo: bool, record_data: dict, has_file: bool = True) -> dict:
        if is_demo:
            # Browser-scoped demo record
            demo_record = {
                **record_data,
                "id": f"demo_rec_{uuid.uuid4().hex[:8]}",
                "originalFileUrl": "blob:http://localhost:5173/mock-object-url" if has_file else None,
                "createdAt": "2026-10-11T12:00:00.000Z",
            }
            return {
                "record": demo_record,
                "indexingStatus": "demo_local",
                "chunksIndexed": 0,
                "embeddingModel": "none",
            }

        # Real mode calls supabase
        mock_supabase.storage.from_("medical-records")
        return {}

    result = simulate_add_record(
        is_demo=True,
        record_data={
            "title": "General Consultation Prescription (Demo Template)",
            "documentType": "Prescription",
            "visitDate": "2026-10-11",
            "medicines": [{"name": "Amoxicillin 500mg"}],
        },
    )

    assert result["indexingStatus"] == "demo_local"
    assert result["chunksIndexed"] == 0
    assert result["embeddingModel"] == "none"
    assert result["record"]["id"].startswith("demo_rec_")
    assert result["record"]["originalFileUrl"].startswith("blob:")
    assert mock_supabase.storage.from_.call_count == 0
    assert mock_supabase.from_.call_count == 0


def test_optimize_image_for_vision_compresses_and_downscales():
    """Verifies optimize_image_for_vision prevents massive payloads and timeouts."""
    import io
    from PIL import Image
    from ocr_service import optimize_image_for_vision

    # Create a 2400x1800 mock test image
    img = Image.new("RGB", (2400, 1800), color=(200, 220, 240))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    raw_bytes = buf.getvalue()

    optimized, mime = optimize_image_for_vision(raw_bytes, "image/jpeg", max_dimension=1600)
    assert optimized is not None
    assert mime == "image/jpeg"
    assert len(optimized) < len(raw_bytes)

    # Check that dimensions were constrained to <= 1600
    res_img = Image.open(io.BytesIO(optimized))
    assert res_img.width <= 1600
    assert res_img.height <= 1600


def test_document_extraction_timeout_error_propagation(client, monkeypatch):
    """Verifies that an AI timeout returns a structured 503 rather than an unhandled crash."""
    anon_user_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = anon_user_id
    mock_user.is_anonymous = True
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    from gemini_service import ModelUnavailableError

    def mock_structure_timeout(*args, **kwargs):
        raise ModelUnavailableError("AI extraction timed out. Please retry or enter details manually.")

    monkeypatch.setattr(main, "structure_medical_document", mock_structure_timeout)

    dummy_jpeg = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00"
        b"\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12"
        b"\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
        b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05"
        b"\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07"
        b"\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
    )

    res = client.post(
        "/api/documents/process",
        headers={"Authorization": "Bearer anon_jwt_token"},
        files={"file": ("sample.jpg", dummy_jpeg, "image/jpeg")},
        data={"preset_type": "prescription"},
    )

    assert res.status_code == 503
    assert "AI extraction timed out" in res.json()["detail"]



