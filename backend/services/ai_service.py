import os
import json
import logging
import datetime
import pandas as pd
from dotenv import load_dotenv

try:
    from groq import Groq
    GROQ_SDK_AVAILABLE = True
except ImportError:
    GROQ_SDK_AVAILABLE = False
    import requests

from config import Config
from services.trading_context_service import trading_context_service

logger = logging.getLogger("TradeSimX.AIService")

FALLBACK_MODELS = [
    "openai/gpt-oss-20b",
    "groq/compound",
    "allam-2-7b",
    "qwen/qwen3.6-27b"
]

class AIService:
    def __init__(self):
        self.reload_config()

    def reload_config(self):
        """Loads central AI configuration from backend/.env and Config."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        env_path = os.path.join(os.path.dirname(base_dir), ".env")
        if os.path.exists(env_path):
            load_dotenv(dotenv_path=env_path, override=True)

        self.api_key = (os.getenv("GROQ_API_KEY") or Config.GROQ_API_KEY or "").strip()
        self.model = (os.getenv("GROQ_MODEL") or Config.GROQ_MODEL or "openai/gpt-oss-20b").strip()
        self.temperature = Config.GROQ_TEMPERATURE
        self.max_tokens = Config.GROQ_MAX_TOKENS

        if self.api_key and GROQ_SDK_AVAILABLE:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Groq SDK client: {e}")
                self.client = None
        else:
            self.client = None

    def check_health(self):
        """Returns real health status without revealing secrets."""
        self.reload_config()
        if not self.api_key:
            return {
                "status": "error",
                "configured": False,
                "provider": "Groq",
                "model": self.model,
                "message": "GROQ_API_KEY is not configured in backend/.env"
            }
        
        return {
            "status": "ok",
            "configured": True,
            "provider": "Groq",
            "model": self.model,
            "sdk_installed": GROQ_SDK_AVAILABLE
        }

    def _execute_completion(self, messages, model_name):
        """Executes LLM chat completion using specified model with Groq SDK or HTTP fallback."""
        if GROQ_SDK_AVAILABLE and self.client:
            resp = self.client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            return resp.choices[0].message.content
        else:
            endpoint = "https://api.groq.com/openai/v1/chat/completions"
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens
            }
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            res = requests.post(endpoint, json=payload, headers=headers, timeout=20)
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise RuntimeError(f"Groq HTTP API Error {res.status_code}: {res.text}")

    def generate_backtest_analysis(self, backtest_id):
        """
        Generates a 18-part human-readable quantitative report for a specific backtest ID.
        Strictly enforces Context A (Backtest ID metrics) vs Context B (Global ML benchmarks).
        """
        self.reload_config()
        if not self.api_key:
            raise ValueError("Groq API key is missing or invalid in backend/.env")

        context = trading_context_service.get_complete_backtest_context(backtest_id)
        
        b_info = context.get("backtest_info", {})
        perf = context.get("performance_metrics", {})

        if not b_info or not b_info.get("id"):
            logger.error("[AI BACKTEST VALIDATION] Context valid: NO - Missing backtest_info")
            raise ValueError("BACKTEST_CONTEXT_MISMATCH: The selected backtest result could not be loaded correctly from MongoDB.")

        system_prompt = """You are a friendly, expert AI Trading Explanation Assistant for TradeSimX (an educational final-year AI/ML project).
Your task is to analyze the backtest result provided in the JSON payload and explain it to a student in simple, human-readable prose.

CORE RULES:
1. SIMPLE HUMAN LANGUAGE:
   - Explain everything as if sitting beside a student showing them their backtest results.
   - NEVER use complex finance jargon (like "risk-adjusted return", "capital trajectory", "stochastic dominance", "market microstructure") without immediately explaining it in 1-2 simple sentences.
2. EXPLAIN EVERY TECHNICAL METRIC:
   - For every technical metric (Sharpe, Profit Factor, Drawdown, Win Rate, Expectancy):
     a. Show the metric value.
     b. Explain what the metric measures in simple words.
     c. Explain what happened in THIS exact backtest.
     d. Give a clear rating/verdict (🟢 Good / 🟡 Average / 🔴 Bad).
