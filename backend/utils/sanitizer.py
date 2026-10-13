import math
import logging
import numpy as np

logger = logging.getLogger("TradeSimX.Sanitizer")

def safe_upper(val, default="N/A"):
    if val is None:
        return default
    return str(val).upper()

def safe_lower(val, default="N/A"):
    if val is None:
        return default
    return str(val).lower()

def safe_str(val, default="Not available"):
    if val is None:
        return default
    s = str(val).strip()
    return s if s else default

def safe_num(val, default=None):
    if val is None:
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (TypeError, ValueError):
        return default

def sanitize_backtest_context(obj):
    """
    Recursively sanitizes a Python dictionary/list/structure before sending to JSON/Groq.
    Converts None, NaN, Infinity, numpy types, and ObjectIds into JSON-safe values.
    Preserves valid numerical zero (0 and 0.0).
    """
    if obj is None:
        return "Not available"
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return "Not available"
        return float(obj)
    if isinstance(obj, (int, np.integer)):
        return int(obj)
    if isinstance(obj, (np.floating, np.ndarray)):
        if isinstance(obj, np.ndarray):
            return [sanitize_backtest_context(x) for x in obj]
        if math.isnan(obj) or math.isinf(obj):
            return "Not available"
        return float(obj)
    if isinstance(obj, str):
        return obj if obj.strip() else "Not available"
    if isinstance(obj, dict):
        return {str(k): sanitize_backtest_context(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [sanitize_backtest_context(x) for x in obj]
    return str(obj)
