"""Private Supabase Storage and service-client helpers. No mock URLs or fake success."""
from __future__ import annotations

import os
from typing import Any, Optional

from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=False)

try:
    from supabase import create_client
except ImportError:
    create_client = None


class StorageUnavailableError(RuntimeError):
    pass


def get_supabase_client() -> Optional[Any]:
    if not create_client:
        return None
    url = os.getenv("SUPABASE_URL", "").strip()
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not service_key:
        return None
    try:
        return create_client(url, service_key)
    except Exception:
        return None


def upload_private_medical_document(user_id: str, file_name: str, file_bytes: bytes, content_type: str = "image/jpeg") -> str:
    client = get_supabase_client()
    if not client:
        raise StorageUnavailableError("Supabase Storage is not configured on the backend.")
    safe_name = os.path.basename(file_name).replace("\\", "_")
    storage_path = f"{user_id}/{safe_name}"
    try:
        try:
            client.storage.create_bucket("medical-records", options={"public": False})
        except Exception:
            pass
        client.storage.from_("medical-records").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        return storage_path
    except Exception as exc:
        raise StorageUnavailableError("The document could not be uploaded to private storage.") from exc


def generate_signed_url(storage_path: str, expires_in_seconds: int = 3600) -> str:
    client = get_supabase_client()
    if not client:
        raise StorageUnavailableError("Supabase Storage is not configured on the backend.")
    expiry = max(60, min(int(expires_in_seconds), 3600))
    try:
        result = client.storage.from_("medical-records").create_signed_url(storage_path, expiry)
        if isinstance(result, dict):
            url = result.get("signedURL") or result.get("signedUrl")
        else:
            url = getattr(result, "signed_url", None) or getattr(result, "signedURL", None)
        if not url:
            raise StorageUnavailableError("Supabase did not return a signed URL.")
        return str(url)
    except StorageUnavailableError:
        raise
    except Exception as exc:
        raise StorageUnavailableError("A temporary private document link could not be created.") from exc
