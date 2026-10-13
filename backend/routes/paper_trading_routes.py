from flask import Blueprint, jsonify, request
from services.auth_service import auth_service
from services.paper_trading_service import paper_trading_service

paper_bp = Blueprint("paper_trading", __name__, url_prefix="/api/paper-trading")

def _get_authenticated_user():
    user = auth_service.get_user_from_request(request)
    if not user:
        raise PermissionError("Authentication token is required to access paper trading.")
    return user

@paper_bp.route("/summary", methods=["GET"])
def get_paper_summary():
    """Gets paper trading virtual account summary for authenticated user."""
    try:
        user = _get_authenticated_user()
        res = paper_trading_service.get_account_summary(user_id=user["id"])
        return jsonify({"success": True, "account": res})
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@paper_bp.route("/buy", methods=["POST"])
def execute_buy():
    """Executes a simulated BUY order for authenticated user."""
    try:
        user = _get_authenticated_user()
        data = request.get_json() or {}
        symbol = data.get("symbol", "BTC-USD")
        amount = float(data.get("amount", 0.0))
        price = float(data.get("price", 0.0))

        res = paper_trading_service.execute_buy(user_id=user["id"], symbol=symbol, amount=amount, price=price)
        return jsonify(res)
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 401
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@paper_bp.route("/sell", methods=["POST"])
def execute_sell():
    """Executes a simulated SELL order for authenticated user."""
    try:
        user = _get_authenticated_user()
        data = request.get_json() or {}
        symbol = data.get("symbol", "BTC-USD")
        amount = float(data.get("amount", 0.0))
        price = float(data.get("price", 0.0))

        res = paper_trading_service.execute_sell(user_id=user["id"], symbol=symbol, amount=amount, price=price)
        return jsonify(res)
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 401
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
