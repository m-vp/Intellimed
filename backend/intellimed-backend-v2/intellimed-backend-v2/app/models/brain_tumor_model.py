"""
Brain Tumor Detection

Expected model output: binary — tumor present or not.
    0 → No Tumor
    1 → Tumor Detected

Supports .keras and .pickle (same pattern as alzheimer_model).
"""

import os
import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

_model = None


def _load_model():
    global _model
    path = Path(os.getenv("BRAIN_TUMOR_MODEL_PATH", "model_weights/brain_tumor.keras"))

    if not path.exists():
        logger.warning(f"[BrainTumor] Model file not found at '{path}'. Will use dummy output.")
        return None

    ext = path.suffix.lower()
    try:
        if ext in (".keras", ".h5"):
            import tensorflow as tf
            model = tf.keras.models.load_model(str(path))
            logger.info(f"[BrainTumor] Keras model loaded from '{path}'")
            return ("keras", model)

        elif ext in (".pickle", ".pkl"):
            import pickle
            with open(path, "rb") as f:
                model = pickle.load(f)
            logger.info(f"[BrainTumor] Pickle model loaded from '{path}'")
            return ("pickle", model)

        else:
            logger.error(f"[BrainTumor] Unsupported format '{ext}'")
            return None

    except Exception as e:
        logger.error(f"[BrainTumor] Failed to load model: {e}")
        return None


def _preprocess(image_bytes: bytes) -> np.ndarray:
    from PIL import Image
    import io
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def predict(image_bytes: bytes) -> dict:
    """
    Run inference and return the prediction dict expected by the frontend.

    Returns:
        {
          "detected":    true,        # bool — is a tumor present?
          "confidence":  91.3,        # how confident the model is (0–100)
          "is_dummy":    false
        }
    """
    global _model

    if _model is None:
        _model = _load_model()

    # ── Dummy ─────────────────────────────────────────────────────────────────
    if _model is None:
        logger.warning("[BrainTumor] Returning DUMMY prediction — model not loaded")
        return {
            "detected":   False,
            "confidence": 78.5,
            "is_dummy":   True,
        }

    # ── Real inference ────────────────────────────────────────────────────────
    kind, model = _model
    tensor = _preprocess(image_bytes)

    if kind == "keras":
        raw = model.predict(tensor, verbose=0)[0]
        # Support both binary sigmoid (shape 1) and softmax (shape 2)
        if raw.shape[0] == 1:
            prob_tumor = float(raw[0])
        else:
            prob_tumor = float(raw[1])

    elif kind == "pickle":
        flat = tensor.reshape(1, -1)
        prob_tumor = float(model.predict_proba(flat)[0][1])

    detected   = prob_tumor >= 0.5
    confidence = round(prob_tumor * 100 if detected else (1 - prob_tumor) * 100, 2)

    return {
        "detected":   detected,
        "confidence": confidence,
        "is_dummy":   False,
    }
