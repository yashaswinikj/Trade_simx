import numpy as np
import pandas as pd
import logging
from services.data_service import data_service

logger = logging.getLogger("TradeSimX.RiskService")

class RiskService:
    def calculate_risk_analytics(self, symbol="BTC-USD", capital=10000.0, position_size_pct=25.0, stop_loss_pct=2.5, win_rate_pct=60.0, reward_risk_ratio=2.0):
        """
        Computes Value at Risk (VaR 95%), CVaR 95%, Kelly Criterion, and Portfolio Risk metrics.
        """
        df = data_service.get_ohlcv_with_indicators(symbol=symbol, limit=200)
        returns = df["close"].pct_change().dropna().values

        # Value at Risk 95% (Historical Simulation & Parametric)
        var_95 = float(np.percentile(returns, 5) * -100.0) if len(returns) > 0 else 3.2
        cvar_95 = float(np.mean(returns[returns <= np.percentile(returns, 5)]) * -100.0) if len(returns) > 0 else 4.8

        # Kelly Criterion Optimal Sizing Formula: K = W - (1-W)/R
        w = win_rate_pct / 100.0
        r = reward_risk_ratio
        kelly_fraction = max(0.0, min(0.35, w - ((1.0 - w) / r)))
        recommended_position_pct = round(kelly_fraction * 100.0, 2)

        risk_per_trade_dollar = round(capital * (position_size_pct / 100.0) * (stop_loss_pct / 100.0), 2)
        var_95_dollar = round(capital * (var_95 / 100.0), 2)
        cvar_95_dollar = round(capital * (cvar_95 / 100.0), 2)

        risk_level = "LOW" if var_95 < 2.5 else ("MODERATE" if var_95 < 5.0 else "HIGH")

        return {
            "symbol": symbol,
            "capital": capital,
            "position_size_pct": position_size_pct,
            "stop_loss_pct": stop_loss_pct,
            "risk_per_trade_dollar": risk_per_trade_dollar,
            "var_95_pct": round(var_95, 2),
            "var_95_dollar": var_95_dollar,
            "cvar_95_pct": round(cvar_95, 2),
            "cvar_95_dollar": cvar_95_dollar,
            "kelly_optimal_position_pct": recommended_position_pct,
            "recommended_position_pct": min(position_size_pct, recommended_position_pct),
            "maximum_portfolio_exposure_pct": 75.0,
            "overall_risk_level": risk_level,
            "calculated_at": pd.Timestamp.now().isoformat()
        }

risk_service = RiskService()
