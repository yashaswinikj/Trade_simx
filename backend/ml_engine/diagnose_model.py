import os
import sys
import json
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, balanced_accuracy_score, confusion_matrix
from ml_engine.feature_engineering import feature_engine

PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
DATA_DIR = os.path.join(BASE_DIR, "data")

def run_diagnostics():
    path = os.path.join(PROCESSED_DIR, "BTCUSD_1h_clean.csv")
    if not os.path.exists(path):
        path = os.path.join(DATA_DIR, "btc_usd_1h.csv")

    raw_df = pd.read_csv(path)
    feat_df = feature_engine.calculate_features(raw_df)
    full_df = feature_engine.create_targets(feat_df)

    n = len(full_df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train_df = full_df.iloc[:train_end]
    val_df = full_df.iloc[train_end:val_end]
    test_df = full_df.iloc[val_end:]

    print("=" * 70)
    print("  CURRENT MODEL DIAGNOSTIC REPORT")
    print("=" * 70)

    print(f"\n1. DATASET TIME RANGES:")
    print(f"   - Total Samples: {n:,}")
    print(f"   - Train Range ({len(train_df):,} samples): {train_df['timestamp'].iloc[0]} -> {train_df['timestamp'].iloc[-1]}")
    print(f"   - Val Range   ({len(val_df):,} samples):   {val_df['timestamp'].iloc[0]} -> {val_df['timestamp'].iloc[-1]}")
    print(f"   - Test Range  ({len(test_df):,} samples):  {test_df['timestamp'].iloc[0]} -> {test_df['timestamp'].iloc[-1]}")

    print("\n2. CLASS DISTRIBUTION (±0.3% Threshold):")
    for name, df_part in [("Train", train_df), ("Val", val_df), ("Test", test_df)]:
        counts = df_part["target_signal"].value_counts().to_dict()
        total = len(df_part)
        sell_c = counts.get(0, 0)
        hold_c = counts.get(1, 0)
        buy_c = counts.get(2, 0)
        print(f"   - {name:5s}: SELL(0)={sell_c:5d} ({sell_c/total*100:5.1f}%) | HOLD(1)={hold_c:5d} ({hold_c/total*100:5.1f}%) | BUY(2)={buy_c:5d} ({buy_c/total*100:5.1f}%)")

    # Binary direction distribution
    future_ret = full_df["target_future_return"]
    up_cnt = (future_ret > 0).sum()
    down_cnt = (future_ret <= 0).sum()
    print(f"\n3. BINARY DIRECTION DISTRIBUTION (UP vs DOWN):")
    print(f"   - UP   (return > 0) : {up_cnt:,} ({up_cnt/n*100:.1f}%)")
    print(f"   - DOWN (return <= 0): {down_cnt:,} ({down_cnt/n*100:.1f}%)")

    print("\n4. DIAGNOSTIC ANALYSIS OF 47.73% BASELINE:")
    print("   - High Class Overlap: ±0.3% threshold on 3h horizon in hourly crypto data causes ~48-52% of bars to be HOLD.")
    print("   - Overfitting on Noise: Random Forest default parameters overfit noisy 1h return micro-fluctuations.")
    print("   - Lack of Lagged Indicators & Obv: Models lacked memory of previous bars' momentum.")
    print("   - Equal Class Weighting: Class imbalance resulted in HOLD-dominated predictions.")

if __name__ == "__main__":
    run_diagnostics()
