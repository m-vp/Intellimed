"""
POST /api/rag/upload
    Body : multipart/form-data { file: <file> }

    Response:
        { "session_id": "uuid", "chunks_indexed": 12 }

POST /api/rag/query
    Body : application/json { "session_id": "uuid", "question": "..." }

    Response:
        { "answer": "..." }
"""
import logging
from flask import Blueprint, request, jsonify
from app.utils.doc_parser import allowed_doc, extract
from app.models import rag_pipeline

logger = logging.getLogger(__name__)
rag_bp = Blueprint("rag", __name__)


# @rag_bp.post("/upload")
# def upload():
#     print("hello")
#     if "file" not in request.files:
#         return jsonify({"error": "No file provided. Send a multipart field named 'file'."}), 400

#     file = request.files["file"]

#     if not file.filename:
#         return jsonify({"error": "Empty filename."}), 400

#     if not allowed_doc(file.filename):
#         return jsonify({"error": "Unsupported file type. Allowed: pdf, docx, txt, png, jpg, jpeg, tiff, bmp."}), 415

#     # Extract text
#     try:
#         raw  = file.read()
#         text = extract(raw, file.filename)
#     except ValueError as e:
#         return jsonify({"error": str(e)}), 422
#     except Exception as e:
#         logger.exception("Document extraction failed")
#         return jsonify({"error": f"Could not read document: {e}"}), 500

#     # Index in vector store
#     try:
#         result = rag_pipeline.upload(text, file.filename)
#     except ValueError as e:
#         return jsonify({"error": str(e)}), 422
#     except Exception as e:
#         logger.exception("RAG indexing failed")
#         return jsonify({"error": f"Indexing failed: {e}"}), 500

#     print("success")

#     return jsonify(result), 200

@rag_bp.post("/upload")
def upload():
    print("hello")

    if "file" not in request.files:
        return jsonify({"error": "No file provided. Send a multipart field named 'file'."}), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400

    if not allowed_doc(file.filename):
        return jsonify({"error": "Unsupported file type. Allowed: pdf, docx, txt, png, jpg, jpeg, tiff, bmp."}), 415

    try:
        raw = file.read()
        text = extract(raw, file.filename)
    except ValueError as e:
        logger.error(f"Document extraction ValueError: {e}")
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        logger.exception("Document extraction failed")
        return jsonify({"error": f"Could not read document: {e}"}), 500

    try:
        result = rag_pipeline.upload(text, file.filename)
    except ValueError as e:
        logger.error(f"RAG upload ValueError: {e}")
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        logger.exception("RAG indexing failed")
        return jsonify({"error": f"Indexing failed: {e}"}), 500

    print("success")
    return jsonify(result), 200

@rag_bp.post("/query")
def query():
    print("query asked")
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Expected JSON body."}), 400

    session_id = (body.get("session_id") or "").strip()
    question   = (body.get("question")   or "").strip()

    if not session_id:
        return jsonify({"error": "Missing 'session_id'."}), 400
    if not question:
        return jsonify({"error": "Missing 'question'."}), 400
    if len(question) > 2000:
        return jsonify({"error": "Question too long (max 2000 chars)."}), 400

    try:
        result = rag_pipeline.query(session_id, question)
    except KeyError as e:
        return jsonify({"error": str(e)}), 404
    except EnvironmentError as e:
        return jsonify({"error": str(e)}), 503   # Gemini key not set
    except Exception as e:
        logger.exception("RAG query failed")
        return jsonify({"error": f"Query failed: {e}"}), 500

    return jsonify(result), 200
