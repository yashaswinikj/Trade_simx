# TradeSimX AI: Quantitative Research & Simulation Platform

> **Official Project Title:** TradeSimX: An AI-Powered Adaptive Cryptocurrency Trading Strategy Research, Backtesting, Optimization and Decision Support Platform  
> **Version:** 2.0.0 (Pro Quant Upgrade)  

---

## 📌 Executive Summary

**TradeSimX AI** is an advanced, production-grade cryptocurrency quantitative research, machine learning forecasting, strategy backtesting, and decision-support SaaS platform. Built as a simulation system with **zero financial real-money risk**, TradeSimX fuses supervised Machine Learning, Deep Learning Recurrent Neural Networks (LSTM), SHAP Explainability, Market Regime Detection, Walk-Forward Validation, VaR Risk Analytics, Multi-Asset Paper Trading, and a ChatGPT-style conversational LLM AI Assistant (powered by Groq).

---

## 🚀 Key Platform Capabilities & Modules

1. **No-Code Visual Strategy Builder (`/strategy-builder`)**:
   - Construct multi-indicator rule sets using RSI, SMA, EMA, MACD, Bollinger Bands, and Volume with custom AND/OR logic.
   - Includes **AI Generate Strategy** and **AI Strategy Critic** ("Challenge My Strategy").

2. **Real Bar-by-Bar Backtesting Engine (`/backtests`)**:
   - Realistic order execution simulation featuring commission fees (0.1%), order book slippage (0.05%), Stop-Loss %, Take-Profit %, and Trailing Stops.

3. **Multi-Model ML & Deep Learning Lab (`/model-lab`)**:
   - **Supervised Classifiers**: Random Forest, XGBoost, LightGBM.
   - **Deep Learning Sequence Model**: PyTorch / Recurrent LSTM for sequential time-series forecasting.
   - **Ensemble Layer**: Soft-voting probability aggregation outputting directional signals (`BUY`, `HOLD`, `SELL`) and confidence percentages.
   - **SHAP Explainability**: Local feature impact bar charts and global feature attribution.

4. **Market Regime & Sentiment Engine (`/market-regime`)**:
   - Mathematical regime classification (`BULL_TREND`, `BEAR_TREND`, `SIDEWAYS`, `HIGH_VOLATILITY`, `LOW_VOLATILITY`) using ADX trend strength, moving average alignment, and rolling standard deviation.
   - Integrated NLP Crypto Text Sentiment Analysis (Positive %, Neutral %, Negative %).

5. **Strategy Optimization & Walk-Forward Validation (`/optimization-lab`)**:
   - Hyperparameter Grid / Random Search optimization over RSI thresholds, moving average windows, and SL/TP caps.
   - **Walk-Forward Validation**: Sequential rolling out-of-sample test windows to prove strategies do NOT overfit past data.

6. **Quantitative Risk Analytics (`/risk-analytics`)**:
   - Value at Risk (VaR 95%), Conditional VaR (CVaR 95%), Kelly Criterion optimal position sizing, and Portfolio Exposure caps.

7. **Multi-Asset Portfolio Tracker & Paper Trading (`/portfolio`, `/paper-trading`)**:
   - Multi-asset virtual portfolio tracker (BTC, ETH, SOL, BNB) with asset cross-correlation matrix.
   - **Paper Trading Simulator**: Virtual initial balance (₹10,00,000 / $100,000) for risk-free live simulation orders.

8. **ChatGPT-Style AI Assistant (`/ai-assistant`)**:
   - Multi-turn context-aware LLM chatbot (Groq API Llama 3.3 70B).
   - Knowledgeable on platform information ("Who built TradeSimX?"), technical concepts (RSI, overfitting, XGBoost vs Random Forest), Python coding examples, and backtest strategy critiques.

9. **Overfitting Defense Guide (`/preventing-overfitting`)**:
   - Detailed documentation on chronological data splits, out-of-sample validation, and feature scaling safety for academic viva presentation.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Recharts, Lucide React, Framer Motion
- **Backend**: Python 3.10+, Flask, REST API Blueprints
- **Database**: MongoDB (PyMongo) with resilient JSON Fallback Store
- **Machine Learning**: Scikit-Learn, XGBoost, LightGBM, Optuna
- **Deep Learning**: LSTM Recurrent Neural Network
- **Explainable AI**: SHAP (SHapley Additive exPlanations)
- **AI Engine**: Groq LLM API (Llama 3.3 70B / Mixtral)
- **Reports**: ReportLab PDF document builder & CSV exporter

---

## ⚙️ Running the Application Locally on Windows

### 1. Start Python Flask Backend (Port 5000)
```powershell
cd "c:\Users\sinchana k\OneDrive\Documents\my project"
python backend/app.py
```

### 2. Start React Vite Frontend (Port 5173)
```powershell
cd "c:\Users\sinchana k\OneDrive\Documents\my project\frontend"
cmd /c "npm run dev"
```

### 3. Open Web Browser
Navigate to:
[`http://localhost:5173`](http://localhost:5173)

---

## 🔑 Environment Variables Configuration

File: `backend/.env`
```ini
FLASK_APP=app.py
FLASK_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/tradesimx
GROQ_API_KEY=your_groq_api_key_here
DEFAULT_SYMBOL=BTC-USD
```

---

## 🎓 Academic Viva Defense Highlights

1. **How is Lookahead Bias Prevented?**
   - Time-series data is split chronologically (80% past train, 20% future test) without random shuffling.
   - StandardScaler parameters are computed strictly on training data.
2. **How does Walk-Forward Validation Work?**
   - Evaluates rolling out-of-sample windows to confirm strategy stability across changing market regimes.
3. **What is the Role of SHAP?**
   - Converts black-box tree predictions into transparent local feature contributions (e.g., RSI +14.2%, MACD +11.5%).

---

© 2026 TradeSimX AI Platform. All rights reserved.