3. EXACT 18 SECTIONS REQUIRED - NO MISSING SECTIONS & NO EMPTY HEADINGS:
   - You MUST output all 18 sections below. NEVER omit a section. NEVER generate empty headings like "8." or "9." without text.
   - If data is unavailable, explicitly write: "⚠️ Data not available for this backtest." AND explain what that metric would normally tell us.
4. ZERO-TRADE BACKTESTS (Total Trades = 0):
   - State clearly that 0 trades occurred.
   - Explain that Win Rate, Profit Factor, and Best/Worst trades cannot be evaluated because no trades were taken.
   - Explain that signal generation is the main issue.
5. METRIC SEPARATION:
   - Use Context A (backtest_info and performance_metrics) ONLY for current backtest metrics.
   - Demarcate Context B (global_ml_model_info) under Section 16 ONLY.
6. NO FABRICATED DATA:
   - Only use numbers from the JSON payload.

REQUIRED 18-SECTION MARKDOWN REPORT FORMAT:

🤖 AI BACKTEST ANALYSIS
Strategy: [strategy_name]
Asset: [symbol]
Timeframe: [timeframe]
Backtest ID: [id]

========================================================
1. 📌 WHAT HAPPENED IN THIS BACKTEST?
========================================================
(Provide a 4–6 sentence simple overview explaining starting capital, final equity, money gained/lost, return %, benchmark return, whether strategy beat or lost to benchmark, and overall result.)

🎯 SIMPLE VERDICT:
[PROFITABLE / NOT PROFITABLE / MIXED] - [1-2 simple sentences explaining why]

========================================================
2. 💰 YOUR MONEY — START TO END
========================================================
Starting Capital: $[initial_capital]
Final Equity: $[final_equity]
Money Gained/Lost: $[net_profit]
Strategy Return: [net_return_pct]%
Benchmark Return: [benchmark_return_pct]%
Difference vs Benchmark: [diff_vs_benchmark_pct]%

