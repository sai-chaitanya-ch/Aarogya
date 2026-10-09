import io
from PIL import Image, ImageEnhance, ImageFilter

def preprocess_image(image_bytes: bytes) -> Image.Image:
    """Preprocess image for optimal OCR extraction."""
    image = Image.open(io.BytesIO(image_bytes))
    # Convert to grayscale
    gray = image.convert('L')
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(1.8)
    # Median filter to remove noise
    denoised = enhanced.filter(ImageFilter.MedianFilter(size=3))
    return denoised

def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extracts raw text using lightweight open-source OCR (pytesseract).
    Gracefully handles environments where tesseract-ocr binary is not yet installed.
    """
    try:
        import pytesseract
        processed_img = preprocess_image(image_bytes)
        text = pytesseract.image_to_string(processed_img, lang='eng')
        if text and len(text.strip()) > 10:
            return text.strip()
    except Exception as e:
        print(f"Local pytesseract notice: {e}. Moving to secondary parsing.")

    return ""
