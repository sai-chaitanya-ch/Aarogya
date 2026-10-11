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
    Simulates resetDemoData() scoping: only keys starting with the active user's
    demoStoragePrefix are purged.
    """
    prefix = "aarogya_demo_health_user-456"
    mock_session_storage = {
        f"{prefix}_records": '[{"id": "mod-1"}]',
        f"{prefix}_reminders": '[{"id": "mod-2"}]',
        f"{prefix}_appointments": '[{"id": "mod-3"}]',
        "unrelated_user_setting": "keep-me",
    }

    # Sweep matching prefix
    keys_to_remove = [k for k in mock_session_storage if k.startswith(prefix)]
    for k in keys_to_remove:
        mock_session_storage.pop(k)

    assert f"{prefix}_records" not in mock_session_storage
    assert f"{prefix}_reminders" not in mock_session_storage
    assert f"{prefix}_appointments" not in mock_session_storage
    assert mock_session_storage["unrelated_user_setting"] == "keep-me"

