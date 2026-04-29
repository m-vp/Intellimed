# """
# Alzheimer's Disease Classification

# Expected model output: 4-class softmax
#     index 0 → MildDemented
#     index 1 → ModerateDemented
#     index 2 → NonDemented
#     index 3 → VeryMildDemented

# Supports .keras (TensorFlow) and .pickle (sklearn / any pickled predictor).
# The model is loaded once (singleton) on the first prediction request.
# """

# import os
# import logging
# import numpy as np
# from pathlib import Path

# logger = logging.getLogger(__name__)

# # Class labels — index order must match your training labels
# CLASSES = ["MildDemented", "ModerateDemented", "NonDemented", "VeryMildDemented"]

# _model = None  # singleton


# def _load_model():
#     global _model
#     path = Path(os.getenv("ALZHEIMER_MODEL_PATH", "model_weights/alzheimer.keras"))

#     if not path.exists():
#         logger.warning(f"[Alzheimer] Model file not found at '{path}'. Will use dummy output.")
#         return None

#     ext = path.suffix.lower()
#     try:
#         if ext == ".keras" or ext == ".h5":
#             import tensorflow as tf
#             model = tf.keras.models.load_model(str(path))
#             logger.info(f"[Alzheimer] Keras model loaded from '{path}'")
#             return ("keras", model)

#         elif ext == ".pickle" or ext == ".pkl":
#             import pickle
#             with open(path, "rb") as f:
#                 model = pickle.load(f)
#             logger.info(f"[Alzheimer] Pickle model loaded from '{path}'")
#             return ("pickle", model)

#         else:
#             logger.error(f"[Alzheimer] Unsupported model format '{ext}'. Use .keras or .pickle")
#             return None

#     except Exception as e:
#         logger.error(f"[Alzheimer] Failed to load model: {e}")
#         return None


# def _preprocess(image_bytes: bytes) -> np.ndarray:
#     """Resize to 224×224, normalize to [0,1], add batch dim → (1, 224, 224, 3)."""
#     from PIL import Image
#     import io
#     img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#     img = img.resize((224, 224))
#     arr = np.array(img, dtype=np.float32) / 255.0
#     return np.expand_dims(arr, axis=0)


# def predict(image_bytes: bytes) -> dict:
#     """
#     Run inference and return the prediction dict expected by the frontend.

#     Returns:
#         {
#           "prediction": "NonDemented",          # one of the 4 CLASSES
#           "confidence": 94.2,                   # percentage, 0–100
#           "breakdown": [                        # all 4 class scores
#               {"label": "MildDemented",    "score": 1.8},
#               {"label": "ModerateDemented","score": 0.9},
#               {"label": "NonDemented",     "score": 94.2},
#               {"label": "VeryMildDemented","score": 3.1},
#           ]
#         }
#     """
#     global _model

#     # Lazy-load
#     if _model is None:
#         _model = _load_model()

#     # ── Model not available → dummy response ──────────────────────────────────
#     if _model is None:
#         logger.warning("[Alzheimer] Returning DUMMY prediction — model not loaded")
#         scores = [8.1, 2.3, 85.4, 4.2]   # dummy probabilities
#         pred_idx = int(np.argmax(scores))
#         return {
#             "prediction": CLASSES[pred_idx],
#             "confidence": scores[pred_idx],
#             "breakdown":  [{"label": c, "score": s} for c, s in zip(CLASSES, scores)],
#             "is_dummy":   True,
#         }

#     # ── Real inference ────────────────────────────────────────────────────────
#     kind, model = _model
#     tensor = _preprocess(image_bytes)

#     if kind == "keras":
#         raw = model.predict(tensor, verbose=0)[0]           # shape (4,)
#         probs = raw.tolist()

#     elif kind == "pickle":
#         # sklearn-style: predict_proba returns (n_samples, n_classes)
#         flat = tensor.reshape(1, -1)
#         probs = model.predict_proba(flat)[0].tolist()

#     scores   = [round(p * 100, 2) for p in probs]
#     pred_idx = int(np.argmax(scores))

#     return {
#         "prediction": CLASSES[pred_idx],
#         "confidence": scores[pred_idx],
#         "breakdown":  [{"label": c, "score": s} for c, s in zip(CLASSES, scores)],
#         "is_dummy":   False,
#     }



import json
import numpy as np
import tensorflow as tf
from app.config import ALZHEIMER_CONFIG
from app.utils.image_processor import preprocess_for_alzheimer

_model = None
_idx_to_class = None


def _load():
    global _model, _idx_to_class
    if _model is not None:
        return

    _model = tf.keras.models.load_model(ALZHEIMER_CONFIG["model_path"])

    with open(ALZHEIMER_CONFIG["class_indices_path"]) as f:
        raw = json.load(f)
    print(f"[Alzheimer] raw class indices: {raw}")   # ← add this
    _idx_to_class = {v: k for k, v in raw.items()}
    print(f"[Alzheimer] Model ready. Classes: {_idx_to_class}")

def predict(image_bytes: bytes) -> dict:
    _load()

    img_array = preprocess_for_alzheimer(
        image_bytes,
        img_size=ALZHEIMER_CONFIG["img_size"]
    )

    probs = _model.predict(img_array, verbose=0)[0]
    pred_idx = int(np.argmax(probs))
    
    
    return {
        "prediction": _idx_to_class[pred_idx],
        # "confidence": round(float(probs[pred_idx]) * 100, 2),
        # "breakdown": [
        #     {"label": _idx_to_class[i], "score": round(float(probs[i]) * 100, 2)}
        #     for i in range(len(probs))
        # ],
        "is_dummy": False,
    }