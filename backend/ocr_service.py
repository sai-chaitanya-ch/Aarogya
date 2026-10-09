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