💡 In simple words:
[Explain in 2-3 clear sentences what happened to the user's money.]

========================================================
3. 📊 TRADE PERFORMANCE
========================================================
Total Trades: [total_trades]
Winning Trades: [winning_trades]
Losing Trades: [losing_trades]
Win Rate: [win_rate_pct]%
Average P&L per Trade: $[avg_trade_pnl]
Largest Winning Trade: $[max_win]
Largest Losing Trade: $[max_loss]
Expectancy: $[expectancy]

What does this tell us?
[Explain trade counts, win rate, and trade expectation in plain English.]

========================================================
4. 🟢 WINNING TRADES VS 🔴 LOSING TRADES
========================================================
[Compare winning vs losing trade frequency and payoff size. Explain why this combination produced the final result.]

========================================================
5. 💵 PROFIT FACTOR — EXPLAINED SIMPLY
========================================================
Profit Factor: [profit_factor]

What is Profit Factor?
It compares total dollars won from winning trades against total dollars lost from losing trades.

What happened in this backtest?
[Explain the actual value.]

Verdict: [🟢 Strong (>1.5) / 🟡 Good (1.2-1.5) / 🟡 Weak (1.0-1.2) / 🔴 Losing (<1.0)]

========================================================
6. 📈 SHARPE RATIO — EXPLAINED SIMPLY
========================================================
Sharpe Ratio: [sharpe_ratio]

What is Sharpe Ratio?
It tells us whether the return earned was good compared with the amount of risk taken.

What happened here?
[Explain actual value for this strategy.]

Verdict: [🟢 Strong (>1.0) / 🟡 Moderate (0 - 1.0) / 🔴 Poor (<0)]

========================================================
7. 📉 MAXIMUM DRAWDOWN — HOW BAD WAS THE FALL?
========================================================
Maximum Drawdown: [max_drawdown_pct]%
Peak Equity: $[peak_equity]
Lowest Equity: $[lowest_equity]

What is Maximum Drawdown?
It measures the biggest percentage drop in account value from a previous high peak.

What happened in this backtest?
[Explain the fall in dollars and percentage.]

Risk Severity: [🟢 Low Risk (<10%) / 🟡 Moderate Risk (10-25%) / 🔴 High Risk (>25%)]

========================================================
8. 🎯 STRATEGY EFFECTIVENESS
========================================================
Overall Strategy Rating: [⭐⭐⭐⭐⭐ / ⭐⭐⭐⭐ / ⭐⭐⭐ / ⭐⭐ / ⭐]

[Explain the rating in 2–4 simple sentences evaluating money, benchmark, win rate, profit factor, drawdown, and consistency. THIS SECTION MUST NEVER BE EMPTY.]

========================================================
9. 📈 EQUITY CURVE — WHAT HAPPENED TO THE ACCOUNT?
========================================================
[Explain the equity curve trajectory over time in simple words. Detail growth, drops, and stability.]

========================================================
10. 🏆 BENCHMARK COMPARISON
========================================================
Strategy Return: [net_return_pct]%
Benchmark Return: [benchmark_return_pct]%
Difference: [diff_vs_benchmark_pct]%

What would have happened if you simply held BTC?
[Explain whether holding BTC or using this strategy worked better.]

========================================================
11. 🔍 WHY DID THE STRATEGY WIN OR LOSE?
========================================================
[Explain root cause drivers based strictly on backtest metrics.]

========================================================
12. ⚠️ MAIN PROBLEMS FOUND
========================================================
[Numbered list of data-backed problems.]

========================================================
13. 💪 STRENGTHS OF THIS BACKTEST
========================================================
[List data-backed strengths or state: "⚠️ No significant strengths were identified from the available backtest metrics."]

========================================================
14. 🛡️ RISK ANALYSIS
========================================================
[Analyze drawdown, position size, stop loss, take profit, and loss frequency.]

Risk Level: [🟢 Low / 🟡 Moderate / 🔴 High] - [Explanation]

========================================================
15. 💸 FEES, SLIPPAGE & OVERTRADING
========================================================
[Explain fee/slippage settings and trade frequency impact, or state: "⚠️ Fee/slippage information is not available for this backtest."]

========================================================
16. 🧠 ML MODEL CONNECTION
========================================================
[Clearly separate Context A current backtest performance from Context B global ML model benchmarks (58.29% test acc, 53.82% walk-forward).]

========================================================
17. 🔧 WHAT SHOULD BE IMPROVED?
========================================================
[Actionable recommendations tied directly to the observed problems.]

========================================================
18. 🏁 FINAL VERDICT
========================================================
Status: [🟢 PROFITABLE / STRONG, 🟡 NEEDS IMPROVEMENT, or 🔴 NOT PROFITABLE]

Why: [Explanation of main problem, main strength, and top fix priority]

--------------------------------------------------------
📌 ONE-LINE TAKEAWAY
--------------------------------------------------------
[One extremely simple sentence summarizing the entire backtest result.]
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Here is the complete JSON context for Backtest ID '{b_info.get('id')}':\n\n{json.dumps(context, indent=2)}"}
        ]

        logger.info(f"[AI BACKTEST] Sending context to Groq (Model: {self.model})...")

        try:
            analysis_text = self._execute_completion(messages, self.model)
            logger.info("[AI BACKTEST] Groq response received.")
            return {
                "success": True,
                "analysis": analysis_text,
                "model": self.model,
                "backtest_id": b_info.get("id"),
                "timestamp": pd.Timestamp.now().strftime("%H:%M:%S")
            }
        except Exception as e:
            err_str = str(e).lower()
            if any(k in err_str for k in ["model_not_found", "404", "decommissioned", "does not exist", "rate_limit_exceeded", "429"]):
                logger.warning(f"Model '{self.model}' failed ({e}). Initiating automatic model fallback...")
                for fallback_model in FALLBACK_MODELS:
                    if fallback_model == self.model:
                        continue
                    try:
                        logger.info(f"Retrying backtest analysis with fallback model '{fallback_model}'...")
                        analysis_text = self._execute_completion(messages, fallback_model)
                        self.model = fallback_model
                        logger.info(f"Fallback successful! Active model set to '{self.model}'.")
                        return {
                            "success": True,
                            "analysis": analysis_text,
                            "model": self.model,
                            "backtest_id": b_info.get("id"),
                            "timestamp": pd.Timestamp.now().strftime("%H:%M:%S")
                        }
                    except Exception as fb_err:
                        logger.error(f"Fallback attempt to '{fallback_model}' failed: {fb_err}")

            logger.error(f"[AI BACKTEST ERROR]: {e}")
            raise RuntimeError(f"Groq API Error: {str(e)}")

    def generate_market_analysis(self, symbol="BTC-USD", custom_context=None, user_id=None):
        """
        Generates genuine structured live market & strategy analysis for 'Analyse with AI' buttons.
        """
        self.reload_config()
        if not self.api_key:
            raise ValueError("Groq API key is missing or invalid in backend/.env")

        context = custom_context or trading_context_service.get_live_trading_context(symbol=symbol, user_id=user_id)

        system_prompt = """You are the official TradeSimX AI Analyst.
Perform a genuine, structured quantitative analysis of the current market and strategy state provided in the JSON context.

STRUCTURED OUTPUT FORMAT REQUIRED:

### MARKET SUMMARY
- **Symbol & Price**: [Symbol] at $[Price]
- **Market Regime**: [Regime Name] (Confidence: [Regime Confidence]%)
- **Volatility & Trend**: [Volatility Level], [Trend Direction]

### TECHNICAL ANALYSIS
- **RSI (14)**: [RSI Value] - [Interpretation]
- **MACD**: [MACD] / Signal: [Signal] / Hist: [Hist] - [Interpretation]
- **Moving Averages**: EMA 9 ($[EMA9]), EMA 21 ($[EMA21]), SMA 50 ($[SMA50]) - [Trend Structure]
- **Bollinger Bands**: Upper $[Upper], Lower $[Lower], Width [Width]

### ML MODEL ANALYSIS
- **Signal**: [BUY / HOLD / SELL]
- **Ensemble Probabilities**: BUY [BuyProb]%, HOLD [HoldProb]%, SELL [SellProb]%
- **Model Confidence**: [Confidence]%
- **Key SHAP Feature Drivers**: [Top Drivers]

### TRADING STRATEGY
- **Signal Status**: [TRADE / NO TRADE]
- **Reason**: [Explicit rationale. If confidence < 65%, explicitly state: "Trade not recommended because model confidence is below the configured threshold."]

### RISK ANALYSIS
- **Suggested Stop Loss**: $[StopLossPrice] ([StopLossPct]%)
- **Suggested Take Profit**: $[TakeProfitPrice] ([TakeProfitPct]%)
- **Risk/Reward Ratio**: [RiskReward]
- **Position Allocation**: [PositionSize]% (Max Allowed: [MaxAllocation]%)

### FINAL AI ASSESSMENT
[Provide a clear 3-4 sentence analytical conclusion. Emphasize that TradeSimX is an educational simulation platform.]
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Here is the live TradeSimX JSON context for {symbol}:\n\n{json.dumps(context, indent=2)}"}
        ]

        try:
            analysis_text = self._execute_completion(messages, self.model)
            return {
                "success": True,
                "analysis": analysis_text,
                "model": self.model,
                "timestamp": pd.Timestamp.now().strftime("%H:%M:%S")
            }
        except Exception as e:
            err_str = str(e).lower()
            if any(k in err_str for k in ["model_not_found", "404", "decommissioned", "does not exist", "rate_limit_exceeded", "429"]):
                for fallback_model in FALLBACK_MODELS:
                    if fallback_model == self.model:
                        continue
                    try:
                        analysis_text = self._execute_completion(messages, fallback_model)
                        self.model = fallback_model
                        return {
                            "success": True,
                            "analysis": analysis_text,
                            "model": self.model,
                            "timestamp": pd.Timestamp.now().strftime("%H:%M:%S")
                        }
                    except Exception:
                        pass
            raise RuntimeError(f"Groq API Error: {str(e)}")

    def generate_chat_response(self, message, conversation=None, symbol="BTC-USD", user_id=None, **kwargs):
        """
        Context-aware multi-turn conversational LLM endpoint for TradeSimX AI Assistant.
        Enriches prompts with live project state while maintaining conversational chat capabilities.
        """
        self.reload_config()
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured in backend/.env")

        conversation = conversation or []
        live_ctx = trading_context_service.get_live_trading_context(symbol=symbol, user_id=user_id)

        system_prompt = f"""You are the official TradeSimX AI Conversational Assistant.
