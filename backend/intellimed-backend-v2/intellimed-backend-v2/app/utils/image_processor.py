import numpy as np
from PIL import Image
import io

def preprocess_for_alzheimer(image_bytes: bytes, img_size=(128, 128)) -> np.ndarray:
    """
    Mirrors the Kaggle training pipeline exactly.
    Rescaling(1./255) is baked INTO the model, so we do NOT divide here.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(img_size)
    arr = np.array(img, dtype=np.float32)       # (128, 128, 3)
    arr = np.expand_dims(arr, axis=0)           # (1, 128, 128, 3)
    return arr