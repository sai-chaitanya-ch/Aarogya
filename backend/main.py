import os
import uuid
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from ocr_service import extract_text_from_image
from gemini_service import structure_medical_document, ask_aarogya_chat
from storage_service import upload_private_medical_document, generate_signed_url

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Aarogya API",
    description="Backend for Aarogya — AI-Powered Personal Health Copilot by Altrix Labs",
    version="1.0.0"
)

# Enable CORS for Netlify and localhost
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://aarogya.netlify.app",
    "*"  # Allows all origins for development and Netlify previews
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
        "altrix_labs": "Round 1 Prototype",
        "endpoints": ["/health", "/api/documents/process", "/api/documents/signed-url", "/api/chat"]
    }

@app.get("/health")
def health_check():
    gemini_configured = bool(os.getenv("GEMINI_API_KEY"))
    supabase_configured = bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    return {
        "status": "healthy",
        "gemini_api": "connected" if gemini_configured else "mock_mode",
        "supabase": "connected" if supabase_configured else "mock_mode",
        "ocr_engine": "tesseract_with_gemini_vision"
    }

@app.post("/api/documents/process")
async def process_document(
    file: Optional[UploadFile] = File(None),
    preset_type: Optional[str] = Form("prescription"),
    patient_name: Optional[str] = Form("Chaitanya"),
    user_id: Optional[str] = Form("usr_default_01")
):
    """
    1. Runs lightweight open-source OCR on uploaded document.
    2. Sends OCR text or image to Gemini API to extract verified structured fields & multilingual summaries.
    3. Saves original file to private Supabase bucket 'medical-records'.
    4. Generates a secure temporary signed URL for file access.
    """
    image_bytes = None
    file_name = f"doc_{uuid.uuid4().hex[:8]}.jpg"
    mime_type = "image/jpeg"
    raw_ocr_text = ""

    if file:
        file_name = file.filename or file_name
        mime_type = file.content_type or "image/jpeg"
        image_bytes = await file.read()
        # Step 1: Open-source OCR
        raw_ocr_text = extract_text_from_image(image_bytes)

    # Step 2: Gemini API structured extraction & simple-language translation
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
    if image_bytes:
        storage_path = upload_private_medical_document(
            user_id=user_id,
            file_name=file_name,
            file_bytes=image_bytes,
            content_type=mime_type
        ) or storage_path

    # Step 4: Generate Temporary Signed URL (Private access only)
    signed_url = generate_signed_url(storage_path, expires_in_seconds=3600)

    return {
        "success": True,
        "record_id": f"rec_{uuid.uuid4().hex[:10]}",
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
    """Proxies conversational copilot queries through backend to Gemini API."""
    result = ask_aarogya_chat(
        query=payload.query,
        language=payload.language,
        medical_history_context=payload.context or ""
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
