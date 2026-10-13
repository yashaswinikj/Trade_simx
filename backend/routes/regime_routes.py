from flask import Blueprint, jsonify, request
from services.regime_service import regime_service

regime_bp = Blueprint("regime", __name__, url_prefix="/api/regime")

@regime_bp.route("/detect", methods=["GET"])
def detect_regime():
    symbol = request.args.get("symbol", "BTC-USD")
    res = regime_service.detect_market_regime(symbol=symbol)
    return jsonify({"success": True, "data": res})
