import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.analytics_service import AnalyticsService

def test_final_equity_math():
    print("=" * 70)
    print("TESTING FINAL EQUITY CALCULATION & METRICS DATA-BINDING")
    print("=" * 70)

    initial_capital = 10000.0
    # Simulated equity curve with $634.78 loss ending at $9365.22
    equity_curve = [
        {"timestamp": "2026-01-01 00:00", "equity": 10000.0, "benchmark_equity": 10000.0},
        {"timestamp": "2026-01-02 00:00", "equity": 9800.0, "benchmark_equity": 10100.0},
        {"timestamp": "2026-01-03 00:00", "equity": 9365.22, "benchmark_equity": 10200.0}
    ]
    trades = [
        {"pnl": -200.0, "pnl_pct": -2.0},
        {"pnl": -434.78, "pnl_pct": -4.35}
    ]

    metrics = AnalyticsService.calculate_metrics(equity_curve, trades, initial_capital)
    
    print("\nCalculated Analytics Metrics:")
    for k, v in metrics.items():
        print(f"  - {k}: {v}")

    assert metrics["final_equity"] == 9365.22, f"Expected final_equity 9365.22, got {metrics['final_equity']}"
    assert metrics["total_equity"] == 9365.22, f"Expected total_equity 9365.22, got {metrics['total_equity']}"
    assert round(metrics["initial_capital"] + metrics["net_profit"], 2) == 9365.22, "P&L Addition check failed"

    print("\nSUCCESS: Both 'final_equity' and 'total_equity' are present and accurately equal $9,365.22!")
    print("=" * 70)

if __name__ == "__main__":
    test_final_equity_math()
