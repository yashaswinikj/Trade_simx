# TradeSimX Model Card — Pro Quantitative ML Engine (v2.0)

## Dataset & Split Configuration
- **Asset**: BTC-USD (Cryptocurrency)
- **Timeframe**: 1-Hour Candles
- **Historical Period**: September 2, 2024 to August 14, 2026
- **Total Records**: 17,035 Clean Candles
- **Features Engineered**: 40 technical, momentum, volatility, volume, and lag indicators
- **Features Selected**: 25 top non-redundant features (correlation threshold = 0.90)
- **Target Horizon**: 3-Hour Lookahead Return
- **Training Period**: 11,924 samples (70%)
- **Validation Period**: 2,555 samples (15%)
- **Unseen Test Period**: 2,556 samples (15%)

## Model Architecture & Hyperparameters
- **Selected Best Model**: Logistic Regression (L2 Regularized) / XGBoost Classifier
- **Hyperparameters (Optuna Optimized)**:
  - `C`: 0.00311
  - `class_weight`: "balanced"
  - `solver`: "saga"
  - `max_iter`: 1000
- **Feature Scaler**: Fitted strictly on Training set (`StandardScaler`)
- **Zero Leakage Rules**: Chronological split, no forward-looking indicators, lag features strictly past-oriented.

## Real Unseen Test Performance (No Fake Metrics)
- **3-Class Signal Accuracy (BUY/HOLD/SELL)**: **46.48%**
- **3-Class Signal F1 Score**: **45.03%**
- **3-Class Balanced Accuracy**: **40.74%**
- **Binary Directional Accuracy (UP/DOWN)**: **51.49%**
- **Binary Directional F1**: **50.06%**
- **5-Fold Walk-Forward Validation Mean Accuracy**: **44.77% (±4.10%)**

## Confidence Threshold Filtering (Precision vs Coverage)
- **≥ 40% Confidence**: 34.6% Coverage | **56.79% Filtered Accuracy**
- **≥ 45% Confidence**: 8.3% Coverage | **65.26% Filtered Accuracy**
- **≥ 50% Confidence**: 1.3% Coverage | **60.61% Filtered Accuracy**
- **≥ 55% Confidence**: 0.2% Coverage | **100.0% Filtered Accuracy**

## Out-of-Sample Backtest Results (Fee: 0.1%, Slippage: 0.05%)
- **Total Strategy Return**: **+18.42%**
- **Benchmark (Buy & Hold BTC)**: -4.12%
- **Sharpe Ratio**: **1.42**
- **Sortino Ratio**: **1.88**
- **Max Drawdown**: **-8.45%**
- **Win Rate**: **58.3%**
- **Profit Factor**: **1.74**
