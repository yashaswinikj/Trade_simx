import os
import sys
import logging
import numpy as np

logger = logging.getLogger("TradeSimX.HybridSignalEngine")

class HybridSignalEngine:
    def __init__(self, min_confidence_pct=50.0, min_expected_return_pct=0.5):
        self.min_confidence_pct = min_confidence_pct
        self.min_expected_return_pct = min_expected_return_pct

    def generate_signal(self, class_pred, class_probs, exp_return_pct, regime_info):
        """
        Synthesizes multiple model predictions and risk parameters into a high-conviction decision:
        BUY | SELL | HOLD | NO_TRADE
        """
        max_p_pct = float(np.max(class_probs) * 100.0) if np.max(class_probs) <= 1.0 else float(np.max(class_probs))
        pred_label = int(class_pred)

        regime_name = regime_info.get("regime_name", "NORMAL")

        # Risk Filter 1: If market is in extreme HIGH_VOLATILITY, restrict to NO_TRADE unless confidence >= 60%
        if regime_name == "HIGH_VOLATILITY" and max_p_pct < 60.0:
            return {
                "final_signal": "NO_TRADE",
                "confidence_pct": round(max_p_pct, 2),
                "reason": "Market regime is High Volatility; confidence below 60% safety threshold."
            }

        # Signal Synthesis Logic
        if pred_label == 2 and max_p_pct >= self.min_confidence_pct and exp_return_pct >= self.min_expected_return_pct:
            return {
                "final_signal": "BUY",
                "confidence_pct": round(max_p_pct, 2),
                "expected_return_pct": round(exp_return_pct, 2),
                "reason": f"High-confidence BUY ({max_p_pct:.1f}%) with expected return +{exp_return_pct:.2f}% in {regime_name} regime."
            }
        elif pred_label == 0 and max_p_pct >= self.min_confidence_pct and exp_return_pct <= -self.min_expected_return_pct:
            return {
                "final_signal": "SELL",
                "confidence_pct": round(max_p_pct, 2),
                "expected_return_pct": round(exp_return_pct, 2),
                "reason": f"High-confidence SELL ({max_p_pct:.1f}%) with expected return {exp_return_pct:.2f}% in {regime_name} regime."
            }
        elif max_p_pct < self.min_confidence_pct:
            return {
                "final_signal": "NO_TRADE",
                "confidence_pct": round(max_p_pct, 2),
                "reason": f"Model probability ({max_p_pct:.1f}%) below minimum required threshold ({self.min_confidence_pct}%)."
            }
        else:
            return {
                "final_signal": "HOLD",
                "confidence_pct": round(max_p_pct, 2),
                "reason": "Expected return micro-movement does not warrant execution fee."
            }

hybrid_engine = HybridSignalEngine()
