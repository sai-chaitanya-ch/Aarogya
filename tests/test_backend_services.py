import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

import gemini_service
import rag_service


def test_chunk_text_splits_long_documents_with_overlap():
    text = ("Hemoglobin is a test value. " * 160).strip()
    chunks = rag_service.chunk_text(text)
    assert len(chunks) >= 2
    assert all(0 < len(chunk) <= rag_service.CHUNK_SIZE for chunk in chunks)
    assert "Hemoglobin" in chunks[0]


def test_document_text_includes_source_ocr_and_metadata():
    result = rag_service._document_text({
        "title": "CBC report",
        "document_type": "Lab Report",
        "visit_date": "2026-01-10",
        "facility_name": "Example Lab",
        "extracted_fields": {"raw_ocr_text": "Hemoglobin: 13 g/dL", "medicines": [], "lab_values": []},
        "ai_summary": {"en": "A laboratory report."},
        "review_alerts": [],
    })
    assert "Hemoglobin: 13 g/dL" in result
    assert "CBC report" in result


def test_model_router_falls_back_from_gemini_to_groq(monkeypatch):
    calls = []
    monkeypatch.setenv("GEMINI_MODELS", "gemini-3.8-flash")
    monkeypatch.setenv("GROQ_MODELS", "llama-3.3-70b-versatile,llama-3.1-8b-instant")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GROQ_API_KEY", "test-key")

    monkeypatch.setattr(gemini_service, "_call_gemini", lambda *a, **k: calls.append(("gemini", a[2])) or None)
    monkeypatch.setattr(gemini_service, "_call_groq", lambda *a, **k: calls.append(("groq", a[2])) or ("A grounded response." if a[2] == "llama-3.1-8b-instant" else None))
    result = gemini_service.generate_text("hi", system_instruction="be safe")

    assert result.provider == "groq"
    assert result.model == "llama-3.1-8b-instant"
    assert result.fallback_used is True
    assert calls[0] == ("gemini", "gemini-3.8-flash")


def test_emergency_query_is_detected_without_model_call():
    assert gemini_service.is_emergency_query("I have severe chest pain") is True
    assert gemini_service.is_emergency_query("What does hemoglobin mean?") is False


def test_conversational_query_bypasses_rag_retrieval():
    """Greetings and pleasantries bypass embedding generation and vector search completely."""
    res = rag_service.retrieve_relevant_chunks("dummy_user", "Hello")
    assert res["hits"] == []
    assert res["mode"] == "conversational"


def test_no_documents_precheck_bypasses_embedding(monkeypatch):
    """When user has 0 records in database, vector embedding is never called."""
    mock_supabase = __import__("unittest.mock").mock.MagicMock()
    # Return empty list for select('id').eq('patient_id', ...).limit(1)
    mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = (
        __import__("unittest.mock").mock.MagicMock(data=[])
    )
    monkeypatch.setattr(rag_service, "get_supabase_client", lambda: mock_supabase)

    embed_called = []
    monkeypatch.setattr(rag_service, "_embed", lambda *a: embed_called.append(True) or [0.1] * 768)

    res = rag_service.retrieve_relevant_chunks("user_no_docs", "What is my cholesterol level?")
    assert res["hits"] == []
    assert res["mode"] == "no_documents"
    assert len(embed_called) == 0  # _embed was never called!


def test_gemini_quota_exhausted_fast_failover_to_groq(monkeypatch):
    """When Gemini returns 429/403, remaining Gemini models are skipped and Groq is immediately used."""
    gemini_calls = []
    groq_calls = []

    monkeypatch.setenv("GEMINI_MODELS", "gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash")
    monkeypatch.setenv("GROQ_MODELS", "llama-3.3-70b-versatile")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GROQ_API_KEY", "test-key")

    def mock_gemini(*args, **kwargs):
        gemini_calls.append(args[2])
        raise gemini_service.QuotaExhaustedError("Rate limited 429")

    def mock_groq(*args, **kwargs):
        groq_calls.append(args[2])
        return "Fast response from Groq."

    monkeypatch.setattr(gemini_service, "_call_gemini", mock_gemini)
    monkeypatch.setattr(gemini_service, "_call_groq", mock_groq)

    result = gemini_service.generate_text("query", system_instruction="system")
    assert result.provider == "groq"
    assert result.text == "Fast response from Groq."
    assert len(gemini_calls) == 1  # Only 1 Gemini call before immediate failover, skipped remaining 2!
    assert len(groq_calls) == 1


