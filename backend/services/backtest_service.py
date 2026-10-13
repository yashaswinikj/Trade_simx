import logging
import pandas as pd
import numpy as np
from services.indicator_service import IndicatorService
from services.analytics_service import AnalyticsService
from services.ml_service import MLService

logger = logging.getLogger("TradeSimX.BacktestService")

class BacktestEngine:
    """
    Realistic bar-by-bar Backtesting Engine for Cryptocurrency Algorithmic Trading.
    Enforces real order execution simulation with slippage, commission, position sizing,
    stop-loss, take-profit, and trailing stop rules.
    """

    @staticmethod
    def run_backtest(df, strategy_config, initial_capital=10000.0, commission_pct=0.1, slippage_pct=0.05):
        """
        Runs bar-by-bar backtest simulation on preprocessed dataset.
        """
        df = IndicatorService.calculate_all(df)
        
        # Parse strategy rules and risk settings
        rules = strategy_config.get("rules", {}) if isinstance(strategy_config.get("rules"), dict) else {}
        entry_conditions = rules.get("entry_conditions", []) if isinstance(rules.get("entry_conditions"), list) else []
        exit_conditions = rules.get("exit_conditions", []) if isinstance(rules.get("exit_conditions"), list) else []
        logic_op = str(rules.get("logic_operator") or "AND").upper()
        
        risk = strategy_config.get("risk_management", {})
        sl_pct = float(risk.get("stop_loss_pct", 0.0)) / 100.0
        tp_pct = float(risk.get("take_profit_pct", 0.0)) / 100.0
        trailing_sl_pct = float(risk.get("trailing_stop_pct", 0.0)) / 100.0
        pos_size_pct = float(risk.get("position_size", 100.0)) / 100.0
        
        comm_rate = float(commission_pct) / 100.0
        slip_rate = float(slippage_pct) / 100.0

        # Run ML predictions if strategy uses ML signal condition
        has_ml_condition = any("ml_" in str(cond.get("indicator", "")) for cond in entry_conditions + exit_conditions)
        if has_ml_condition:
            features_df = MLService.prepare_features(df)
            X_all = features_df.iloc[:-3]
            y_all = MLService.create_target(df, horizon=3).iloc[:-3] + 1
            from sklearn.ensemble import RandomForestClassifier
            rf = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
            rf.fit(X_all, y_all)
            preds = rf.predict(features_df)
            pred_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
            df["ml_signal"] = [pred_map.get(p, "HOLD") for p in preds]

        # Initial simulation variables
        capital = float(initial_capital)
        cash = capital
        position = None  # None or dict: {entry_price, amount, highest_price, entry_time}
        trades = []
        equity_curve = []

        initial_price = float(df.iloc[0]["close"])

        for idx, row in df.iterrows():
            current_time = str(row["timestamp"])
            current_close = float(row["close"])
            current_high = float(row["high"])
            current_low = float(row["low"])
            current_open = float(row["open"])

            # 1. Manage Active Position (SL / TP / Trailing Stop)
            if position is not None:
                entry_price = position["entry_price"]
                amount = position["amount"]
                
                # Update highest price reached during long trade (for trailing stop)
                if current_high > position["highest_price"]:
                    position["highest_price"] = current_high

                exit_trade = False
                exit_price = current_close
                exit_reason = ""

                # Stop Loss Check
                if sl_pct > 0.0:
                    sl_trigger_price = entry_price * (1.0 - sl_pct)
                    if current_low <= sl_trigger_price:
                        exit_trade = True
                        exit_price = sl_trigger_price * (1.0 - slip_rate) # Slippage on SL execution
                        exit_reason = "STOP_LOSS"

                # Take Profit Check
                if not exit_trade and tp_pct > 0.0:
                    tp_trigger_price = entry_price * (1.0 + tp_pct)
                    if current_high >= tp_trigger_price:
                        exit_trade = True
                        exit_price = tp_trigger_price * (1.0 - slip_rate)
                        exit_reason = "TAKE_PROFIT"

                # Trailing Stop Check
                if not exit_trade and trailing_sl_pct > 0.0:
                    trailing_trigger_price = position["highest_price"] * (1.0 - trailing_sl_pct)
                    if current_low <= trailing_trigger_price:
                        exit_trade = True
                        exit_price = trailing_trigger_price * (1.0 - slip_rate)
                        exit_reason = "TRAILING_STOP"

                # Custom Strategy Exit Conditions Check
                if not exit_trade and len(exit_conditions) > 0:
                    if BacktestEngine._eval_conditions(row, exit_conditions, logic_op):
                        exit_trade = True
                        exit_price = current_close * (1.0 - slip_rate)
                        exit_reason = "EXIT_SIGNAL"

                # Force exit on final candle
                if not exit_trade and idx == len(df) - 1:
                    exit_trade = True
                    exit_price = current_close * (1.0 - slip_rate)
                    exit_reason = "END_OF_DATA"

                # Execute Exit
                if exit_trade:
                    gross_proceeds = amount * exit_price
                    exit_fee = gross_proceeds * comm_rate
                    net_proceeds = gross_proceeds - exit_fee
                    cash += net_proceeds

                    pnl = net_proceeds - position["cost_basis"]
                    pnl_pct = (pnl / position["cost_basis"]) * 100.0

                    trades.append({
                        "id": len(trades) + 1,
                        "entry_time": position["entry_time"],
                        "exit_time": current_time,
                        "side": "LONG",
                        "entry_price": round(entry_price, 2),
                        "exit_price": round(exit_price, 2),
                        "amount": round(amount, 6),
                        "cost_basis": round(position["cost_basis"], 2),
                        "pnl": round(pnl, 2),
                        "pnl_pct": round(pnl_pct, 2),
                        "fees": round(position["entry_fee"] + exit_fee, 2),
                        "exit_reason": exit_reason
                    })

                    position = None

            # 2. Evaluate Strategy Entry Conditions (If cash available & no open position)
            if position is None and idx < len(df) - 1:
                should_entry = False
                if len(entry_conditions) > 0:
                    should_entry = BacktestEngine._eval_conditions(row, entry_conditions, logic_op)
                else:
                    # Default SMA crossover entry if no custom rules specified
                    sma20 = row.get("sma_20", 0)
                    sma50 = row.get("sma_50", 0)
                    if sma20 > sma50 and sma20 > 0 and sma50 > 0:
                        should_entry = True

                if should_entry:
                    allocated_cash = cash * pos_size_pct
                    if allocated_cash > 10.0: # Minimum $10 trade threshold
                        entry_price = current_close * (1.0 + slip_rate) # Slippage on buy
                        amount = allocated_cash / entry_price
                        entry_fee = allocated_cash * comm_rate
                        cost_basis = allocated_cash + entry_fee

                        cash -= cost_basis
                        position = {
                            "entry_price": entry_price,
                            "amount": amount,
                            "cost_basis": cost_basis,
                            "entry_fee": entry_fee,
                            "highest_price": current_high,
                            "entry_time": current_time
                        }

            # 3. Calculate Current Portfolio Equity & Drawdown
            current_position_value = (position["amount"] * current_close) if position is not None else 0.0
            total_equity = cash + current_position_value
            benchmark_equity = initial_capital * (current_close / initial_price)

            equity_curve.append({
                "timestamp": current_time,
                "equity": round(total_equity, 2),
                "benchmark_equity": round(benchmark_equity, 2),
                "close": round(current_close, 2)
            })

        # Calculate Performance Analytics
        metrics = AnalyticsService.calculate_metrics(equity_curve, trades, initial_capital)
        
        return {
            "metrics": metrics,
            "equity_curve": equity_curve,
            "trades": trades
        }

    @staticmethod
    def _eval_conditions(row, conditions, logic_op="AND"):
        """Evaluates single bar conditions against row dataframe values."""
        results = []
        for cond in conditions:
            ind = cond.get("indicator")
            op = cond.get("operator")
            val = cond.get("value")

            if ind not in row and not str(val).isalpha():
                results.append(False)
                continue

            left = row.get(ind)
            if left is None or pd.isna(left):
                results.append(False)
                continue

            # Check if right value is another indicator column (e.g., sma_20 vs sma_50)
            if isinstance(val, str) and val in row:
                right = row.get(val)
            else:
                try:
                    right = float(val)
                except (ValueError, TypeError):
                    right = str(val)

            res = False
            if op in [">", "gt"]:
                res = float(left) > float(right)
            elif op in ["<", "lt"]:
                res = float(left) < float(right)
            elif op in [">=", "gte"]:
                res = float(left) >= float(right)
            elif op in ["<=", "lte"]:
                res = float(left) <= float(right)
            elif op in ["==", "eq"]:
                res = str(left).upper() == str(right).upper()
            elif op in ["!=", "neq"]:
                res = str(left).upper() != str(right).upper()

            results.append(res)

        if not results:
            return False

        if logic_op == "OR":
            return any(results)
        return all(results)

class BacktestService:
    @staticmethod
    def run_backtest(symbol="BTC-USD", strategy=None, timeframe="1h", initial_capital=10000.0, commission_pct=0.1, slippage_pct=0.05):
        from services.data_service import data_service
        df = data_service.load_ohlcv(symbol=symbol, timeframe=timeframe, limit=1200)
        res = BacktestEngine.run_backtest(df, strategy or {}, initial_capital, commission_pct, slippage_pct)
        return res

backtest_service = BacktestService()

