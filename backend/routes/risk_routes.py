from flask import Blueprint, jsonify, request
from services.risk_service import risk_service

risk_bp = Blueprint("risk", __name__, url_prefix="/api/risk")

@risk_bp.route("/analytics", methods=["GET", "POST"])
def get_risk_analytics():
    params = request.args if request.method == "GET" else (request.json or {})
    symbol = params.get("symbol", "BTC-USD")
    capital = float(params.get("capital", 10000.0))
    pos_size = float(params.get("position_size_pct", 25.0))
    sl = float(params.get("stop_loss_pct", 2.5))
    res = risk_service.calculate_risk_analytics(symbol=symbol, capital=capital, position_size_pct=pos_size, stop_loss_pct=sl)
    return jsonify({"success": True, "risk": res})
