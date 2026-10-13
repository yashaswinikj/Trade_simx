from flask import Blueprint, jsonify, request
from services.data_service import DataService
from services.backtest_service import BacktestEngine
from database.mongo_client import db_manager
from database.models import create_backtest_result_model

backtest_bp = Blueprint("backtest", __name__, url_prefix="/api/backtest")

@backtest_bp.route("/run", methods=["POST"])
def run_backtest():
    """Executes a backtest on historical OHLCV crypto data and saves quantitative metrics."""
    try:
        body = request.get_json() or {}
        symbol = body.get("symbol", "BTC-USD")
        timeframe = body.get("timeframe", "1h")
        strategy_config = body.get("strategy", {})
        initial_capital = float(body.get("initial_capital", 10000.0))
        commission_pct = float(body.get("commission_pct", 0.1))
        slippage_pct = float(body.get("slippage_pct", 0.05))

        df = DataService.load_ohlcv(symbol=symbol, timeframe=timeframe, limit=1200)
        
        # Execute backtest engine
        res = BacktestEngine.run_backtest(
            df=df,
            strategy_config=strategy_config,
            initial_capital=initial_capital,
            commission_pct=commission_pct,
            slippage_pct=slippage_pct
        )

        strategy_id = strategy_config.get("id", "custom")
        strategy_name = strategy_config.get("name", "Custom Strategy")

        result_doc = create_backtest_result_model(
            strategy_id=strategy_id,
            strategy_name=strategy_name,
            symbol=symbol,
            timeframe=timeframe,
            initial_capital=initial_capital,
            metrics=res["metrics"],
            equity_curve=res["equity_curve"],
            trades=res["trades"],
            parameters={
                "commission_pct": commission_pct,
                "slippage_pct": slippage_pct,
                "risk_management": strategy_config.get("risk_management", {})
            }
        )

        # Save to DB
        db_manager.get_collection("backtest_results").insert_one(result_doc)

        return jsonify({
            "success": True,
            "result": result_doc
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@backtest_bp.route("/history", methods=["GET"])
def get_backtest_history():
    """Gets historical backtest runs summary."""
    try:
        results = db_manager.get_collection("backtest_results").find_all(limit=50)
        # Strip heavy equity curves for summary list
        summary_list = []
        for r in results:
            summary_list.append({
                "id": r.get("id"),
                "strategy_name": r.get("strategy_name"),
                "symbol": r.get("symbol"),
                "timeframe": r.get("timeframe"),
                "timestamp": r.get("timestamp"),
                "metrics": r.get("metrics")
            })
        return jsonify({"success": True, "history": summary_list})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@backtest_bp.route("/result/<backtest_id>", methods=["GET"])
def get_backtest_result(backtest_id):
    """Gets detailed single backtest run result."""
    try:
        res = db_manager.get_collection("backtest_results").find_one({"id": backtest_id})
        if not res:
            return jsonify({"success": False, "error": "Backtest result not found."}), 404
        return jsonify({"success": True, "result": res})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
