import uuid
from datetime import datetime

def create_strategy_model(name, description, rules, risk_management=None, author="User"):
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description or "",
        "rules": rules or {
            "entry_conditions": [],
            "exit_conditions": [],
            "logic_operator": "AND"
        },
        "risk_management": risk_management or {
            "stop_loss_pct": 2.0,
            "take_profit_pct": 5.0,
            "trailing_stop_pct": 0.0,
            "position_sizing_type": "percent_equity",
            "position_size": 20.0,
            "max_drawdown_limit": 15.0
        },
        "author": author,
        "created_at": datetime.now().isoformat()
    }

def create_backtest_result_model(strategy_id, strategy_name, symbol, timeframe, initial_capital, metrics, equity_curve, trades, parameters):
    return {
        "id": str(uuid.uuid4()),
        "strategy_id": strategy_id,
        "strategy_name": strategy_name,
        "symbol": symbol,
        "timeframe": timeframe,
        "initial_capital": initial_capital,
        "metrics": metrics, # net_profit, win_rate, sharpe_ratio, max_drawdown, profit_factor, total_trades
        "equity_curve": equity_curve,
        "trades": trades,
        "parameters": parameters,
        "timestamp": datetime.now().isoformat()
    }

def create_ml_model_metadata(model_id, name, algorithm, symbol, features, metrics):
    return {
        "id": model_id or str(uuid.uuid4()),
        "name": name,
        "algorithm": algorithm, # "xgboost" or "random_forest"
        "symbol": symbol,
        "features": features,
        "metrics": metrics, # accuracy, precision, recall, f1_score
        "created_at": datetime.now().isoformat()
    }
