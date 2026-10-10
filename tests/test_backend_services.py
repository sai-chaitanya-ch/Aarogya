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
