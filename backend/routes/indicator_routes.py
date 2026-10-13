from flask import Blueprint, jsonify, request
from services.data_service import DataService
from services.indicator_service import IndicatorService

indicator_bp = Blueprint("indicators", __name__, url_prefix="/api/indicators")

@indicator_bp.route("/calculate", methods=["POST"])
def calculate_indicators():
    """Calculates custom technical indicators on given dataset or symbol."""
    try:
        body = request.get_json() or {}
        symbol = body.get("symbol", "BTC-USD")
        timeframe = body.get("timeframe", "1h")
        config = body.get("config", {})

        df = DataService.load_ohlcv(symbol=symbol, timeframe=timeframe, limit=1000)
        df_ind = IndicatorService.calculate_all(df, config=config)

        records = df_ind.fillna(0.0).to_dict(orient="records")
        return jsonify({
            "success": True,
            "symbol": symbol,
            "data": records
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
