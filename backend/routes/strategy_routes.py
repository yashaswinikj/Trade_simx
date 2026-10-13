from flask import Blueprint, jsonify, request
from database.mongo_client import db_manager
from database.models import create_strategy_model

strategy_bp = Blueprint("strategies", __name__, url_prefix="/api/strategies")

PRESET_STRATEGIES = [
    {
        "id": "preset_rsi_crossover",
        "name": "RSI Oversold Momentum",
        "description": "Enters Long when RSI is oversold (< 30) and price crosses above EMA 21.",
        "rules": {
            "entry_conditions": [
                {"indicator": "rsi", "operator": "<", "value": 35},
                {"indicator": "close", "operator": ">", "value": "ema_21"}
            ],
            "exit_conditions": [
                {"indicator": "rsi", "operator": ">", "value": 70}
            ],
            "logic_operator": "AND"
        },
        "risk_management": {
            "stop_loss_pct": 2.0,
            "take_profit_pct": 5.0,
            "trailing_stop_pct": 1.0,
            "position_size": 25.0
        },
        "author": "TradeSimX Presets"
    },
    {
        "id": "preset_macd_trend",
        "name": "MACD Trend Following",
        "description": "Captures strong trend expansions using MACD Histogram flips above VWAP.",
        "rules": {
            "entry_conditions": [
                {"indicator": "macd_hist", "operator": ">", "value": 0},
                {"indicator": "close", "operator": ">", "value": "vwap"}
            ],
            "exit_conditions": [
                {"indicator": "macd_hist", "operator": "<", "value": 0}
            ],
            "logic_operator": "AND"
        },
        "risk_management": {
            "stop_loss_pct": 3.0,
            "take_profit_pct": 8.0,
            "trailing_stop_pct": 2.0,
            "position_size": 20.0
        },
        "author": "TradeSimX Presets"
    },
    {
        "id": "preset_ml_predictive",
        "name": "XGBoost AI Predictive Strategy",
        "description": "Executes trades filtered by high-confidence Machine Learning directional probability signals.",
        "rules": {
            "entry_conditions": [
                {"indicator": "ml_signal", "operator": "==", "value": "BUY"},
                {"indicator": "close", "operator": ">", "value": "sma_50"}
            ],
            "exit_conditions": [
                {"indicator": "ml_signal", "operator": "==", "value": "SELL"}
            ],
            "logic_operator": "AND"
        },
        "risk_management": {
            "stop_loss_pct": 2.5,
            "take_profit_pct": 6.0,
            "trailing_stop_pct": 1.5,
            "position_size": 30.0
        },
        "author": "TradeSimX AI"
    }
]

@strategy_bp.route("", methods=["GET"])
def get_strategies():
    """Gets list of user strategies and built-in preset strategies."""
    try:
        user_strategies = db_manager.get_collection("strategies").find_all()
        return jsonify({
            "success": True,
            "presets": PRESET_STRATEGIES,
            "user_strategies": user_strategies
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@strategy_bp.route("", methods=["POST"])
def save_strategy():
    """Saves a new user strategy configuration to DB."""
    try:
        body = request.get_json() or {}
        name = body.get("name", "Untitled Strategy")
        description = body.get("description", "")
        rules = body.get("rules", {})
        risk_management = body.get("risk_management", {})

        model = create_strategy_model(name, description, rules, risk_management)
        db_manager.get_collection("strategies").insert_one(model)

        return jsonify({
            "success": True,
            "message": "Strategy saved successfully.",
            "strategy": model
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@strategy_bp.route("/<strategy_id>", methods=["DELETE"])
def delete_strategy(strategy_id):
    """Deletes a saved strategy by ID."""
    try:
        success = db_manager.get_collection("strategies").delete_one({"id": strategy_id})
        return jsonify({"success": success, "message": "Strategy deleted." if success else "Strategy not found."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
