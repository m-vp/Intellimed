from flask import Blueprint, jsonify

work_bp = Blueprint("work", __name__)

@work_bp.get("/work")
def work():
    return jsonify({"status": "success"}), 200