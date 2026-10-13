import os
import sys
import json
import logging

# Configure logging to stdout
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TestAIBacktest")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.mongo_client import db_manager
from database.models import create_backtest_result_model
from services.ai_service import ai_service

def safe_print(text):
    """Safely print unicode strings to Windows cp1252 console."""
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', 'replace').decode('ascii'))

def test_contrasting_backtest_ai_analysis():
    safe_print("=" * 80)
    safe_print("RUNNING COMPREHENSIVE 5-TEST AI BACKTEST ANALYSIS TEST SUITE")
    safe_print("=" * 80)

    # 1. Create Zero-Trade Backtest
    id_zero = "test_zero_trades"
    doc_zero = create_backtest_result_model(
        strategy_id="strat_zero",
        strategy_name="Strict Crossover Strategy (Zero Trades)",
        symbol="BTC-USD",
        timeframe="1h",
        initial_capital=10000.0,
        metrics={
            "initial_capital": 10000.0,
            "total_equity": 10000.0,
            "net_profit": 0.0,
            "net_profit_pct": 0.0,
            "win_rate": 0.0,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "profit_factor": 0.0,
            "expectancy": 0.0,
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "max_drawdown_pct": 0.0,
            "avg_trade_pnl": 0.0,
            "max_win": None,
            "max_loss": None
        },
        equity_curve=[
            {"timestamp": "2026-01-01 00:00", "equity": 10000.0, "benchmark_equity": 10000.0},
            {"timestamp": "2026-01-15 00:00", "equity": 10000.0, "benchmark_equity": 10500.0}
        ],
        trades=[],
        parameters={"stop_loss_pct": 2.0, "take_profit_pct": 5.0}
    )
    doc_zero["id"] = id_zero

    # 2. Create Backtest A (Profitable Strategy)
    id_a = "test_prof_705c"
    doc_a = create_backtest_result_model(
        strategy_id="strat_prof",
        strategy_name="Bullish Momentum Master (Profitable)",
        symbol="BTC-USD",
        timeframe="1h",
        initial_capital=10000.0,
        metrics={
            "initial_capital": 10000.0,
            "total_equity": 12450.0,
            "net_profit": 2450.0,
            "net_profit_pct": 24.5,
            "win_rate": 68.0,
            "total_trades": 50,
            "winning_trades": 34,
            "losing_trades": 16,
            "profit_factor": 2.10,
            "expectancy": 49.0,
            "sharpe_ratio": 1.85,
            "sortino_ratio": 2.12,
            "max_drawdown_pct": -4.2,
            "avg_trade_pnl": 49.0,
            "max_win": 350.0,
            "max_loss": -120.0
        },
        equity_curve=[
            {"timestamp": "2026-01-01 00:00", "equity": 10000.0, "benchmark_equity": 10000.0},
            {"timestamp": "2026-01-15 00:00", "equity": 11200.0, "benchmark_equity": 10500.0},
            {"timestamp": "2026-02-01 00:00", "equity": 12450.0, "benchmark_equity": 10800.0}
        ],
        trades=[
            {"id": 1, "entry_time": "2026-01-02", "exit_time": "2026-01-03", "side": "LONG", "entry_price": 90000.0, "exit_price": 93000.0, "pnl": 300.0, "pnl_pct": 3.33, "exit_reason": "TAKE_PROFIT"},
            {"id": 2, "entry_time": "2026-01-05", "exit_time": "2026-01-06", "side": "LONG", "entry_price": 92000.0, "exit_price": 95500.0, "pnl": 350.0, "pnl_pct": 3.80, "exit_reason": "TAKE_PROFIT"}
        ],
        parameters={"stop_loss_pct": 2.0, "take_profit_pct": 5.0}
    )
    doc_a["id"] = id_a

    # 3. Create Backtest B (Losing Strategy - User Example ID 705c309c)
    id_b = "705c309c"
    doc_b = create_backtest_result_model(
        strategy_id="strat_losing",
        strategy_name="Sub-Optimal High Frequency Strategy (Losing)",
        symbol="BTC-USD",
        timeframe="1h",
        initial_capital=9990.0,
        metrics={
            "initial_capital": 9990.0,
            "total_equity": 8672.07,
            "net_profit": -1317.93,
            "net_profit_pct": -13.19,
            "win_rate": 12.3,
            "total_trades": 65,
            "winning_trades": 8,
            "losing_trades": 57,
            "profit_factor": 0.11,
            "expectancy": -20.28,
            "sharpe_ratio": -13.76,
            "sortino_ratio": -14.25,
            "max_drawdown_pct": -13.14,
            "avg_trade_pnl": -20.28,
            "max_win": 43.42,
            "max_loss": -48.11
        },
        equity_curve=[
            {"timestamp": "2026-01-01 00:00", "equity": 9990.0, "benchmark_equity": 9990.0},
            {"timestamp": "2026-01-15 00:00", "equity": 9100.0, "benchmark_equity": 10200.0},
            {"timestamp": "2026-02-01 00:00", "equity": 8672.07, "benchmark_equity": 10500.0}
        ],
        trades=[
            {"id": 1, "entry_time": "2026-01-02", "exit_time": "2026-01-03", "side": "LONG", "entry_price": 90000.0, "exit_price": 89500.0, "pnl": -48.11, "pnl_pct": -0.55, "exit_reason": "STOP_LOSS"}
        ],
        parameters={"stop_loss_pct": 1.0, "take_profit_pct": 1.0}
    )
    doc_b["id"] = id_b

    # 4. Create Backtest C (Null/Missing Optional Fields Backtest)
    id_null = "test_null_fields"
    doc_null = {
        "id": id_null,
        "strategy_name": None,
        "symbol": None,
        "timeframe": None,
        "initial_capital": None,
        "metrics": {
            "net_profit_pct": None,
            "win_rate": None,
            "profit_factor": None,
            "sharpe_ratio": None,
            "sortino_ratio": None,
            "max_drawdown_pct": None
        },
        "trades": [
            {
                "id": 1,
                "side": None,
                "exit_reason": None,
                "pnl": None,
                "entry_price": None
            }
        ],
        "parameters": None
    }

    # Insert into MongoDB
    coll = db_manager.get_collection("backtest_results")
    coll.insert_one(doc_zero)
    coll.insert_one(doc_a)
    coll.insert_one(doc_b)
    coll.insert_one(doc_null)
    safe_print("Inserted test backtest records into MongoDB.")

    # TEST 1: Zero Trades Backtest
    safe_print("\n" + "-" * 60)
    safe_print("TEST 1: ANALYZING ZERO-TRADE BACKTEST ID: #test_zero_trades")
    safe_print("-" * 60)
    res_zero = ai_service.generate_backtest_analysis(backtest_id=id_zero)
    assert res_zero["success"] is True, "Zero trade AI Analysis failed!"
    analysis_zero = res_zero["analysis"]
    safe_print(f"\n[ZERO TRADE RESPONSE SUMMARY]:\n{analysis_zero[:350]}...\n")

    # TEST 2: Losing Backtest ID 705c309c
    safe_print("\n" + "-" * 60)
    safe_print("TEST 2: ANALYZING LOSING BACKTEST ID: #705c309c")
    safe_print("-" * 60)
    res_b = ai_service.generate_backtest_analysis(backtest_id=id_b)
    assert res_b["success"] is True, "Backtest B AI Analysis failed!"
    analysis_b = res_b["analysis"]
    safe_print(f"\n[LOSING BACKTEST RESPONSE SUMMARY]:\n{analysis_b[:350]}...\n")

    # TEST 3: Profitable Backtest ID test_prof_705c
    safe_print("\n" + "-" * 60)
    safe_print("TEST 3: ANALYZING PROFITABLE BACKTEST ID: #test_prof_705c")
    safe_print("-" * 60)
    res_a = ai_service.generate_backtest_analysis(backtest_id=id_a)
    assert res_a["success"] is True, "Backtest A AI Analysis failed!"
    analysis_a = res_a["analysis"]
    safe_print(f"\n[PROFITABLE BACKTEST RESPONSE SUMMARY]:\n{analysis_a[:350]}...\n")

    # TEST 4: Null Fields Backtest (NULL SAFETY TEST)
    safe_print("\n" + "-" * 60)
    safe_print("TEST 4: ANALYZING NULL/MISSING FIELDS BACKTEST ID: #test_null_fields")
    safe_print("-" * 60)
    res_null = ai_service.generate_backtest_analysis(backtest_id=id_null)
    assert res_null["success"] is True, "Null Fields AI Analysis failed!"
    analysis_null = res_null["analysis"]
    safe_print(f"\n[NULL FIELDS RESPONSE SUMMARY]:\n{analysis_null[:350]}...\n")

    safe_print("\n" + "=" * 80)
    safe_print("SUCCESS: ALL 4 BACKTEST TYPES (ZERO-TRADE, LOSING, PROFITABLE, NULL-FIELDS) PASSED END-TO-END!")
    safe_print("=" * 80)

if __name__ == "__main__":
    test_contrasting_backtest_ai_analysis()
