import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_WEIGHTS_DIR = os.path.join(BASE_DIR, "model_weights")

ALZHEIMER_CONFIG = {
    "model_path": os.path.join(MODEL_WEIGHTS_DIR, "alzheimer_cnn.keras"),
    "class_indices_path": os.path.join(BASE_DIR, "alzheimer_class_indices.json"),
    "img_size": (128, 128),
}

BRAIN_TUMOR_CONFIG = {
    "model_path": os.path.join(MODEL_WEIGHTS_DIR, "brain_tumor.keras"),
    "class_labels_path": os.path.join(BASE_DIR, "brain_tumor_labels.json"),
    "img_size": (240, 240),
}

class Config:
    # Flask
    SECRET_KEY  = os.getenv("SECRET_KEY", "dev-secret")
    FLASK_ENV   = os.getenv("FLASK_ENV", "development")
    DEBUG       = FLASK_ENV == "development"

    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Upload size limit
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB

    # Model paths
    ALZHEIMER_MODEL_PATH  = os.getenv("ALZHEIMER_MODEL_PATH",  str(BASE_DIR / "model_weights/alzheimer.keras"))
    BRAIN_TUMOR_MODEL_PATH = os.getenv("BRAIN_TUMOR_MODEL_PATH", str(BASE_DIR / "model_weights/brain_tumor.keras"))

    # Gemini
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL   = os.getenv("GEMINI_MODEL",   "gemini-2.0-flash")

    # RAG vector store: "memory" | "chroma"
    RAG_STORE   = os.getenv("RAG_STORE",   "memory")
    CHROMA_PATH = os.getenv("CHROMA_PATH", str(BASE_DIR / "chroma_db"))
