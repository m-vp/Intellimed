"""
Extract plain text from uploaded documents.
Supports: PDF, DOCX, TXT, PNG/JPG/TIFF (via OCR).
"""
import io
import logging

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "png", "jpg", "jpeg", "tiff", "tif", "bmp"}


def allowed_doc(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS


def extract(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        return _pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return _docx(file_bytes)
    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="replace").strip()
    elif ext in ("png", "jpg", "jpeg", "tiff", "tif", "bmp"):
        return _ocr(file_bytes)
    else:
        raise ValueError(f"Unsupported file type '.{ext}'")


def _pdf(raw: bytes) -> str:
    import fitz  # PyMuPDF
    doc   = fitz.open(stream=raw, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        if text:
            pages.append(text)
        else:
            # Scanned page — OCR the rendered image
            pix = page.get_pixmap(dpi=200)
            pages.append(_ocr(pix.tobytes("png")))
    doc.close()
    result = "\n\n".join(p for p in pages if p)
    if not result:
        raise ValueError("PDF has no extractable text.")
    return result


def _docx(raw: bytes) -> str:
    from docx import Document
    doc   = Document(io.BytesIO(raw))
    lines = [p.text for p in doc.paragraphs if p.text.strip()]
    if not lines:
        raise ValueError("Word document appears to be empty.")
    return "\n".join(lines)


def _ocr(raw: bytes) -> str:
    import pytesseract
    from PIL import Image
    img  = Image.open(io.BytesIO(raw)).convert("RGB")
    text = pytesseract.image_to_string(img, lang="eng").strip()
    if not text:
        raise ValueError("OCR returned no text — ensure the image is clear.")
    return text
