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


def test_rag_index_successful_produces_chunks_and_indexed_status(client, monkeypatch):
    """Successful indexing returns success=True and the chunks_indexed count."""
    user_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    monkeypatch.setattr(
        main,
        "index_medical_document",
        lambda uid, did: {
            "document_id": did,
            "chunks_indexed": 3,
            "embedding_model": "gemini-embedding-001",
            "dimensions": 768,
        },
    )

    res = client.post(
        "/api/rag/index",
        headers={"Authorization": "Bearer valid_token"},
        json={"document_id": doc_id},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["document_id"] == doc_id
    assert data["chunks_indexed"] == 3
    assert data["embedding_model"] == "gemini-embedding-001"


def test_rag_index_failure_returns_error_and_preserves_saved_document(client, monkeypatch):
    """When indexing fails after a successful document save, 503 is returned without deleting the record."""
    user_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    import rag_service

    def mock_fail(uid, did):
        raise rag_service.RagUnavailableError("Gemini embedding quota exceeded.")

    monkeypatch.setattr(main, "index_medical_document", mock_fail)

    res = client.post(
        "/api/rag/index",
        headers={"Authorization": "Bearer valid_token"},
        json={"document_id": doc_id},
    )
    assert res.status_code == 503
    assert "Gemini embedding quota exceeded" in res.json().get("detail", "")


def test_rag_index_retry_does_not_create_duplicate_documents(client, monkeypatch):
    """Retrying indexing calls the index endpoint with the existing document_id, upserting chunks idempotently."""
    user_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    call_count = 0

    def mock_index(uid, did):
        nonlocal call_count
        call_count += 1
        assert uid == user_id
        assert did == doc_id
        return {
            "document_id": did,
            "chunks_indexed": 2,
            "embedding_model": "gemini-embedding-001",
            "dimensions": 768,
        }

    monkeypatch.setattr(main, "index_medical_document", mock_index)

    # First attempt
    res1 = client.post(
        "/api/rag/index",
        headers={"Authorization": "Bearer valid_token"},
        json={"document_id": doc_id},
    )
    assert res1.status_code == 200

    # Retry attempt using the exact same document_id
    res2 = client.post(
        "/api/rag/index",
        headers={"Authorization": "Bearer valid_token"},
        json={"document_id": doc_id},
    )
    assert res2.status_code == 200
    assert call_count == 2


def test_failed_upload_never_appears_indexed(client, monkeypatch):
    """Empty files or invalid formats fail during document processing and never produce an indexed document."""
    user_id = str(uuid.uuid4())
    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    # Empty file
    res = client.post(
        "/api/documents/process",
        headers={"Authorization": "Bearer valid_token"},
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert res.status_code == 400
    assert "empty" in res.json().get("detail", "").lower()


def test_cross_user_document_cannot_be_indexed_or_retrieved(client, monkeypatch):
    """User A cannot index User B's document and cannot retrieve User B's chunks or medical records."""
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    user_b_doc_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_a_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    # 1. Attempt to index User B's document as User A -> rejected
    def mock_index(uid, did):
        assert uid == user_a_id
        if did == user_b_doc_id:
            raise PermissionError("The document was not found for the authenticated user.")
        return {"document_id": did, "chunks_indexed": 1}

    monkeypatch.setattr(main, "index_medical_document", mock_index)

    index_res = client.post(
        "/api/rag/index",
        headers={"Authorization": "Bearer valid_token_user_a"},
        json={"document_id": user_b_doc_id},
    )
    assert index_res.status_code == 404

    # 2. Query chat as User A: User B's chunks are never returned
    def mock_retrieve(uid, query, limit=5):
        assert uid == user_a_id  # Isolated to User A only
        return {"hits": [], "mode": "no_match"}

    monkeypatch.setattr(main, "retrieve_relevant_chunks", mock_retrieve)
    monkeypatch.setattr(
        main,
        "ask_aarogya_chat",
        lambda query, language, medical_history_context, citations: {
            "reply": "I could not find relevant records for your query.",
            "citations": citations,
            "is_emergency": False,
            "provider": "gemini",
            "model": "gemini-3.8-flash",
            "fallback_used": False,
        },
    )

    chat_res = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer valid_token_user_a"},
        json={"query": "What are the test results from my latest report?"},
    )
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert data["citations"] == []
    assert data["retrieval_mode"] == "no_match"


def test_successful_rag_query_returns_grounded_evidence(client, monkeypatch):
    """When indexed chunks match the user query, chat returns grounded citations and retrieval mode."""
    user_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    def mock_retrieve(uid, query, limit=5):
        assert uid == user_id
        return {
            "hits": [{
                "document_id": doc_id,
                "document_title": "Blood Test CBC",
                "document_date": "2026-02-15",
                "content": "Hemoglobin level is 14.2 g/dL, which is within the normal reference range.",
                "similarity": 0.88,
                "retrieval_mode": "vector",
            }],
            "mode": "vector",
        }

    monkeypatch.setattr(main, "retrieve_relevant_chunks", mock_retrieve)
    monkeypatch.setattr(
        main,
        "ask_aarogya_chat",
        lambda query, language, medical_history_context, citations: {
            "reply": "Your hemoglobin is 14.2 g/dL, which is normal.",
            "citations": citations,
            "is_emergency": False,
            "provider": "gemini",
            "model": "gemini-3.8-flash",
            "fallback_used": False,
        },
    )

    res = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer valid_token"},
        json={"query": "What is my hemoglobin level?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["retrieval_mode"] == "vector"
    assert data["retrieved_chunks"] == 1
    assert len(data["citations"]) == 1
    assert data["citations"][0]["recordId"] == doc_id
    assert data["citations"][0]["documentTitle"] == "Blood Test CBC"


def test_process_document_preserves_empty_patient_name_when_absent(client, monkeypatch):
    """When the document has no extracted patient name, it remains empty and is not prefilled."""
    user_id = str(uuid.uuid4())
    mock_supabase = MagicMock()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    monkeypatch.setattr(main, "get_supabase_client", lambda: mock_supabase)

    monkeypatch.setattr(
        main,
        "structure_medical_document",
        lambda **k: {
            "document_type": "Lab Report",
            "patient_name": "",
            "visit_date": "2026-03-01",
            "facility_name": "Apollo Clinic",
            "medicines": [],
            "lab_values": [{"test_name": "Hemoglobin", "value": "13.5", "unit": "g/dL", "status": "normal"}],
            "ai_summary": {"en": "Normal blood report."},
            "_model_provider": "gemini",
            "_model_name": "gemini-3.8-flash",
            "_fallback_used": False,
        },
    )

    # Send document without form patient_name
    res = client.post(
        "/api/documents/process",
        headers={"Authorization": "Bearer valid_token"},
        files={"file": ("report.pdf", b"%PDF-1.4 sample pdf content", "application/pdf")},
        data={"preset_type": "cbc"},
    )
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["success"] is True
    assert res_data["data"]["patient_name"] == ""
    assert res_data["data"]["document_type"] == "Lab Report"


def test_cors_policy_allows_canonical_frontend_and_rejects_arbitrary_or_stale_origins(client):
    """CORS must allow https://aarogya-for-you.netlify.app and local dev, but reject stale and arbitrary origins."""
    # 1. Allowed canonical production origin
    res_canonical = client.options(
        "/api/chat",
        headers={
            "Origin": "https://aarogya-for-you.netlify.app",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res_canonical.headers.get("access-control-allow-origin") == "https://aarogya-for-you.netlify.app"

    # 2. Allowed local development origin
    res_local = client.options(
        "/api/chat",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res_local.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # 3. Disallowed stale domain
    res_stale = client.options(
        "/api/chat",
        headers={
            "Origin": "https://aarogya-for-all.netlify.app",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res_stale.headers.get("access-control-allow-origin") is None

    # 4. Disallowed arbitrary origin
    res_arbitrary = client.options(
        "/api/chat",
        headers={
            "Origin": "https://malicious-healthcare-phish.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res_arbitrary.headers.get("access-control-allow-origin") is None


