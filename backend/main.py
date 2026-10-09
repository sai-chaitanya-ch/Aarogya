import os
import uuid
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from ocr_service import extract_text_from_image
from gemini_service import structure_medical_document, ask_aarogya_chat, GEMINI_MODEL, GROQ_MODELS
from storage_service import upload_private_medical_document, generate_signed_url, get_supabase_client

# Load environment variables
load_dotenv()
backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)

app = FastAPI(
    title="Aarogya API",
    description="Backend for Aarogya — AI-Powered Personal Health Copilot by Altrix Labs",
    version="1.0.0"
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "https://aarogya-for-all.netlify.app")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://aarogya.netlify.app",
    "https://aarogya-for-all.netlify.app",
]
if frontend_origin and frontend_origin not in allowed_origins:
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.netlify\.app|https://.*\.onrender\.com|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    language: str = "en"
    context: Optional[str] = ""

class SignedUrlRequest(BaseModel):
    storage_path: str
    expires_in_seconds: int = 3600

@app.get("/")
def root():
    return {
        "service": "Aarogya Health Copilot API",
        "status": "online",
        "altrix_labs": "Production Ready",
        "endpoints": ["/health", "/api/documents/process", "/api/documents/signed-url", "/api/chat"]
    }

@app.get("/health")
def health_check():
    gemini_key = bool(os.getenv("GEMINI_API_KEY"))
    groq_key = bool(os.getenv("GROQ_API_KEY"))
    supabase_configured = bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    
    return {
        "status": "healthy",
        "gemini": {
            "status": "connected" if gemini_key else "missing_key",
            "model": os.getenv("GEMINI_MODEL", GEMINI_MODEL)
        },
        "groq": {
            "status": "connected" if groq_key else "missing_key",
            "models": GROQ_MODELS
        },
        "supabase": "connected" if supabase_configured else "offline",
        "ocr_engine": "tesseract_with_vision_multimodal"
    }

@app.post("/api/documents/process")
async def process_document(
    file: Optional[UploadFile] = File(None),
    preset_type: Optional[str] = Form("custom"),
    patient_name: Optional[str] = Form(""),
    user_id: Optional[str] = Form("usr_patient_01")
):
    """
    1. Runs OCR or extracts directly via Gemini Multimodal Vision / Groq.
    2. Structures medical fields into validated JSON with multilingual summaries.
    3. Saves document to private Supabase storage bucket 'medical-records'.
    4. Records metadata into Supabase Postgres database if available.
    5. Generates a secure temporary signed URL for file access.
    """
    image_bytes = None
    file_name = f"doc_{uuid.uuid4().hex[:8]}.jpg"
    mime_type = "image/jpeg"
    raw_ocr_text = ""

    if file:
        file_name = file.filename or file_name
        mime_type = file.content_type or "image/jpeg"
        image_bytes = await file.read()
        # Step 1: Open-source OCR (falls back smoothly to Vision if tesseract binary is not on host)
        raw_ocr_text = extract_text_from_image(image_bytes)

    # Step 2: Gemini API / Groq structured extraction
    structured_data = structure_medical_document(
        raw_ocr_text=raw_ocr_text,
        image_bytes=image_bytes,
        mime_type=mime_type
    )

    # Override patient name if provided
    if patient_name:
        structured_data["patient_name"] = patient_name

    # Step 3: Upload to Private Supabase Storage bucket
    storage_path = f"{user_id}/{file_name}"
    signed_url = ""
    if image_bytes:
        uploaded_path = upload_private_medical_document(
            user_id=user_id,
            file_name=file_name,
            file_bytes=image_bytes,
            content_type=mime_type
        )
        if uploaded_path:
            storage_path = uploaded_path
            signed_url = generate_signed_url(storage_path, expires_in_seconds=3600)

    # Step 4: Record in Supabase PostgreSQL Table if client is connected
    record_id = f"rec_{uuid.uuid4().hex[:10]}"
    try:
        supabase = get_supabase_client()
        if supabase:
            supabase.table("medical_documents").insert({
                "patient_id": None, # Unassociated in demo mode or set to auth UID
                "title": f"{structured_data.get('document_type', 'Medical Record')} - {structured_data.get('doctor_name', 'Doctor')}",
                "document_type": structured_data.get("document_type", "Prescription"),
                "facility_name": structured_data.get("facility_name", ""),
                "visit_date": structured_data.get("visit_date") or None,
                "storage_path": storage_path,
                "file_name": file_name,
                "status": "verified",
                "ai_summary": structured_data.get("ai_summary", {}),
                "extracted_fields": structured_data,
                "review_alerts": structured_data.get("review_alerts", [])
            }).execute()
    except Exception as db_err:
        print(f"Supabase DB insert notice (can continue safely): {db_err}")

    return {
        "success": True,
        "record_id": record_id,
        "storage_path": storage_path,
        "signed_url": signed_url,
        "is_private_bucket": True,
        "raw_ocr_text": raw_ocr_text,
        "data": structured_data
    }

@app.post("/api/documents/signed-url")
def get_signed_url(payload: SignedUrlRequest):
    """Generates a secure temporary signed URL for a private document path."""
    if not payload.storage_path:
        raise HTTPException(status_code=400, detail="storage_path required")
    url = generate_signed_url(payload.storage_path, payload.expires_in_seconds)
    return {"signed_url": url, "expires_in_seconds": payload.expires_in_seconds}

@app.post("/api/chat")
def chat_endpoint(payload: ChatRequest):
    """Proxies conversational copilot queries through backend to Gemini / Groq API."""
    result = ask_aarogya_chat(
        query=payload.query,
        language=payload.language,
        medical_history_context=payload.context or ""
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
