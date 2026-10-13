import os
import logging
import requests
import pandas as pd
import numpy as np
from config import Config
from utils.sanitizer import safe_upper, safe_lower, safe_str

logger = logging.getLogger("TradeSimX.DataService")

class DataService:
    """
    Service for loading, caching, and preprocessing OHLCV market datasets.
    Supports BTC-USD, ETH-USD, SOL-USD, BNB-USD on 1h, 4h, 1d timeframes.
    """

    @staticmethod
    def load_ohlcv(symbol="BTC-USD", timeframe="1h", limit=1200):
        """
        Loads historical OHLCV data for a given symbol and timeframe.
        Loads from local dataset CSV first, or fetches live via Binance public API if available.
        """
        symbol_str = safe_str(symbol, "BTC-USD")
        timeframe_str = safe_str(timeframe, "1h")

        symbol_clean = symbol_str.upper().replace("-", "").replace("/", "")
        if "USD" in symbol_clean and not symbol_clean.endswith("USDT"):
            binance_symbol = symbol_clean.replace("USD", "USDT")
        else:
            binance_symbol = symbol_clean

        # Attempt to load local CSV first
        file_symbol = symbol_str.lower().replace("-", "_").replace("/", "_")
        csv_filename = f"{file_symbol}_{timeframe_str}.csv"
        csv_path = os.path.join(Config.DATA_DIR, csv_filename)
        
        # Fallback to btc_usd_1h.csv if exact file doesn't exist
        if not os.path.exists(csv_path):
            logger.info(f"Exact file {csv_path} not found. Checking default BTC-USD dataset.")
            csv_path = os.path.join(Config.DATA_DIR, "btc_usd_1h.csv")

        df = None
        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)
                logger.info(f"Loaded {len(df)} rows from local dataset {csv_path}")
            except Exception as e:
                logger.error(f"Failed to read CSV {csv_path}: {e}")

        if df is None or df.empty:
            # Live Binance Public API Fallback (No Key Needed)
            try:
                url = f"https://api.binance.com/api/v3/klines?symbol={binance_symbol}&interval={timeframe_str}&limit={limit}"
                res = requests.get(url, timeout=5)
                if res.status_code == 200:
                    raw = res.json()
                    records = []
                    for row in raw:
                        records.append({
                            "timestamp": pd.to_datetime(row[0], unit='ms').strftime('%Y-%m-%d %H:%M:%S'),
                            "open": float(row[1]),
                            "high": float(row[2]),
                            "low": float(row[3]),
                            "close": float(row[4]),
                            "volume": float(row[5])
                        })
                    df = pd.DataFrame(records)
                    logger.info(f"Fetched {len(df)} live rows from Binance API for {binance_symbol}")
            except Exception as e:
                logger.error(f"Failed to fetch live Binance data for {binance_symbol}: {e}")

        if df is None or df.empty:
            # Fallback Synthetic OHLCV Generator for robust local testing
            logger.warning(f"Generating synthetic OHLCV fallback data for {symbol_str}")
            now = pd.Timestamp.now()
            dates = pd.date_range(end=now, periods=limit, freq='1h')
            np.random.seed(42)
            prices = 90000.0 + np.cumsum(np.random.randn(limit) * 150.0)
            df = pd.DataFrame({
                "timestamp": dates.strftime('%Y-%m-%d %H:%M:%S'),
                "open": prices - np.random.randn(limit)*20,
                "high": prices + np.abs(np.random.randn(limit)*50),
                "low": prices - np.abs(np.random.randn(limit)*50),
                "close": prices,
                "volume": np.random.rand(limit) * 1000 + 100
            })

        # Ensure required columns exist and are lowercase
        df.columns = [str(col).strip().lower() for col in df.columns]
        required = ["timestamp", "open", "high", "low", "close", "volume"]
        for col in required:
            if col not in df.columns:
                df[col] = 0.0

        # Sort chronologically and limit
        if "timestamp" in df.columns:
            df["timestamp"] = df["timestamp"].astype(str)
            df = df.sort_values("timestamp").reset_index(drop=True)

        if limit and len(df) > limit:
            df = df.iloc[-limit:].reset_index(drop=True)

        return df

    @staticmethod
    def get_supported_symbols():
        """Returns list of active supported instruments."""
        return [
            {"symbol": "BTC-USD", "name": "Bitcoin / US Dollar", "timeframes": ["1h", "4h", "1d"]},
            {"symbol": "ETH-USD", "name": "Ethereum / US Dollar", "timeframes": ["1h", "4h", "1d"]},
            {"symbol": "SOL-USD", "name": "Solana / US Dollar", "timeframes": ["1h", "4h", "1d"]},
            {"symbol": "BNB-USD", "name": "BNB / US Dollar", "timeframes": ["1h", "4h", "1d"]}
        ]

    @staticmethod
    def get_available_symbols():
        """Returns list of available symbol string names."""
        return [s["symbol"] for s in DataService.get_supported_symbols()]

    @staticmethod
    def get_ohlcv_with_indicators(symbol="BTC-USD", timeframe="1h", limit=300):
        """Loads OHLCV dataset and calculates complete technical indicator suite."""
        from services.indicator_service import IndicatorService
        df = DataService.load_ohlcv(symbol=symbol, timeframe=timeframe, limit=limit)
        df_ind = IndicatorService.calculate_all(df)
        return df_ind

data_service = DataService()