You are a friendly, intelligent, highly capable general-purpose AI assistant.

GENERAL CONVERSATIONAL CAPABILITIES:
- You answer general questions naturally (greetings like 'Hi', 'How are you?', general knowledge, Python, JavaScript, AI, machine learning, data science, mathematics, jokes, and general conversation).
- Answer clearly, helpfully, and using markdown formatting (bullet points, bold text, code blocks when applicable).
- Maintain context across follow-up questions in the chat session.

LIVE TRADESIMX PROJECT CONTEXT (USE FOR SYSTEM QUESTIONS):
{json.dumps(live_ctx, indent=2)}

PROJECT ARCHITECTURE & AUDITED METRICS:
- TradeSimX is an AI-powered cryptocurrency market analysis, paper trading, and strategy simulation platform for AI & Data Science research.
- Ensemble Model: Calibrated Soft-Voting Ensemble (XGBoost, Random Forest, HistGradientBoosting, Logistic Regression).
- Audited Performance: Final unseen test accuracy 58.29%, Walk-Forward CV 53.82% ± 1.62%, High-confidence accuracy 77.08% at >= 65% threshold (3.76% coverage, 96 signals, 74 correct), Backtest return +18.42%, Sharpe 1.42, Max drawdown -8.45%.

DEVELOPER CONTEXT:
- TradeSimX was developed as an educational final-year AI & Data Science research project. Respond naturally using project information. Do NOT invent fake founder names.

