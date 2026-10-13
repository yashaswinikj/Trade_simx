import os
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger("TradeSimX.FeatureEngineering")

class FeatureEngine:
    def __init__(self, prediction_horizon=3, use_volatility_adjusted_target=True):
        self.prediction_horizon = prediction_horizon
        self.use_volatility_adjusted_target = use_volatility_adjusted_target

    def calculate_features(self, df):
        """
        Calculates a high-signal feature set incorporating:
        1. Price Geometry & Wick Ratios
        2. Multi-Period Returns (1h to 48h)
        3. Moving Averages & Moving Average Distances
        4. Momentum Indicators (RSI 7/14, MACD, Stoch, ROC, Williams %R)
        5. Trend Indicators (ADX 14, +DI, -DI, 4h & 1d Trend Context)
        6. Volatility (ATR, ATR %, Bollinger Width, Rolling Volatility)
        7. Volume & VWAP (Volume Ratio, OBV, VWAP Distance)
        8. Multi-Timeframe Rolling Context (4h, 24h Trend Windows)
        9. Temporal Lag Features (Past 3 Candles Memory)
        
        Strictly zero look-ahead bias: all features evaluate information at or before T.
        """
        data = df.copy()
        if "close" not in data.columns:
            raise ValueError("DataFrame must contain 'close' price column.")

        # 1. Price Geometry & Candle Metrics
        data["range"] = data["high"] - data["low"]
        data["body"] = (data["close"] - data["open"]).abs()
        data["upper_wick"] = data["high"] - np.maximum(data["open"], data["close"])
        data["lower_wick"] = np.minimum(data["open"], data["close"]) - data["low"]
        data["wick_ratio"] = (data["upper_wick"] + 1e-9) / (data["lower_wick"] + 1e-9)
        data["close_open_ratio"] = data["close"] / (data["open"] + 1e-9)

        # 2. Historical Multi-Period Returns
        data["return_1h"] = data["close"].pct_change(1)
        data["return_3h"] = data["close"].pct_change(3)
        data["return_6h"] = data["close"].pct_change(6)
        data["return_12h"] = data["close"].pct_change(12)
        data["return_24h"] = data["close"].pct_change(24)
        data["return_48h"] = data["close"].pct_change(48)

        # 3. Moving Averages & Exponential Averages
        for p in [10, 20, 50, 100, 200]:
            data[f"sma_{p}"] = data["close"].rolling(window=p).mean()
        for p in [9, 21, 50, 100]:
            data[f"ema_{p}"] = data["close"].ewm(span=p, adjust=False).mean()

        # Moving Average Distances
        data["dist_sma_20"] = (data["close"] - data["sma_20"]) / (data["sma_20"] + 1e-9)
        data["dist_sma_50"] = (data["close"] - data["sma_50"]) / (data["sma_50"] + 1e-9)
        data["dist_sma_200"] = (data["close"] - data["sma_200"]) / (data["sma_200"] + 1e-9)
        data["dist_ema_21"] = (data["close"] - data["ema_21"]) / (data["ema_21"] + 1e-9)

        # 4. Higher-Timeframe Trend Context (Derived from Past 4h and 24h Windows)
        data["sma_4h_trend"] = (data["close"] - data["sma_20"].shift(4)) / (data["sma_20"].shift(4) + 1e-9)
        data["sma_1d_trend"] = (data["close"] - data["sma_50"].shift(24)) / (data["sma_50"].shift(24) + 1e-9)

        # 5. Momentum Indicators
        # RSI 14 & RSI 7
        for rsi_p in [7, 14]:
            delta = data["close"].diff(1)
            gain = (delta.where(delta > 0, 0)).rolling(window=rsi_p).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_p).mean()
            rs = gain / (loss + 1e-9)
            data[f"rsi_{rsi_p}"] = 100.0 - (100.0 / (1.0 + rs))

        # MACD (12, 26, 9)
        ema12 = data["close"].ewm(span=12, adjust=False).mean()
        ema26 = data["close"].ewm(span=26, adjust=False).mean()
        data["macd"] = ema12 - ema26
        data["macd_signal"] = data["macd"].ewm(span=9, adjust=False).mean()
        data["macd_hist"] = data["macd"] - data["macd_signal"]

        # Stochastic Oscillator (14, 3)
        low_14 = data["low"].rolling(window=14).min()
        high_14 = data["high"].rolling(window=14).max()
        data["stoch_k"] = 100.0 * ((data["close"] - low_14) / (high_14 - low_14 + 1e-9))
        data["stoch_d"] = data["stoch_k"].rolling(window=3).mean()

        # Williams %R (14)
        data["williams_r"] = -100.0 * ((high_14 - data["close"]) / (high_14 - low_14 + 1e-9))

        # ROC (Rate of Change)
        data["roc_6"] = ((data["close"] - data["close"].shift(6)) / (data["close"].shift(6) + 1e-9)) * 100.0
        data["roc_12"] = ((data["close"] - data["close"].shift(12)) / (data["close"].shift(12) + 1e-9)) * 100.0
        data["roc_24"] = ((data["close"] - data["close"].shift(24)) / (data["close"].shift(24) + 1e-9)) * 100.0

        # 6. Volatility Indicators
        # True Range & ATR 14
        tr1 = data["high"] - data["low"]
        tr2 = (data["high"] - data["close"].shift(1)).abs()
        tr3 = (data["low"] - data["close"].shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        data["atr_14"] = tr.rolling(window=14).mean()
        data["atr_pct"] = data["atr_14"] / (data["close"] + 1e-9)

        # Bollinger Bands & Rolling Volatility
        sma20 = data["sma_20"]
        std20 = data["close"].rolling(window=20).std()
        data["bollinger_upper"] = sma20 + (std20 * 2.0)
        data["bollinger_lower"] = sma20 - (std20 * 2.0)
        data["bb_width"] = (data["bollinger_upper"] - data["bollinger_lower"]) / (sma20 + 1e-9)
        data["rolling_volatility_20"] = std20 / (data["close"] + 1e-9)

        # 7. Volume Indicators, VWAP & OBV
        data["volume_change"] = data["volume"].pct_change(1)
        data["volume_sma_20"] = data["volume"].rolling(window=20).mean()
        data["volume_ratio"] = data["volume"] / (data["volume_sma_20"] + 1e-9)

        # On-Balance Volume (OBV)
        obv = (np.sign(data["close"].diff()) * data["volume"]).fillna(0).cumsum()
        data["obv"] = obv
        data["obv_change"] = data["obv"].pct_change(3)

        # VWAP & Distance
        typical_price = (data["high"] + data["low"] + data["close"]) / 3.0
        data["vwap"] = (typical_price * data["volume"]).cumsum() / (data["volume"].cumsum() + 1e-9)
        data["dist_vwap"] = (data["close"] - data["vwap"]) / (data["vwap"] + 1e-9)

        # 8. ADX & Directional Movement
        up_move = data["high"] - data["high"].shift(1)
        down_move = data["low"].shift(1) - data["low"]
        plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
        minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)

        plus_di = 100.0 * (pd.Series(plus_dm, index=data.index).ewm(span=14).mean() / (data["atr_14"] + 1e-9))
        minus_di = 100.0 * (pd.Series(minus_dm, index=data.index).ewm(span=14).mean() / (data["atr_14"] + 1e-9))
        dx = 100.0 * ((plus_di - minus_di).abs() / (plus_di + minus_di + 1e-9))
        data["adx_14"] = dx.ewm(span=14).mean()
        data["plus_di"] = plus_di
        data["minus_di"] = minus_di

        # 9. Lag Features (Temporal Memory of Past 3 Candles)
        data["return_1h_lag1"] = data["return_1h"].shift(1)
        data["return_1h_lag2"] = data["return_1h"].shift(2)
        data["return_1h_lag3"] = data["return_1h"].shift(3)

        data["rsi_14_lag1"] = data["rsi_14"].shift(1)
        data["rsi_14_lag2"] = data["rsi_14"].shift(2)

        data["macd_hist_lag1"] = data["macd_hist"].shift(1)
        data["macd_hist_lag2"] = data["macd_hist"].shift(2)

        data["volume_ratio_lag1"] = data["volume_ratio"].shift(1)
        data["atr_pct_lag1"] = data["atr_pct"].shift(1)

        # Drop NaN rows created by rolling window calculations
        data = data.dropna().reset_index(drop=True)
        return data

    def create_targets(self, df):
        """
        Creates four distinct targets:
        1. target_signal (3-Class or 4-Class: 0=SELL, 1=HOLD/NO_TRADE, 2=BUY) with Volatility-Adaptive ATR threshold.
        2. target_direction (Binary: 1=UP, 0=DOWN).
        3. target_future_return (Regression: % 3-hour return).
        4. target_opportunity (Binary: 1=HIGH_OPPORTUNITY, 0=NO_TRADE).
        """
        data = df.copy()

        # Future close price (lookahead for target ONLY)
        future_close = data["close"].shift(-self.prediction_horizon)
        future_return = (future_close - data["close"]) / (data["close"] + 1e-9)

        data["target_future_return"] = future_return * 100.0  # Percentage return
        data["target_direction"] = (future_return > 0).astype(int)  # 1=UP, 0=DOWN

        if self.use_volatility_adjusted_target and "atr_pct" in data.columns:
            # Volatility-adaptive threshold: Move must exceed 0.8x of current ATR % to be a genuine BUY/SELL signal
            threshold = data["atr_pct"] * 0.8
            buy_mask = future_return > threshold
            sell_mask = future_return < -threshold
        else:
            # Fixed threshold fallback (0.4%)
            buy_mask = future_return > 0.004
            sell_mask = future_return < -0.004

        # 3-Class Categorical Signal: 2=BUY, 1=HOLD/NO_TRADE, 0=SELL
        conditions = [buy_mask, sell_mask]
        choices = [2, 0]
        data["target_signal"] = np.select(conditions, choices, default=1)

        # High-Confidence Opportunity Target: 1 if BUY or SELL, 0 if HOLD/NO_TRADE
        data["target_opportunity"] = np.where(data["target_signal"] != 1, 1, 0)

        # Drop trailing rows where future_close is NaN
        data = data.iloc[:-self.prediction_horizon].copy().reset_index(drop=True)
        return data

feature_engine = FeatureEngine(prediction_horizon=3, use_volatility_adjusted_target=True)
