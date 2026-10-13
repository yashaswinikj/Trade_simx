from flask import Blueprint, jsonify, request
from services.data_service import DataService
from services.indicator_service import IndicatorService

data_bp = Blueprint("data", __name__, url_prefix="/api/data")

@data_bp.route("/symbols", methods=["GET"])
def get_symbols():
    """Returns available crypto trading pairs."""
    try:
        symbols = DataService.get_available_symbols()
        return jsonify({"success": True, "symbols": symbols})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@data_bp.route("/ohlcv", methods=["GET"])
def get_ohlcv():
    """Returns OHLCV dataset with technical indicators calculated."""
    try:
        symbol = request.args.get("symbol", "BTC-USD")
        timeframe = request.args.get("timeframe", "1h")
        limit = int(request.args.get("limit", 1000))

        df = DataService.load_ohlcv(symbol=symbol, timeframe=timeframe, limit=limit)
        df_with_ind = IndicatorService.calculate_all(df)
        
        # Replace NaNs/Infs for clean JSON serialization
        df_clean = df_with_ind.replace([float('inf'), float('-inf')], None).fillna(0.0)
        records = df_clean.to_dict(orient="records")

        return jsonify({
            "success": True,
            "symbol": symbol,
            "timeframe": timeframe,
            "count": len(records),
            "data": records
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
