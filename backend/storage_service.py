import os
from typing import Optional
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def get_supabase_client() -> Optional[Client]:
    """Initializes Supabase Client using backend credentials."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def upload_private_medical_document(
    user_id: str,
    file_name: str,
    file_bytes: bytes,
    content_type: str = "image/jpeg"
) -> Optional[str]:
    """
    Uploads document to private Supabase bucket 'medical-records'.
    Path: {user_id}/{file_name}
    Returns storage path.
    """
    supabase = get_supabase_client()
    if not supabase:
        return f"{user_id}/{file_name}"

    storage_path = f"{user_id}/{file_name}"
    try:
        supabase.storage.from_("medical-records").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        return storage_path
    except Exception as e:
        print(f"Supabase upload error: {e}")
        return storage_path

def generate_signed_url(storage_path: str, expires_in_seconds: int = 3600) -> str:
    """
    Generates a secure temporary signed URL for a private medical document.
    Ensures documents are NOT exposed via public URLs.
    Default expiry: 60 minutes.
    """
    supabase = get_supabase_client()
    if not supabase:
        # Fallback placeholder when credentials not configured yet
        return f"https://mock-signed-url.aarogya.internal/storage/v1/object/sign/medical-records/{storage_path}?token=mock_token_expires_{expires_in_seconds}s"

    try:
        res = supabase.storage.from_("medical-records").create_signed_url(
            path=storage_path,
            expires_in=expires_in_seconds
        )
        return res.get("signedURL") or res.get("signedUrl") or ""
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        return ""