Answer user questions accurately. When asked about current price, prediction, regime, risk, portfolio balance, open positions, or last trade, use the EXACT live project context above."""

        messages = [{"role": "system", "content": system_prompt}]

        for item in conversation[-10:]:
            role = "user" if item.get("role") in ["user", "sender"] else "assistant"
            content = item.get("content") or item.get("text") or ""
            if content.strip():
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": message})

        try:
            generated_text = self._execute_completion(messages, self.model)
            return {"success": True, "message": generated_text, "model": self.model}
        except Exception as e:
            err_str = str(e).lower()
            if any(k in err_str for k in ["model_not_found", "404", "decommissioned", "does not exist", "rate_limit_exceeded", "429"]):
                for fallback_model in FALLBACK_MODELS:
                    if fallback_model == self.model:
                        continue
                    try:
                        generated_text = self._execute_completion(messages, fallback_model)
                        self.model = fallback_model
                        return {"success": True, "message": generated_text, "model": self.model}
                    except Exception:
                        pass
            raise RuntimeError(f"Groq SDK Error: {str(e)}")

    @staticmethod
    def analyze_strategy(strategy_config, metrics):
        """Analyzes strategy performance metrics and provides score and recommendations."""
        score = 75
        sharpe = metrics.get("sharpe_ratio", 0)
        net_profit = metrics.get("net_profit_pct", 0)
        win_rate = metrics.get("win_rate", 0)
        drawdown = abs(metrics.get("max_drawdown_pct", 0))

        if sharpe > 1.5:
            score += 15
        elif sharpe < 0:
            score -= 20

        if drawdown > 20:
            score -= 15
        
        score = max(10, min(99, score))

        recommendations = [
            f"Sharpe Ratio is {sharpe:.2f} — {'strong risk-adjusted return' if sharpe > 1.0 else 'consider tightening risk rules'}.",
            f"Maximum Drawdown is {drawdown:.1f}% — {'within acceptable bounds' if drawdown <= 15 else 'use trailing stop-loss to mitigate downside'}.",
            f"Win Rate is {win_rate:.1f}% — {'solid entry signals' if win_rate >= 50 else 'refine entry filter conditions'}."
        ]

        return {
            "score": score,
            "summary": f"Strategy {strategy_config.get('name', 'Custom')} analyzed with {score}/100 quality score.",
            "recommendations": recommendations
        }

ai_service = AIService()
