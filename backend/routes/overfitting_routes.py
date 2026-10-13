from flask import Blueprint, jsonify, request
from services.overfitting_service import overfitting_service

overfitting_bp = Blueprint("overfitting", __name__, url_prefix="/api/overfitting")

@overfitting_bp.route("/check", methods=["GET"])
def check_overfitting():
    symbol = request.args.get("symbol", "BTC-USD")
    res = overfitting_service.check_overfitting_defense(symbol=symbol)
    return jsonify({"success": True, "result": res})
