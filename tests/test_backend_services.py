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
    monkeypatch.setenv("GROQ_MODELS", "qwen/qwen3.8-27b,openai/gpt-oss-120b")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GROQ_API_KEY", "test-key")

    monkeypatch.setattr(gemini_service, "_call_gemini", lambda *a, **k: calls.append(("gemini", a[2])) or None)
    monkeypatch.setattr(gemini_service, "_call_groq", lambda *a, **k: calls.append(("groq", a[2])) or ("A grounded response." if a[2] == "openai/gpt-oss-120b" else None))
    result = gemini_service.generate_text("hi", system_instruction="be safe")

    assert result.provider == "groq"
    assert result.model == "openai/gpt-oss-120b"
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

    monkeypatch.setenv("GEMINI_MODELS", "gemini-2.0-flash,gemini-1.5-flash,gemini-2.0-flash-lite")
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

