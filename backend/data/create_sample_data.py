import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_crypto_ohlcv(symbol="BTC-USD", start_price=64000.0, num_hours=1200, volatility=0.012, trend=0.00015):
    """
    Generates a realistic historical OHLCV dataset with trend regimes, mean reversion, 
    volatility clustering, and true OHLC invariants.
    """
    np.random.seed(42 if symbol == "BTC-USD" else 101)
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=num_hours)
    
    timestamps = [start_time + timedelta(hours=i) for i in range(num_hours)]
    
    prices = [start_price]
    # Generate log returns with volatility regimes
    current_vol = volatility
    for i in range(1, num_hours):
        # Regime shift every ~100 hours
        if i % 120 == 0:
            current_vol = volatility * np.random.uniform(0.6, 1.8)
        
        # Add micro-trend cycle
        cycle = np.sin(i / 30.0) * 0.002
        ret = np.random.normal(trend + cycle, current_vol)
        next_price = prices[-1] * np.exp(ret)
        prices.append(next_price)
    
    prices = np.array(prices)
    
    # Generate OHLC from prices
    opens = prices
    # Next period open roughly close of current
    closes = np.roll(prices, -1)
    closes[-1] = prices[-1] * 1.001
    
    high_mult = 1.0 + np.abs(np.random.normal(0.003, 0.004, size=num_hours))
    low_mult = 1.0 - np.abs(np.random.normal(0.003, 0.004, size=num_hours))
    
    highs = np.maximum(opens, closes) * high_mult
    lows = np.minimum(opens, closes) * low_mult
    
    # Volume with spikes on large returns
    price_diffs = np.abs(closes - opens) / opens
    base_volume = 1500.0 if symbol == "BTC-USD" else 8000.0
    volumes = base_volume * (1.0 + price_diffs * 80.0) * np.random.uniform(0.7, 1.5, size=num_hours)
    
    df = pd.DataFrame({
        "timestamp": [ts.strftime("%Y-%m-%d %H:%M:%S") for ts in timestamps],
        "open": np.round(opens, 2),
        "high": np.round(highs, 2),
        "low": np.round(lows, 2),
        "close": np.round(closes, 2),
        "volume": np.round(volumes, 4)
    })
    
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    
    btc_df = generate_crypto_ohlcv("BTC-USD", start_price=64200.0, num_hours=1200, volatility=0.01, trend=0.0001)
    btc_file = os.path.join(out_dir, "btc_usd_1h.csv")
    btc_df.to_csv(btc_file, index=False)
    print(f"Generated BTC dataset: {len(btc_df)} rows -> {btc_file}")

    eth_df = generate_crypto_ohlcv("ETH-USD", start_price=3450.0, num_hours=1200, volatility=0.014, trend=0.00012)
    eth_file = os.path.join(out_dir, "eth_usd_1h.csv")
    eth_df.to_csv(eth_file, index=False)
    print(f"Generated ETH dataset: {len(eth_df)} rows -> {eth_file}")
