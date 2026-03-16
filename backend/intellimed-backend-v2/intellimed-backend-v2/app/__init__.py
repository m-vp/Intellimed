import logging
from flask import Flask
from flask_cors import CORS
from app.config import Config

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S",
)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS — allow frontend origin
    CORS(app, resources={
        r"/api/*": {"origins": app.config["FRONTEND_URL"]}
    })

    # Register blueprints
    from app.routes.alzheimer  import alzheimer_bp
    from app.routes.brain_tumor import brain_tumor_bp
    from app.routes.rag        import rag_bp
    from app.routes.health     import health_bp

    app.register_blueprint(alzheimer_bp,   url_prefix="/api/alzheimer")
    app.register_blueprint(brain_tumor_bp, url_prefix="/api/brain-tumor")
    app.register_blueprint(rag_bp,         url_prefix="/api/rag")
    app.register_blueprint(health_bp,      url_prefix="/api")

    # Global error handlers
    @app.errorhandler(413)
    def too_large(_):
        return {"error": "File too large. Maximum 50 MB."}, 413

    @app.errorhandler(404)
    def not_found(_):
        return {"error": "Endpoint not found."}, 404

    @app.errorhandler(405)
    def method_not_allowed(_):
        return {"error": "Method not allowed."}, 405

    app.logger.info("IntelliMed API ready.")
    return app
