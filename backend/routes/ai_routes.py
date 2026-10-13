import logging
import traceback
from flask import Blueprint, jsonify, request
from services.ai_service import ai_service
from services.auth_service import auth_service

logger = logging.getLogger("TradeSimX.AIRoutes")

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")

@ai_bp.route("/health", methods=["GET"], strict_slashes=False)
def ai_health():
    """Health check verifying AI configuration, provider, and model."""
    res = ai_service.check_health()
    return jsonify(res)

@ai_bp.route("/test", methods=["POST"], strict_slashes=False)
def ai_test():
    """Direct test endpoint that executes a real request to Groq LLM."""
    try:
        body = request.get_json() or {}
        test_msg = body.get("message", "Say hello in one short sentence.")
        reply = ai_service.generate_chat_response(message=test_msg)
        return jsonify({
            "success": True,
            "response": reply.get("message", "")
        })
    except ValueError as ve:
        return jsonify({
            "success": False,
            "error_type": "ConfigurationError",
            "error": str(ve)
        }), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error_type": "GroqAPIError",
            "error": str(e)
        }), 500

@ai_bp.route("/analyze-backtest", methods=["POST"], strict_slashes=False)
def analyze_backtest():
    """
    Executes authoritative AI Analysis on a specific MongoDB Backtest ID.
    Accepts: { "backtest_id": "705c309c" }
    """
    logger.info("==================================================")
    logger.info("[AI BACKTEST REQUEST] Received request")

    try:
        body = request.get_json() or {}
        backtest_id = body.get("backtest_id") or body.get("id")
        
        if not backtest_id:
            logger.error("[AI BACKTEST ERROR] Missing backtest_id in request body")
            return jsonify({
                "success": False,
                "error_type": "BadRequest",
                "error": "backtest_id parameter is required."
            }), 400

        logger.info(f"[AI BACKTEST REQUEST] Backtest ID: {backtest_id}")
        logger.info("[AI BACKTEST REQUEST] MongoDB lookup started")

        res = ai_service.generate_backtest_analysis(backtest_id=str(backtest_id))
        
        logger.info("[AI BACKTEST REQUEST] Analysis completed successfully")
        logger.info("==================================================")
        return jsonify(res)
    except ValueError as ve:
        logger.error(f"[AI BACKTEST ERROR] MongoDB lookup failed: {ve}")
        logger.info("==================================================")
        return jsonify({
            "success": False,
            "error_type": "NotFoundError",
            "error": f"Backtest '{backtest_id}' was not found in MongoDB."
        }), 404
    except Exception as e:
        traceback.print_exc()
        err_msg = str(e)
        logger.error(f"[AI BACKTEST ERROR] Groq API or backend processing failed: {err_msg}")
        logger.info("==================================================")

        err_lower = err_msg.lower()
        if "model_not_found" in err_lower or "invalid model" in err_lower or "404" in err_lower:
            friendly_err = f"Configured Groq model is unavailable. Check GROQ_MODEL in backend/.env."
            error_type = "GroqModelError"
        elif "groq_api_key" in err_lower or "missing or invalid" in err_lower or "api key" in err_lower:
            friendly_err = "Groq API key is missing or invalid in backend/.env."
            error_type = "GroqKeyError"
        elif "attributeerror" in err_lower or "nonetype" in err_lower:
            friendly_err = "The backtest data contains a missing or null field that could not be processed."
            error_type = "BACKTEST_CONTEXT_ERROR"
        else:
            friendly_err = "AI analysis server error."
            error_type = "AIServiceError"

        return jsonify({
            "success": False,
            "error_type": error_type,
            "error": friendly_err,
            "backtest_id": str(request.get_json().get("backtest_id", "")) if request.get_json() else "",
            "detail": err_msg
        }), 500

@ai_bp.route("/analyze", methods=["POST"], strict_slashes=False)
def analyze_market_or_strategy():
    """
    Executes structured AI analysis on live market/strategy context for trading pages.
    """
    try:
        user = auth_service.get_user_from_request(request)
        user_id = user.get("id") if user else None

        body = request.get_json() or {}
        symbol = body.get("symbol", "BTC-USD")
        custom_context = body.get("context") or body.get("metrics")

        res = ai_service.generate_market_analysis(symbol=symbol, custom_context=custom_context, user_id=user_id)
        return jsonify(res)
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "AI analysis is temporarily unavailable. Please try again.",
            "detail": str(e)
        }), 500

@ai_bp.route("/chat", methods=["POST"], strict_slashes=False)
def chat_with_ai():
    """Context-aware multi-turn conversational LLM endpoint for TradeSimX AI Assistant."""
    try:
        user = auth_service.get_user_from_request(request)
        user_id = user.get("id") if user else None

        body = request.get_json() or {}
        message = body.get("message", "")
        conversation = body.get("conversation", [])
        symbol = body.get("symbol", "BTC-USD")

        if not message or not message.strip():
            return jsonify({"success": False, "error": "Message cannot be empty."}), 400

        res = ai_service.generate_chat_response(
            message=message.strip(),
            conversation=conversation,
            symbol=symbol,
            user_id=user_id
        )
        return jsonify(res)
    except ValueError as ve:
        return jsonify({
            "success": False,
            "error_type": "ConfigurationError",
            "error": str(ve)
        }), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error_type": "GroqAPIError",
            "error": str(e)
        }), 500
