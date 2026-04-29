import logging
from flask import Blueprint, request, jsonify
from app.utils.image_validator import allowed_image, read_and_validate
from app.models import alzheimer_model

logger = logging.getLogger(__name__)
alzheimer_bp = Blueprint("alzheimer", __name__)

@alzheimer_bp.post("/predict")
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image provided. Send a multipart field named 'image'."}), 400

    file = request.files["image"]

    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400

    if not allowed_image(file.filename):
        return jsonify({"error": "Unsupported file type. Allowed: png, jpg, jpeg, tiff, bmp, webp."}), 415

    try:
        image_bytes = read_and_validate(file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    try:
        

        result = alzheimer_model.predict(image_bytes)
        print(f"[Alzheimer] Predicted: {result['prediction']} ") # ← add
    except Exception as e:
        logger.exception("Alzheimer prediction failed")
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    return jsonify(result), 200