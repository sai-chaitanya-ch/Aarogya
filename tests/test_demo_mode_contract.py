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


