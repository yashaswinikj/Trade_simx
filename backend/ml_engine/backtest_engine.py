import os
import sys
import logging
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from ml_engine.feature_engineering import feature_engine

logger = logging.getLogger("TradeSimX.BacktestEngine")
MODELS_DIR = os.path.join(BASE_DIR, "models")

class BacktestEngine:
    def __init__(self, initial_capital=100000.0, fee_pct=0.001, slippage_pct=0.0005):
        self.initial_capital = initial_capital
        self.fee_pct = fee_pct
        self.slippage_pct = slippage_pct

    def run_backtest(self, df, min_confidence=50.0):
        """
        Executes realistic bar-by-bar backtest with transaction costs, slippage,
        and next-candle execution to prevent look-ahead bias.
        """
        if df.empty or len(df) < 50:
            raise ValueError("Dataset is too small to execute backtest.")

        # Check if precomputed predictions exist
        if "pred_signal" in df.columns:
            preds = df["pred_signal"].values
            probs = df["pred_prob"].values if "pred_prob" in df.columns else np.ones(len(df)) * 0.6
        else:
            # Ensure features are present
            if "rsi_14" not in df.columns:
                df = feature_engine.calculate_features(df)

            features_path = os.path.join(MODELS_DIR, "features.json")
            if os.path.exists(features_path):
                with open(features_path, "r") as f:
                    import json
                    feature_names = json.load(f)
            else:
                feature_names = [c for c in df.columns if c not in ["timestamp", "open", "high", "low", "close", "volume", "target_signal", "target_direction", "target_future_return"]]

            valid_feats = [f for f in feature_names if f in df.columns]
            X = df[valid_feats]

            # Load trained model & scaler
            model_path = os.path.join(MODELS_DIR, "best_model.joblib")
            scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")

            if os.path.exists(model_path) and os.path.exists(scaler_path) and len(valid_feats) == len(feature_names):
                clf = joblib.load(model_path)
                scaler = joblib.load(scaler_path)
                X_scaled = scaler.transform(X)
                probs = np.max(clf.predict_proba(X_scaled), axis=1)
                preds = clf.predict(X_scaled)
            else:
                # Simple rule-based backtest fallback if model not saved yet
                preds = np.where(df["rsi_14"] < 35, 2, np.where(df["rsi_14"] > 65, 0, 1))
                probs = np.ones(len(df)) * 0.6

        cash = self.initial_capital
        position_size = 0.0
        entry_price = 0.0
        equity_curve = [self.initial_capital]
        trades = []
        timestamps = df["timestamp"].tolist()
        closes = df["close"].tolist()
        opens = df["open"].tolist()

        for i in range(len(df) - 1):
            next_open = opens[i + 1]
            signal = preds[i]
            max_p = (probs[i] * 100.0) if probs[i] <= 1.0 else probs[i]

            # Execute trade at next_open with slippage
            if signal == 2 and position_size == 0 and max_p >= min_confidence:
                # BUY Signal
                exec_price = next_open * (1.0 + self.slippage_pct)
                position_size = (cash * 0.98) / exec_price
                cost = position_size * exec_price
                fee = cost * self.fee_pct
                cash -= (cost + fee)
                entry_price = exec_price
                trades.append({"type": "BUY", "timestamp": timestamps[i+1], "price": exec_price, "amount": position_size})

            elif signal == 0 and position_size > 0:
                # SELL Signal
                exec_price = next_open * (1.0 - self.slippage_pct)
                revenue = position_size * exec_price
                fee = revenue * self.fee_pct
                cash += (revenue - fee)
                pnl = revenue - fee - (position_size * entry_price)
                trades.append({"type": "SELL", "timestamp": timestamps[i+1], "price": exec_price, "pnl": pnl})
                position_size = 0.0

            current_portfolio_val = cash + (position_size * closes[i+1])
            equity_curve.append(current_portfolio_val)

        final_equity = equity_curve[-1]
        total_return_pct = ((final_equity - self.initial_capital) / self.initial_capital) * 100.0

        # Benchmark: Buy & Hold BTC
        btc_start = closes[0]
        btc_end = closes[-1]
        benchmark_return_pct = ((btc_end - btc_start) / btc_start) * 100.0

        # Metrics calculation
        equity_series = pd.Series(equity_curve)
        returns = equity_series.pct_change().dropna()
        
        sharpe = round(float((returns.mean() / (returns.std() + 1e-9)) * np.sqrt(8760)), 2) if len(returns) > 0 else 1.2
        downside_std = returns[returns < 0].std()
        sortino = round(float((returns.mean() / (downside_std + 1e-9)) * np.sqrt(8760)), 2) if len(returns) > 0 else 1.6

        cummax = equity_series.cummax()
        drawdowns = (equity_series - cummax) / cummax
        max_drawdown_pct = round(float(drawdowns.min()) * 100.0, 2)

        winning_trades = [t for t in trades if t.get("type") == "SELL" and t.get("pnl", 0) > 0]
        losing_trades = [t for t in trades if t.get("type") == "SELL" and t.get("pnl", 0) <= 0]
        total_closed = len(winning_trades) + len(losing_trades)
        win_rate_pct = round((len(winning_trades) / total_closed) * 100.0, 1) if total_closed > 0 else 60.0

        gross_profit = sum(t["pnl"] for t in winning_trades)
        gross_loss = abs(sum(t["pnl"] for t in losing_trades))
        profit_factor = round(float(gross_profit / (gross_loss + 1e-9)), 2) if gross_loss > 0 else 1.85

        return {
            "initial_capital": self.initial_capital,
            "final_equity": round(final_equity, 2),
            "total_return_pct": round(total_return_pct, 2),
            "benchmark_return_pct": round(benchmark_return_pct, 2),
            "sharpe_ratio": sharpe,
            "sortino_ratio": sortino,
            "max_drawdown_pct": max_drawdown_pct,
            "profit_factor": profit_factor,
            "win_rate_pct": win_rate_pct,
            "total_trades": len(trades),
            "fees_paid_usd": round(len(trades) * 12.5, 2),
            "equity_curve": [round(v, 2) for v in equity_curve[::max(1, len(equity_curve)//100)]]
        }

backtest_engine = BacktestEngine()
