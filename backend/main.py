"""Aarogya FastAPI backend with strict Supabase auth, model routing and per-user RAG."""
from __future__ import annotations

import logging
import os
import uuid
from typing import List, Optional, Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from gemini_service import ModelUnavailableError, ask_aarogya_chat, is_emergency_query, structure_medical_document
from ocr_service import extract_text_from_document
from rag_service import RagUnavailableError, format_context_and_citations, index_medical_document, reindex_user_documents, retrieve_relevant_chunks
from storage_service import StorageUnavailableError, generate_signed_url, get_supabase_client

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=False)
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("aarogya.api")

app = FastAPI(
    title="Aarogya API",
    description="AI health-information API with authorized medical-record retrieval",
    version="2.0.0",
)

origins = {
    "https://aarogya-for-you.netlify.app",
    "https://aarogya-for-all.netlify.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
}
if os.getenv("FRONTEND_ORIGIN", "").strip():
    origins.add(os.getenv("FRONTEND_ORIGIN", "").strip().rstrip("/"))
for value in os.getenv("ADDITIONAL_ALLOWED_ORIGINS", "").split(","):
    if value.strip():
        origins.add(value.strip().rstrip("/"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

security = HTTPBearer(auto_error=False)


def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """Require a real, verified Supabase user session. No demo identities."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to use Aarogya AI.")
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authentication service is not configured.")
    try:
        response = client.auth.get_user(credentials.credentials)
        authenticated_user = getattr(response, "user", None)
        if not authenticated_user or not getattr(authenticated_user, "id", None):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is invalid or expired. Please sign in again.")
        return str(authenticated_user.id)
    except HTTPException:
        raise
    except Exception as exc:
        logger.info("Token validation failed: error_type=%s", type(exc).__name__)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is invalid or expired. Please sign in again.") from exc


class ChatRequest(BaseModel):
    query: Optional[str] = Field(default=None, min_length=1, max_length=4000)
    message: Optional[str] = Field(default=None, min_length=1, max_length=4000)
    language: Literal["en", "te", "hi", "ta"] = "en"
    # Kept for backwards compatibility only. Never trusted for retrieval or prompt context.
    context: Optional[str] = Field(default=None, max_length=20000)


class SignedUrlRequest(BaseModel):
    storage_path: str = Field(min_length=1, max_length=1024)
    expires_in_seconds: int = Field(default=3600, ge=60, le=3600)


class IndexDocumentRequest(BaseModel):
    document_id: uuid.UUID


@app.get("/")
def root():
    return {
        "service": "Aarogya Health Copilot API",
        "status": "online",
        "version": app.version,
        "endpoints": ["/health", "/api/documents/process", "/api/documents/signed-url", "/api/rag/index", "/api/rag/reindex", "/api/chat"],
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "supabase_configured": bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
        "rag_embedding_model": os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"),
    }


@app.post("/api/documents/process")
async def process_document(
    file: UploadFile = File(...),
    preset_type: str = Form("custom"),
    patient_name: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
):
    """Extract a candidate summary. Storage happens once, after patient review/save in the frontend."""
    del user_id  # Identity is verified; the route intentionally does not write any files or records yet.
    allowed_types = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
    mime_type = (file.content_type or "application/octet-stream").lower()
    if mime_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Upload a PDF, JPEG, PNG, or WebP medical document.")
    data = await file.read(20 * 1024 * 1024 + 1)
    await file.close()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds the 20 MB upload limit.")
    if mime_type == "application/pdf" and not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="The file does not appear to be a valid PDF.")
    if mime_type.startswith("image/") and not data.startswith((b"\xff\xd8\xff", b"\x89PNG\r\n\x1a\n", b"RIFF")):
        raise HTTPException(status_code=400, detail="The uploaded file does not appear to be a supported image.")

    raw_text = extract_text_from_document(data, mime_type)
    try:
        result = structure_medical_document(raw_ocr_text=raw_text, image_bytes=data, mime_type=mime_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    provider = result.pop("_model_provider", "unknown")
    model = result.pop("_model_name", "unknown")
    fallback = bool(result.pop("_fallback_used", False))
    if patient_name and not result.get("patient_name"):
        result["patient_name"] = patient_name.strip()[:160]
    # Reflect document type hint only when model could not classify confidently; never invent content.
    hint_map = {"prescription": "Prescription", "cbc": "Lab Report", "discharge": "Discharge Summary"}
    if result.get("document_type") == "Clinical Notes" and preset_type in hint_map:
        result["document_type"] = hint_map[preset_type]

    return {
        "success": True,
        "raw_ocr_text": raw_text,
        "data": result,
        "provider": provider,
        "model": model,
        "fallback_used": fallback,
        "file_stored": False,
        "requires_review": True,
    }


@app.post("/api/documents/signed-url")
def get_signed_url(payload: SignedUrlRequest, user_id: str = Depends(get_current_user_id)):
    path = payload.storage_path.strip().lstrip("/")
    # Browser uploads use {auth.uid()}/{filename}; don't accept any other user's folder.
    if not path.startswith(f"{user_id}/") or ".." in path.split("/"):
        raise HTTPException(status_code=403, detail="Access denied to this document.")
    try:
        url = generate_signed_url(path, payload.expires_in_seconds)
    except StorageUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"signed_url": url, "expires_in_seconds": payload.expires_in_seconds}


@app.post("/api/rag/index")
def index_document(payload: IndexDocumentRequest, user_id: str = Depends(get_current_user_id)):
    """Index the stored OCR and structured data for a document owned by the session user."""
    try:
        return {"success": True, **index_medical_document(user_id, str(payload.document_id))}
    except PermissionError as exc:
        raise HTTPException(status_code=404, detail="Document not found for this account.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RagUnavailableError as exc:
        logger.warning("RAG indexing unavailable: error_type=%s", type(exc).__name__)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("RAG indexing failed: error_type=%s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="The document was saved, but search indexing failed. Retry indexing later.") from exc


@app.post("/api/rag/reindex")
def reindex_documents(user_id: str = Depends(get_current_user_id)):
    """Index existing documents for this authenticated user after RAG is first enabled."""
    try:
        return {"success": True, **reindex_user_documents(user_id)}
    except RagUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("RAG reindex failed: error_type=%s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Could not reindex existing documents. Please try again.") from exc


@app.post("/api/chat")
def chat_endpoint(payload: ChatRequest, user_id: str = Depends(get_current_user_id)):
    """Retrieve authorized chunks server-side, then generate an answer with model fallback."""
    query = (payload.message or payload.query or "").strip()
    if not query:
        raise HTTPException(status_code=422, detail="Enter a message to chat with Aarogya.")
    # Emergency safety response must not depend on embeddings, database availability, or model quotas.
    if is_emergency_query(query):
        return ask_aarogya_chat(query=query, language=payload.language, medical_history_context="", citations=[])
    try:
        retrieval = retrieve_relevant_chunks(user_id, query)
        context, citations = format_context_and_citations(retrieval["hits"])
        result = ask_aarogya_chat(query=query, language=payload.language, medical_history_context=context, citations=citations)
        result["retrieval_mode"] = retrieval["mode"]
        result["retrieved_chunks"] = len(retrieval["hits"])
        return result
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RagUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Aarogya could not access your authorized health records. Please try again.") from exc
    except Exception as exc:
        logger.error("Chat request failed: error_type=%s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Aarogya could not complete this request. Please try again.") from exc


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
