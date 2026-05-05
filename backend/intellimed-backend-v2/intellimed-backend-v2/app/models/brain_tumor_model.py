import json
import numpy as np
import tensorflow as tf
from app.config import BRAIN_TUMOR_CONFIG
from app.utils.image_processor import preprocess_for_tumor

_model = None
_labels = None


def _load():
    global _model, _labels
    if _model is not None:
        return

    _model = tf.keras.models.load_model(BRAIN_TUMOR_CONFIG["model_path"])

    with open(BRAIN_TUMOR_CONFIG["class_labels_path"]) as f:
        raw = json.load(f)              # {"0": "glioma", "1": "meningioma", ...}
    _labels = {int(k): v for k, v in raw.items()}
    print(f"[BrainTumor] Model ready. Labels: {_labels}")


def predict(image_bytes: bytes) -> dict:
    _load()

    img_array = preprocess_for_tumor(
        image_bytes,
        img_size=BRAIN_TUMOR_CONFIG["img_size"]
    )

    probs = _model.predict(img_array, verbose=0)[0]   # shape (4,)
    pred_idx = int(np.argmax(probs))
    prediction = _labels[pred_idx]

    return {
        "prediction": prediction,
        "is_dummy": False,
    }