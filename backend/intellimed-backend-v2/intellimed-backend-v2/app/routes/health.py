"""GET /api/health — liveness check used by frontend and load balancers."""
import os
from pathlib import Path
from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)



@health_bp.get("/health")
def health():
    alz_path   = Path(os.getenv("ALZHEIMER_MODEL_PATH",   "model_weights/alzheimer.keras"))
    tumor_path = Path(os.getenv("BRAIN_TUMOR_MODEL_PATH", "model_weights/brain_tumor.keras"))

    return jsonify({
        "status": "ok",
        "models": {
            "alzheimer":   "loaded" if alz_path.exists()   else "missing — will use dummy",
            "brain_tumor": "loaded" if tumor_path.exists() else "missing — will use dummy",
        },
        "rag_store": os.getenv("RAG_STORE", "memory"),
        "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
    }), 200
