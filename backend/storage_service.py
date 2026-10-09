import os
from typing import Optional, Any
try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

def get_supabase_client() -> Optional[Any]:
    """Initializes Supabase Client using backend credentials."""
    if not create_client:
        return None
    supabase_url = os.getenv("SUPABASE_URL", "")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_role_key:
        return None
    try:
        return create_client(supabase_url, service_role_key)
    except Exception as e:
        print(f"Supabase client init error: {e}")
        return None

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
    storage_path = f"{user_id}/{file_name}"
    if not supabase:
        return storage_path

    try:
        supabase.storage.from_("medical-records").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        return storage_path
    except Exception as e:
        print(f"Supabase upload notice: {e}")
        return storage_path

def generate_signed_url(storage_path: str, expires_in_seconds: int = 3600) -> str:
    """
    Generates a secure temporary signed URL for a private medical document.
    Ensures documents are NOT exposed via public URLs.
    Default expiry: 60 minutes.
    """
    supabase = get_supabase_client()
    if not supabase:
        return f"https://mock-signed-url.aarogya.internal/storage/v1/object/sign/medical-records/{storage_path}?token=mock_token_expires_{expires_in_seconds}s"

    try:
        res = supabase.storage.from_("medical-records").create_signed_url(
            path=storage_path,
            expires_in=expires_in_seconds
        )
        if isinstance(res, dict):
            return res.get("signedURL") or res.get("signedUrl") or ""
        return str(res)
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        return ""
