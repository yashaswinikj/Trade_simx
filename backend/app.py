import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("TradeSimX.App")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend client
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Import and register REST Blueprints
    from routes.data_routes import data_bp
    from routes.indicator_routes import indicator_bp
    from routes.ml_routes import ml_bp
    from routes.strategy_routes import strategy_bp
    from routes.backtest_routes import backtest_bp
    from routes.ai_routes import ai_bp
    from routes.report_routes import report_bp
    from routes.auth_routes import auth_bp
    from routes.regime_routes import regime_bp
    from routes.optimization_routes import optimization_bp
    from routes.risk_routes import risk_bp
    from routes.portfolio_routes import portfolio_bp
    from routes.paper_trading_routes import paper_bp
    from routes.overfitting_routes import overfitting_bp
    from routes.contact_routes import contact_bp

    app.register_blueprint(data_bp)
    app.register_blueprint(indicator_bp)
    app.register_blueprint(ml_bp)
    app.register_blueprint(strategy_bp)
    app.register_blueprint(backtest_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(regime_bp)
    app.register_blueprint(optimization_bp)
    app.register_blueprint(risk_bp)
    app.register_blueprint(portfolio_bp)
    app.register_blueprint(paper_bp)
    app.register_blueprint(overfitting_bp)
    app.register_blueprint(contact_bp)

    @app.route("/")
    def index():
        return jsonify({
            "name": "TradeSimX AI API Server",
            "version": "2.0.0 (Pro Quant Edition)",
            "status": "online",
            "endpoints": [
                "/api/health", "/api/ai/health", "/api/ai/test", "/api/ai/analyze-backtest",
                "/api/contact", "/api/admin/login"
            ]
        })

    @app.route("/api/health")
    def health():
        from database.mongo_client import db_manager
        return jsonify({
            "status": "healthy",
            "database_type": "MongoDB" if db_manager.is_mongo else "JSON Fallback File",
            "groq_api_configured": bool(Config.GROQ_API_KEY)
        })

    # Log all registered Flask routes on startup
    with app.app_context():
        logger.info("--- REGISTERED FLASK ROUTES ---")
        for rule in app.url_map.iter_rules():
            methods = ', '.join(rule.methods - set(['HEAD', 'OPTIONS']))
            logger.info(f"Route: {rule.rule} [{methods}] -> {rule.endpoint}")
        logger.info("-------------------------------")

    return app

app = create_app()

if __name__ == "__main__":
    is_key_configured = bool(Config.GROQ_API_KEY)
    logger.info(f"GROQ_API_KEY configured: {is_key_configured}")
    logger.info(f"Active Groq Model: {Config.GROQ_MODEL}")
    logger.info("Starting TradeSimX AI Backend Server on port 5000...")
    app.run(host="0.0.0.0", port=Config.PORT, debug=False, threaded=True)
