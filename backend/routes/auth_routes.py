from flask import Blueprint, jsonify, request
from services.auth_service import auth_service

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    """Registers a new user account with password hashing and email normalization."""
    try:
        body = request.get_json() or {}
        email = body.get("email", "")
        password = body.get("password", "")
        confirm_password = body.get("confirmPassword") or body.get("confirm_password")
        name = body.get("name", "")

        user = auth_service.register_user(
            email=email,
            password=password,
            name=name,
            confirm_password=confirm_password
        )
        return jsonify({
            "success": True,
            "message": "Registration successful.",
            "user": user
        })
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Registration failed. Please try again."}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    """Logs in an existing user with strict password verification."""
    try:
        body = request.get_json() or {}
        email = body.get("email", "")
        password = body.get("password", "")

        user = auth_service.login_user(email=email, password=password)
        return jsonify({
            "success": True,
            "message": "Login successful.",
            "user": user
        })
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 401
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Unable to connect to authentication server. Please try again."}), 500

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """Returns authenticated user profile or 401 unauthenticated."""
    user = auth_service.get_user_from_request(request)
    if user:
        return jsonify({"success": True, "user": user})
    return jsonify({"success": False, "error": "Unauthenticated access."}), 401
