from flask import Blueprint, jsonify, request
from services.auth_service import auth_service
from services.portfolio_service import portfolio_service

portfolio_bp = Blueprint("portfolio", __name__, url_prefix="/api/portfolio")

@portfolio_bp.route("/summary", methods=["GET"])
def get_portfolio_summary():
    """Gets multi-asset portfolio summary for authenticated user."""
    try:
        user = auth_service.get_user_from_request(request)
        if not user:
            return jsonify({"success": False, "error": "Authentication token is required to view portfolio."}), 401
        
        res = portfolio_service.get_portfolio_summary(user_id=user["id"])
        return jsonify({"success": True, "portfolio": res})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