def test_groq_rejected_for_image_when_allow_groq_is_false():
    """Groq fallback is never attempted on image-only inputs without OCR text."""
    try:
        gemini_service.generate_text(
            prompt="summarize this image",
            image_bytes=b"fake-image-bytes",
            allow_groq=False,
        )
        assert False, "Should have raised ModelUnavailableError"
    except gemini_service.ModelUnavailableError as exc:
        assert "Gemini vision is unavailable" in str(exc)


def test_deprecated_models_are_filtered_from_candidates(monkeypatch):
    """Deprecated models (e.g., 2.0-flash, 1.5-flash, mixtral) are stripped out."""
    monkeypatch.setenv("GEMINI_MODELS", "gemini-2.0-flash,gemini-3.8-flash,gemini-1.5-flash")
    monkeypatch.setenv("GROQ_MODELS", "qwen/qwen3.8-27b,llama-3.3-70b-versatile,openai/gpt-oss-120b")

    gemini_candidates = gemini_service.get_candidate_gemini_models()
    groq_candidates = gemini_service.get_candidate_groq_models()

    assert "gemini-2.0-flash" not in gemini_candidates
    assert "gemini-1.5-flash" not in gemini_candidates
    assert "gemini-3.8-flash" in gemini_candidates

    assert "qwen/qwen3.8-27b" not in groq_candidates
    assert "openai/gpt-oss-120b" not in groq_candidates
    assert "llama-3.3-70b-versatile" in groq_candidates


