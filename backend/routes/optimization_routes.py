from flask import Blueprint, jsonify, request
from services.optimization_service import optimization_service

optimization_bp = Blueprint("optimization", __name__, url_prefix="/api/optimization")

@optimization_bp.route("/run", methods=["POST"])
def run_optimization():
    data = request.json or {}
    symbol = data.get("symbol", "BTC-USD")
    res = optimization_service.optimize_strategy(symbol=symbol)
    return jsonify({"success": True, "result": res})

@optimization_bp.route("/walk-forward", methods=["POST"])
def run_walk_forward():
    data = request.json or {}
    symbol = data.get("symbol", "BTC-USD")
    res = optimization_service.walk_forward_validation(symbol=symbol)
    return jsonify({"success": True, "result": res})
