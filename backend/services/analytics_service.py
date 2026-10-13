import numpy as np
import pandas as pd

class AnalyticsService:
    """
    Quantitative metrics calculator for trading strategies.
    Uses exact financial engineering formulas.
    """

    @staticmethod
    def calculate_metrics(equity_curve, trades, initial_capital=10000.0):
        if not equity_curve:
            return AnalyticsService._empty_metrics(initial_capital)

        equity_df = pd.DataFrame(equity_curve)
        equities = equity_df["equity"].values
        final_equity = equities[-1]
        
        # Net Profit
        net_profit = final_equity - initial_capital
        net_profit_pct = (net_profit / initial_capital) * 100.0

        # Benchmark Net Profit
        benchmarks = equity_df["benchmark_equity"].values
        benchmark_return_pct = ((benchmarks[-1] - initial_capital) / initial_capital) * 100.0

        # Daily / Hourly Returns series for Sharpe & Sortino ratios
        returns = pd.Series(equities).pct_change().dropna().values
        
        # Sharpe Ratio (Assuming 24/7 crypto trading with 8760 hours/year or 365 days/year)
        risk_free_rate = 0.02 # 2% annual risk-free rate
        period_rf = risk_free_rate / (365 * 24) # per hour
        excess_returns = returns - period_rf
        
        std_dev = np.std(returns)
        if std_dev > 0:
            sharpe_ratio = float(np.mean(excess_returns) / std_dev * np.sqrt(365 * 24))
        else:
            sharpe_ratio = 0.0

        # Sortino Ratio (Downside deviation only)
        downside_returns = returns[returns < 0]
        downside_std = np.std(downside_returns) if len(downside_returns) > 0 else 0.0
        if downside_std > 0:
            sortino_ratio = float(np.mean(excess_returns) / downside_std * np.sqrt(365 * 24))
        else:
            sortino_ratio = 0.0

        # Max Drawdown
        running_max = np.maximum.accumulate(equities)
        drawdowns = (equities - running_max) / running_max
        max_drawdown_pct = float(np.min(drawdowns)) * 100.0 # Negative %

        # Trade Statistics
        total_trades = len(trades)
        if total_trades > 0:
            trade_pnls = [t["pnl"] for t in trades]
            trade_pnl_pcts = [t["pnl_pct"] for t in trades]
            
            winning_trades = [p for p in trade_pnls if p > 0]
            losing_trades = [p for p in trade_pnls if p <= 0]
            
            win_count = len(winning_trades)
            loss_count = len(losing_trades)
            win_rate = (win_count / total_trades) * 100.0

            gross_profit = sum(winning_trades)
            gross_loss = abs(sum(losing_trades))
            
            profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 1.0)
            avg_trade_pnl = float(np.mean(trade_pnls))
            avg_trade_pnl_pct = float(np.mean(trade_pnl_pcts))
            
            max_win = float(np.max(trade_pnls)) if winning_trades else 0.0
            max_loss = float(np.min(trade_pnls)) if losing_trades else 0.0
            
            # Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
            avg_win = float(np.mean(winning_trades)) if winning_trades else 0.0
            avg_loss_val = abs(float(np.mean(losing_trades))) if losing_trades else 0.0
            expectancy = ((win_rate / 100.0) * avg_win) - (((100.0 - win_rate) / 100.0) * avg_loss_val)
        else:
            win_count = 0
            loss_count = 0
            win_rate = 0.0
            profit_factor = 0.0
            avg_trade_pnl = 0.0
            avg_trade_pnl_pct = 0.0
            max_win = 0.0
            max_loss = 0.0
            expectancy = 0.0

        return {
            "initial_capital": round(initial_capital, 2),
            "final_equity": round(final_equity, 2),
            "total_equity": round(final_equity, 2),
            "net_profit": round(net_profit, 2),
            "net_profit_pct": round(net_profit_pct, 2),
            "benchmark_return_pct": round(benchmark_return_pct, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "sortino_ratio": round(sortino_ratio, 2),
            "max_drawdown_pct": round(max_drawdown_pct, 2),
            "total_trades": total_trades,
            "winning_trades": win_count,
            "losing_trades": loss_count,
            "win_rate": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2),
            "avg_trade_pnl": round(avg_trade_pnl, 2),
            "avg_trade_pnl_pct": round(avg_trade_pnl_pct, 2),
            "max_win": round(max_win, 2),
            "max_loss": round(max_loss, 2),
            "expectancy": round(expectancy, 2)
        }

    @staticmethod
    def _empty_metrics(initial_capital=10000.0):
        return {
            "initial_capital": round(initial_capital, 2),
            "final_equity": round(initial_capital, 2),
            "total_equity": round(initial_capital, 2),
            "net_profit": 0.0,
            "net_profit_pct": 0.0,
            "benchmark_return_pct": 0.0,
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "max_drawdown_pct": 0.0,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "win_rate": 0.0,
            "profit_factor": 0.0,
            "avg_trade_pnl": 0.0,
            "avg_trade_pnl_pct": 0.0,
            "max_win": 0.0,
            "max_loss": 0.0,
            "expectancy": 0.0
        }