def test_rag_embed_retries_on_transient_503(monkeypatch):
    """_embed retries on transient 503 and returns embedding once successful."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    call_count = 0

    class MockResponse:
        def __init__(self, status_code, json_data, headers=None):
            self.status_code = status_code
            self._json = json_data
            self.headers = headers or {}

        def json(self):
            return self._json

    mock_client = __import__("unittest.mock").mock.MagicMock()

    def mock_post(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return MockResponse(503, {"error": "Service unavailable"})
        return MockResponse(200, {"embedding": {"values": [0.05] * 768}})

    mock_client.post = mock_post
    monkeypatch.setattr(rag_service, "get_rag_http_client", lambda: mock_client)
    monkeypatch.setattr(__import__("time"), "sleep", lambda s: None)

    embedding = rag_service._embed("test text", "RETRIEVAL_DOCUMENT")
    assert len(embedding) == 768
    assert call_count == 2


def test_synthetic_cbc_workflow_extraction_indexing_and_retrieval(monkeypatch):
    """End-to-end synthetic CBC workflow: text extraction, RAG chunking & indexing, and query retrieval."""
    cbc_text = (
        "City Care Diagnostics\n"
        "Patient: Rahul Verma | Age: 34 | Gender: Male | Date: 2026-02-10\n"
        "Test: Complete Blood Count (CBC)\n"
        "Hemoglobin: 14.1 g/dL (Normal Range: 13.0 - 17.0 g/dL)\n"
        "WBC Count: 6,800 /uL (Normal Range: 4,000 - 11,000 /uL)\n"
        "Platelet Count: 250,000 /uL (Normal Range: 150,000 - 450,000 /uL)\n"
        "RBC Count: 4.8 mil/uL (Normal Range: 4.5 - 5.9 mil/uL)\n"
        "Impression: Normal Complete Blood Count.\n"
    )

    # 1. Test structuring via model mock
    monkeypatch.setattr(
        gemini_service,
        "generate_text",
        lambda *args, **kwargs: gemini_service.ModelResult(
            text=__import__("json").dumps({
                "document_type": "Lab Report",
                "patient_name": "Rahul Verma",
                "visit_date": "2026-02-10",
                "facility_name": "City Care Diagnostics",
                "medicines": [],
                "lab_values": [
                    {"test_name": "Hemoglobin", "value": "14.1", "unit": "g/dL", "reference_range": "13.0 - 17.0", "status": "normal"},
                    {"test_name": "WBC Count", "value": "6800", "unit": "/uL", "reference_range": "4000 - 11000", "status": "normal"},
                    {"test_name": "Platelet Count", "value": "250000", "unit": "/uL", "reference_range": "150000 - 450000", "status": "normal"},
                ],
                "ai_summary": {"en": "Complete Blood Count is normal with hemoglobin at 14.1 g/dL."},
                "review_alerts": [],
            }),
            provider="gemini",
            model="gemini-3.8-flash",
            fallback_used=False,
        ),
    )

    extracted = gemini_service.structure_medical_document(raw_ocr_text=cbc_text, image_bytes=None)
    assert extracted["document_type"] == "Lab Report"
    assert extracted["patient_name"] == "Rahul Verma"
    assert len(extracted["lab_values"]) == 3
    assert extracted["lab_values"][0]["test_name"] == "Hemoglobin"
    assert extracted["lab_values"][0]["value"] == "14.1"

    # 2. Test RAG document indexing
    user_id = "test-user-123"
    doc_id = "test-doc-456"

    mock_row = {
        "id": doc_id,
        "patient_id": user_id,
        "title": "CBC Report — City Care Diagnostics",
        "document_type": "Lab Report",
        "visit_date": "2026-02-10",
        "facility_name": "City Care Diagnostics",
        "ai_summary": extracted["ai_summary"],
        "extracted_fields": {
            "doctor_name": "",
            "raw_ocr_text": cbc_text,
            "medicines": [],
            "lab_values": extracted["lab_values"],
        },
        "review_alerts": [],
    }

    mock_supabase = __import__("unittest.mock").mock.MagicMock()
    mock_select = mock_supabase.table.return_value.select.return_value
    mock_select.eq.return_value.limit.return_value.execute.return_value = __import__("unittest.mock").mock.MagicMock(data=[mock_row])
    mock_select.eq.return_value.eq.return_value.limit.return_value.execute.return_value = __import__("unittest.mock").mock.MagicMock(data=[mock_row])

    upserted_rows = []
    mock_supabase.table.return_value.upsert.side_effect = lambda rows, **kwargs: (
        upserted_rows.extend(rows) or __import__("unittest.mock").mock.MagicMock()
    )

    monkeypatch.setattr(rag_service, "get_supabase_client", lambda: mock_supabase)
    monkeypatch.setattr(rag_service, "_embed", lambda text, task: [0.1] * 768)

    index_result = rag_service.index_medical_document(user_id, doc_id)
    assert index_result["document_id"] == doc_id
    assert index_result["chunks_indexed"] >= 1
    assert len(upserted_rows) >= 1
    assert "Hemoglobin" in upserted_rows[0]["content"]

    # 3. Test retrieval returns matching chunk
    mock_supabase.rpc.return_value.execute.return_value = __import__("unittest.mock").mock.MagicMock(
        data=[{
            "chunk_id": "chunk-1",
            "document_id": doc_id,
            "chunk_index": 0,
            "content": upserted_rows[0]["content"],
            "metadata": {"title": "CBC Report", "visit_date": "2026-02-10"},
            "similarity": 0.89,
        }]
    )
    retrieval = rag_service.retrieve_relevant_chunks(user_id, "What is my hemoglobin level?")
    assert retrieval["mode"] == "vector"
    assert len(retrieval["hits"]) == 1
    assert "Hemoglobin" in retrieval["hits"][0]["content"]

