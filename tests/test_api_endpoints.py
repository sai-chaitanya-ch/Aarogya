import os
import sys
import uuid
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

import main
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_unauthenticated_requests_are_strictly_rejected(client):
    """Every protected endpoint must return 401 Unauthorized when no token is supplied."""
    endpoints = [
        ("POST", "/api/chat", {"json": {"query": "hello"}}),
        ("POST", "/api/documents/signed-url", {"json": {"storage_path": "u1/doc.pdf"}}),
        ("POST", "/api/rag/index", {"json": {"document_id": str(uuid.uuid4())}}),
        ("POST", "/api/rag/reindex", {}),
    ]
    for method, path, kwargs in endpoints:
        res = client.request(method, path, **kwargs)
        assert res.status_code == 401, f"{path} did not reject unauthenticated request, returned {res.status_code}"
        assert "Sign in" in res.json().get("detail", "") or "invalid" in res.json().get("detail", "").lower()


def test_invalid_token_is_rejected(client, monkeypatch):
    """When a forged or expired token is passed, it must return 401."""
    mock_supabase = MagicMock()
    # Mock client.auth.get_user to raise an exception or return None
    mock_supabase.auth.get_user.side_effect = Exception("Token expired")
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    res = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer bad_or_expired_jwt_token"},
        json={"query": "test query"}
    )
    assert res.status_code == 401
    assert "invalid or expired" in res.json().get("detail", "").lower()


def test_patient_isolation_signed_url_cross_patient_denied(client, monkeypatch):
    """User A cannot request a signed URL for User B's document."""
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_a_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    # User A requests User B's storage path
    res = client.post(
        "/api/documents/signed-url",
        headers={"Authorization": "Bearer valid_token_user_a"},
        json={"storage_path": f"{user_b_id}/private_report.pdf"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json().get("detail", "")


def test_patient_isolation_signed_url_path_traversal_denied(client, monkeypatch):
    """Path traversal attempts are rejected with 403."""
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_a_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    # Path traversal attempt
    res = client.post(
        "/api/documents/signed-url",
        headers={"Authorization": "Bearer valid_token_user_a"},
        json={"storage_path": f"{user_a_id}/../{user_b_id}/private_report.pdf"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json().get("detail", "")


def test_rag_index_document_ownership_enforced(client, monkeypatch):
    """User A cannot index User B's document (returns 404)."""
    user_a_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_a_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    # Mock rag_service.index_medical_document to raise PermissionError when doc not found for user_a
    def mock_index(uid, did):
        assert uid == user_a_id
        raise PermissionError("The document was not found for the authenticated user.")

    monkeypatch.setattr(main, "index_medical_document", mock_index)

    res = client.post(
        "/api/rag/index",
        headers={"Authorization": "Bearer valid_token_user_a"},
        json={"document_id": doc_id}
    )
    assert res.status_code == 404
    assert "Document not found for this account" in res.json().get("detail", "")


def test_chat_empty_query_rejected(client, monkeypatch):
    """Chat endpoint rejects empty query with 422."""
    user_id = str(uuid.uuid4())
    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    res = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer valid_token"},
        json={"query": "   "}
    )
    assert res.status_code == 422


def test_chat_emergency_query_bypasses_rag_safely(client, monkeypatch):
    """Emergency symptoms trigger immediate safety alert without calling RAG embeddings or external models."""
    user_id = str(uuid.uuid4())
    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    res = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer valid_token"},
        json={"query": "I am having severe chest pain and cannot breathe"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_emergency"] is True
    assert "emergency" in data["reply"].lower()
    assert data["citations"] == []


def test_document_process_unsupported_type_rejected(client, monkeypatch):
    """Uploading non-medical formats (e.g. .exe or .txt) returns 415 Unsupported Media Type."""
    user_id = str(uuid.uuid4())
    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    res = client.post(
        "/api/documents/process",
        headers={"Authorization": "Bearer valid_token"},
        files={"file": ("virus.exe", b"MZexecutabledata", "application/x-msdownload")}
    )
    assert res.status_code == 415
    assert "PDF, JPEG, PNG, or WebP" in res.json().get("detail", "")
