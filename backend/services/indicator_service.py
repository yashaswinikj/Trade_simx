import pandas as pd
import numpy as np

class IndicatorService:
    """
    Technical Indicators calculation engine with exact mathematical formulas.
    Operating directly on Pandas DataFrames.
    """
    
    @staticmethod
    def calculate_all(df, config=None):
        """
        Computes a standard set of technical indicators on the given OHLCV dataframe.
        """
        df = df.copy()
        cfg = config or {}

        # 1. Simple Moving Averages
        sma_periods = cfg.get("sma_periods", [10, 20, 50, 200])
        for period in sma_periods:
            df[f"sma_{period}"] = IndicatorService.sma(df["close"], period)

        # 2. Exponential Moving Averages
        ema_periods = cfg.get("ema_periods", [9, 12, 21, 26, 50, 200])
        for period in ema_periods:
            df[f"ema_{period}"] = IndicatorService.ema(df["close"], period)

        # 3. Relative Strength Index (RSI)
        rsi_period = cfg.get("rsi_period", 14)
        df["rsi"] = IndicatorService.rsi(df["close"], period=rsi_period)

        # 4. MACD (Moving Average Convergence Divergence)
        macd_fast = cfg.get("macd_fast", 12)
        macd_slow = cfg.get("macd_slow", 26)
        macd_signal = cfg.get("macd_signal", 9)
        macd_df = IndicatorService.macd(df["close"], fast=macd_fast, slow=macd_slow, signal=macd_signal)
        df["macd_line"] = macd_df["macd_line"]
        df["macd_signal"] = macd_df["macd_signal"]
        df["macd_hist"] = macd_df["macd_hist"]

        # 5. Bollinger Bands
        bb_period = cfg.get("bb_period", 20)
        bb_std = cfg.get("bb_std", 2.0)
        bb_df = IndicatorService.bollinger_bands(df["close"], period=bb_period, std_dev=bb_std)
        df["bb_upper"] = bb_df["bb_upper"]
        df["bb_middle"] = bb_df["bb_middle"]
        df["bb_lower"] = bb_df["bb_lower"]
        df["bb_bandwidth"] = bb_df["bb_bandwidth"]

        # 6. Average True Range (ATR)
        atr_period = cfg.get("atr_period", 14)
        df["atr"] = IndicatorService.atr(df["high"], df["low"], df["close"], period=atr_period)

        # 7. Volume Weighted Average Price (VWAP)
        df["vwap"] = IndicatorService.vwap(df["high"], df["low"], df["close"], df["volume"])

        # 8. Stochastic Oscillator
        stoch_k = cfg.get("stoch_k", 14)
        stoch_d = cfg.get("stoch_d", 3)
        stoch_df = IndicatorService.stochastic(df["high"], df["low"], df["close"], k_period=stoch_k, d_period=stoch_d)
        df["stoch_k"] = stoch_df["stoch_k"]
        df["stoch_d"] = stoch_df["stoch_d"]

        # 9. Rolling Volatility
        vol_period = cfg.get("volatility_period", 20)
        df["volatility"] = IndicatorService.volatility(df["close"], period=vol_period)

        return df

    @staticmethod
    def sma(series, period=20):
        """Simple Moving Average."""
        return series.rolling(window=period, min_periods=1).mean()

    @staticmethod
    def ema(series, period=20):
        """Exponential Moving Average."""
        return series.ewm(span=period, adjust=False, min_periods=1).mean()

    @staticmethod
    def rsi(series, period=14):
        """Relative Strength Index with Wilder's exponential smoothing."""
        delta = series.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)

        # Wilder's Smoothing
        avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()

        rs = avg_gain / (avg_loss.replace(0, 1e-10))
        rsi_series = 100.0 - (100.0 / (1.0 + rs))
        return rsi_series.fillna(50.0)

    @staticmethod
    def macd(series, fast=12, slow=26, signal=9):
        """MACD Line, Signal Line, and Histogram."""
        ema_fast = series.ewm(span=fast, adjust=False, min_periods=1).mean()
        ema_slow = series.ewm(span=slow, adjust=False, min_periods=1).mean()
        macd_line = ema_fast - ema_slow
        macd_signal = macd_line.ewm(span=signal, adjust=False, min_periods=1).mean()
        macd_hist = macd_line - macd_signal
        
        return pd.DataFrame({
            "macd_line": macd_line,
            "macd_signal": macd_signal,
            "macd_hist": macd_hist
        })

    @staticmethod
    def bollinger_bands(series, period=20, std_dev=2.0):
        """Bollinger Bands (Upper, Middle, Lower, Bandwidth)."""
        middle = series.rolling(window=period, min_periods=1).mean()
        std = series.rolling(window=period, min_periods=1).std().fillna(0.0)
        upper = middle + (std_dev * std)
        lower = middle - (std_dev * std)
        bandwidth = (upper - lower) / (middle.replace(0, 1e-10))

        return pd.DataFrame({
            "bb_upper": upper,
            "bb_middle": middle,
            "bb_lower": lower,
            "bb_bandwidth": bandwidth
        })

    @staticmethod
    def atr(high, low, close, period=14):
        """Average True Range."""
        prev_close = close.shift(1)
        tr1 = high - low
        tr2 = (high - prev_close).abs()
        tr3 = (low - prev_close).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        
        atr_series = tr.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
        return atr_series.fillna(tr.mean())

    @staticmethod
    def vwap(high, low, close, volume):
        """Volume Weighted Average Price."""
        typical_price = (high + low + close) / 3.0
        tp_vol = typical_price * volume
        cum_tp_vol = tp_vol.cumsum()
        cum_vol = volume.cumsum().replace(0, 1e-10)
        return cum_tp_vol / cum_vol

    @staticmethod
    def stochastic(high, low, close, k_period=14, d_period=3):
        """Stochastic Oscillator %K and %D."""
        lowest_low = low.rolling(window=k_period, min_periods=1).min()
        highest_high = high.rolling(window=k_period, min_periods=1).max()
        denom = (highest_high - lowest_low).replace(0, 1e-10)
        
        k = 100.0 * ((close - lowest_low) / denom)
        d = k.rolling(window=d_period, min_periods=1).mean()
        return pd.DataFrame({"stoch_k": k, "stoch_d": d})

    @staticmethod
    def volatility(series, period=20):
        """Rolling annualized volatility based on log returns."""
        log_ret = np.log(series / series.shift(1)).fillna(0.0)
        vol = log_ret.rolling(window=period, min_periods=1).std() * np.sqrt(365 * 24)
        return vol.fillna(0.0)
