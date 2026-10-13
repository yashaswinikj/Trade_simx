import os
import sys
import unittest
import json

# Add backend directory to PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from services.data_service import DataService
from services.indicator_service import IndicatorService
from services.ml_service import MLService
from services.backtest_service import BacktestEngine
from services.analytics_service import AnalyticsService
from services.ai_service import AIService
from services.report_service import ReportService

class TestTradeSimXBackend(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_01_health_check(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["status"], "healthy")
        print("[OK] Health check API passed!")

    def test_02_data_service(self):
        symbols = DataService.get_available_symbols()
        self.assertGreater(len(symbols), 0)

        df = DataService.load_ohlcv(symbol="BTC-USD", limit=500)
        self.assertEqual(len(df), 500)
        self.assertIn("close", df.columns)
        self.assertIn("volume", df.columns)
        print("[OK] Crypto Data Loader passed (BTC-USD 500 candles)!")

    def test_03_technical_indicators(self):
        df = DataService.load_ohlcv(symbol="BTC-USD", limit=200)
        df_ind = IndicatorService.calculate_all(df)

        self.assertIn("rsi", df_ind.columns)
        self.assertIn("macd_hist", df_ind.columns)
        self.assertIn("bb_upper", df_ind.columns)
        self.assertIn("vwap", df_ind.columns)
        self.assertIn("stoch_k", df_ind.columns)
        
        # Verify RSI values stay between 0 and 100
        valid_rsi = df_ind["rsi"].dropna()
        self.assertTrue((valid_rsi >= 0).all() and (valid_rsi <= 100).all())
        print("[OK] Technical Indicators engine passed!")

    def test_04_ml_pipeline(self):
        df = DataService.load_ohlcv(symbol="BTC-USD", limit=600)
        metadata = MLService.train_model(df, model_name="Test RF Model", algorithm="random_forest")
        
        self.assertIn("accuracy", metadata["metrics"])
        self.assertGreaterEqual(metadata["metrics"]["accuracy"], 0.0)

        pred = MLService.predict_latest_signal(df, model_id=metadata["id"])
        self.assertIn(pred["signal"], ["BUY", "SELL", "HOLD"])
        self.assertGreater(pred["confidence"], 0)
        print(f"[OK] ML Pipeline passed! Trained accuracy: {metadata['metrics']['accuracy']:.2%}, Signal: {pred['signal']}")

    def test_05_backtesting_engine(self):
        df = DataService.load_ohlcv(symbol="BTC-USD", limit=800)
        strategy_config = {
            "name": "RSI & EMA Test",
            "rules": {
                "entry_conditions": [
                    {"indicator": "rsi", "operator": "<", "value": 40},
                    {"indicator": "close", "operator": ">", "value": "ema_21"}
                ],
                "exit_conditions": [
                    {"indicator": "rsi", "operator": ">", "value": 65}
                ],
                "logic_operator": "AND"
            },
            "risk_management": {
                "stop_loss_pct": 2.5,
                "take_profit_pct": 5.0,
                "position_size": 25.0
            }
        }

        res = BacktestEngine.run_backtest(df, strategy_config, initial_capital=10000.0)
        metrics = res["metrics"]

        self.assertIn("net_profit", metrics)
        self.assertIn("sharpe_ratio", metrics)
        self.assertIn("max_drawdown_pct", metrics)
        self.assertGreater(len(res["equity_curve"]), 0)
        print(f"[OK] Backtesting engine passed! Net Profit: ${metrics['net_profit']:.2f}, Sharpe: {metrics['sharpe_ratio']}")

    def test_06_ai_analysis(self):
        strategy_config = {
            "name": "Sample RSI Strategy",
            "risk_management": {"position_size": 20}
        }
        metrics = {
            "net_profit_pct": 12.5,
            "sharpe_ratio": 1.4,
            "max_drawdown_pct": -8.2,
            "win_rate": 55.0,
            "profit_factor": 1.6
        }

        analysis = AIService.analyze_strategy(strategy_config, metrics)
        self.assertIn("score", analysis)
        self.assertIn("recommendations", analysis)
        print(f"[OK] AI Strategy Analysis passed! Score: {analysis['score']}/100")

    def test_07_pdf_report_generator(self):
        df = DataService.load_ohlcv(symbol="BTC-USD", limit=400)
        strategy_config = {"name": "PDF Report Strategy"}
        res = BacktestEngine.run_backtest(df, strategy_config)

        backtest_doc = {
            "id": "test_run_123",
            "strategy_name": "PDF Report Strategy",
            "symbol": "BTC-USD",
            "metrics": res["metrics"],
            "trades": res["trades"]
        }

        filepath, filename = ReportService.generate_pdf_report(backtest_doc, "PDF Report Strategy", "BTC-USD")
        self.assertTrue(os.path.exists(filepath))
        self.assertGreater(os.path.getsize(filepath), 1000)
        print(f"[OK] PDF Report Generator passed! Saved {filename} ({os.path.getsize(filepath)} bytes)")

if __name__ == "__main__":
    unittest.main()
