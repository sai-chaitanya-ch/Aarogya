"""OCR helpers for image and PDF medical records."""
from __future__ import annotations

import io
import logging
from typing import Optional

from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger("aarogya.ocr")


def preprocess_image(image_bytes: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    return ImageEnhance.Contrast(image).enhance(1.8).filter(ImageFilter.MedianFilter(size=3))


def _ocr_image(image: Image.Image) -> str:
    try:
        import pytesseract
        text = pytesseract.image_to_string(image, lang="eng")
        return text.strip()
    except Exception as exc:
        logger.info("Local OCR unavailable: error_type=%s", type(exc).__name__)
        return ""


def extract_text_from_document(file_bytes: bytes, mime_type: str) -> str:
    """Extract text from selectable-text PDFs or OCR an image/scanned PDF when possible."""
    if mime_type == "application/pdf" or file_bytes.startswith(b"%PDF"):
        try:
            import fitz  # PyMuPDF
            with fitz.open(stream=file_bytes, filetype="pdf") as pdf:
                page_text = [page.get_text("text").strip() for page in pdf[:10]]
                combined = "\n\n".join(text for text in page_text if text)
                if len(combined) >= 20:
                    return combined[:80000]
                # OCR a limited number of pages if the PDF is image-only.
                image_text = []
                for page in pdf[:5]:
                    pix = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
                    image = Image.open(io.BytesIO(pix.tobytes("png")))
                    text = _ocr_image(preprocess_image(io.BytesIO(pix.tobytes("png")).getvalue()))
                    if text:
                        image_text.append(text)
                return "\n\n".join(image_text)[:80000]
        except Exception as exc:
            logger.info("PDF text extraction failed: error_type=%s", type(exc).__name__)
            return ""
    try:
        return _ocr_image(preprocess_image(file_bytes))[:80000]
    except Exception as exc:
        logger.info("Image OCR failed: error_type=%s", type(exc).__name__)
        return ""

# Backwards-compatible import name for older callers.
def extract_text_from_image(image_bytes: bytes) -> str:
    return extract_text_from_document(image_bytes, "image/jpeg")


def optimize_image_for_vision(file_bytes: bytes, mime_type: str, max_dimension: int = 1600) -> tuple[Optional[bytes], str]:
    """Compress and downscale image or scanned PDF for AI vision.

    Prevents transmission timeouts and excessive base64 payload sizes when calling
    remote multimodal LLMs (e.g. Gemini Vision). Returns (optimized_bytes, effective_mime_type).
    """
    if not file_bytes:
        return None, mime_type

    # Case 1: PDF document
    if mime_type == "application/pdf" or file_bytes.startswith(b"%PDF"):
        try:
            import fitz  # PyMuPDF
            with fitz.open(stream=file_bytes, filetype="pdf") as pdf:
                if len(pdf) > 0:
                    page = pdf[0]
                    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    if img.width > max_dimension or img.height > max_dimension:
                        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                    buf = io.BytesIO()
                    img.convert("RGB").save(buf, format="JPEG", quality=85, optimize=True)
                    return buf.getvalue(), "image/jpeg"
        except Exception as exc:
            logger.info("PDF vision rendering fallback: error_type=%s", type(exc).__name__)
        # Fallback for PDF if rendering fails: only return raw bytes if small (<= 3MB)
        if len(file_bytes) <= 3 * 1024 * 1024:
            return file_bytes, "application/pdf"
        return None, mime_type

    # Case 2: Image formats (JPEG, PNG, WebP)
    try:
        img = Image.open(io.BytesIO(file_bytes))
        # If image is already compact (<= max_dimension and <= 500KB), return as is
        if max(img.width, img.height) <= max_dimension and len(file_bytes) <= 500 * 1024:
            return file_bytes, mime_type

        # Downscale if needed
        if img.width > max_dimension or img.height > max_dimension:
            img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        # Handle transparency if present
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            bg.save(buf, format="JPEG", quality=85, optimize=True)
        else:
            img.convert("RGB").save(buf, format="JPEG", quality=85, optimize=True)
        return buf.getvalue(), "image/jpeg"
    except Exception as exc:
        logger.info("Image vision optimization failed: error_type=%s", type(exc).__name__)
        if len(file_bytes) <= 3 * 1024 * 1024:
            return file_bytes, mime_type
        return None, mime_type

