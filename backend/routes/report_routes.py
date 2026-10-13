from flask import Blueprint, jsonify, request, send_file
from services.report_service import ReportService

report_bp = Blueprint("report", __name__, url_prefix="/api/report")

@report_bp.route("/generate-pdf", methods=["POST"])
def generate_pdf():
    """Generates downloadable PDF quantitative performance report."""
    try:
        body = request.get_json() or {}
        backtest_result = body.get("backtest_result", {})
        strategy_name = body.get("strategy_name", backtest_result.get("strategy_name", "TradeSimX Strategy"))
        symbol = body.get("symbol", backtest_result.get("symbol", "BTC-USD"))

        filepath, filename = ReportService.generate_pdf_report(
            backtest_data=backtest_result,
            strategy_name=strategy_name,
            symbol=symbol
        )

        return send_file(
            filepath,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@report_bp.route("/generate-csv", methods=["POST"])
def generate_csv():
    """Generates downloadable CSV trade log report."""
    try:
        import csv
        import io
        from flask import Response

        body = request.get_json() or {}
        backtest_result = body.get("backtest_result", {})
        trades = backtest_result.get("trades", [])

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Trade ID", "Entry Time", "Exit Time", "Side", "Entry Price", "Exit Price", "Amount", "Cost Basis ($)", "PnL ($)", "PnL (%)", "Fees ($)", "Exit Reason"])

        for t in trades:
            writer.writerow([
                t.get("id"),
                t.get("entry_time"),
                t.get("exit_time"),
                t.get("side"),
                t.get("entry_price"),
                t.get("exit_price"),
                t.get("amount"),
                t.get("cost_basis"),
                t.get("pnl"),
                t.get("pnl_pct"),
                t.get("fees"),
                t.get("exit_reason")
            ])

        output.seek(0)
        filename = f"tradesimx_trades_{backtest_result.get('id', 'export')}.csv"
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

