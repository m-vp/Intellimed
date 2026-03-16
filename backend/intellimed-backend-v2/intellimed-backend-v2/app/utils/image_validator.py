"""
Validate and read an uploaded image file before passing bytes to the model.
"""
import io

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "tiff", "tif", "bmp", "webp"}


def allowed_image(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS


def read_and_validate(file_storage) -> bytes:
    """
    Read bytes from a Flask FileStorage object and do basic sanity checks.
    Raises ValueError with a user-friendly message on failure.
    """
    from PIL import Image

    raw = file_storage.read()
    if len(raw) == 0:
        raise ValueError("Uploaded file is empty.")

    try:
        img = Image.open(io.BytesIO(raw))
        img.verify()  # checks for corruption without fully decoding
    except Exception:
        raise ValueError("File does not appear to be a valid image.")

    return raw
