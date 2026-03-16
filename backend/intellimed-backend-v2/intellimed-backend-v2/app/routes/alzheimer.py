"""
POST /api/alzheimer/predict
    Body : multipart/form-data { image: <file> }

Response (success):
    {
      "prediction": "NonDemented",     ← one of 4 class labels
      "confidence": 94.2,              ← 0–100
      "breakdown":  [                  ← all 4 scores
          { "label": "MildDemented",    "score": 1.8 },
          { "label": "ModerateDemented","score": 0.9 },
          { "label": "NonDemented",     "score": 94.2 },
          { "label": "VeryMildDemented","score": 3.1 }
      ],
      "is_dummy": false
    }

Response (error):
    { "error": "human-readable message" }
"""
import logging
from flask import Blueprint, request, jsonify
from app.utils.image_validator import allowed_image, read_and_validate
from app.models import alzheimer_model

logger = logging.getLogger(__name__)
alzheimer_bp = Blueprint("alzheimer", __name__)


@alzheimer_bp.post("/predict")
def predict():
    # ── Validate file ──────────────────────────────────────────────────────────
    if "image" not in request.files:
        return jsonify({"error": "No image provided. Send a multipart field named 'image'."}), 400

    file = request.files["image"]

    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400

    if not allowed_image(file.filename):
        return jsonify({"error": f"Unsupported file type. Allowed: png, jpg, jpeg, tiff, bmp, webp."}), 415

    try:
        image_bytes = read_and_validate(file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    # ── Run model ─────────────────────────────────────────────────────────────
    try:
        result = alzheimer_model.predict(image_bytes)
    except Exception as e:
        logger.exception("Alzheimer prediction failed")
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    return jsonify(result), 200
