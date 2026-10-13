import os
import sys
import json
import logging
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, balanced_accuracy_score, confusion_matrix
import xgboost as xgb

from ml_engine.feature_engineering import FeatureEngine
from ml_engine.feature_selection import select_top_features

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TradeSimX.MLAudit")

DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
MODEL_DIR = os.path.join(BASE_DIR, "models")

def run_audit(symbol="BTC-USD"):
    print("=" * 80)
    print("  TRADESIMX — RIGOROUS CONSISTENCY & LEAKAGE AUDIT")
    print("=" * 80)

    # 1. Load Multi-Year Market Data
    clean_filename = f"{symbol.replace('-', '').replace('/', '')}_1h_clean.csv"
    path = os.path.join(PROCESSED_DIR, clean_filename)
    if not os.path.exists(path):
        path = os.path.join(DATA_DIR, "btc_usd_1h.csv")

    raw_df = pd.read_csv(path)

    # 2. Consistent Feature Engineering & Target Creation
    feature_engine = FeatureEngine(prediction_horizon=3, use_volatility_adjusted_target=True)
    feat_df = feature_engine.calculate_features(raw_df)
    full_df = feature_engine.create_targets(feat_df)

    n = len(full_df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train_df = full_df.iloc[:train_end].copy()
    val_df = full_df.iloc[train_end:val_end].copy()
    test_df = full_df.iloc[val_end:].copy()

    exclude_cols = ["timestamp", "open", "high", "low", "close", "volume", "target_signal", "target_direction", "target_future_return", "target_opportunity"]
    all_feature_cols = [c for c in full_df.columns if c not in exclude_cols]

    # Feature Selection strictly on Training set
    X_tr_raw = train_df[all_feature_cols].values
    y_tr_signal = train_df["target_signal"].values
    top_feature_names = select_top_features(X_tr_raw, y_tr_signal, all_feature_cols, max_features=25, corr_threshold=0.90)

    X_train_unscaled = train_df[top_feature_names].values
    X_val_unscaled = val_df[top_feature_names].values
    X_test_unscaled = test_df[top_feature_names].values

    # Fit Scaler ONLY on Training Set
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_unscaled)
    X_val = scaler.transform(X_val_unscaled)
    X_test = scaler.transform(X_test_unscaled)

    y_val_signal = val_df["target_signal"].values
    y_te_signal = test_df["target_signal"].values

    # Helper function to instantiate the exact Calibrated Ensemble Model
    def make_calibrated_ensemble(X_t, y_t, X_v, y_v):
        lr = LogisticRegression(C=0.01, class_weight="balanced", max_iter=1000, random_state=42)
        rf = RandomForestClassifier(n_estimators=150, max_depth=6, class_weight="balanced", random_state=42, n_jobs=-1)
        xgb_model = xgb.XGBClassifier(n_estimators=120, max_depth=4, learning_rate=0.03, random_state=42)

        lr.fit(X_t, y_t)
        rf.fit(X_t, y_t)
        xgb_model.fit(X_t, y_t)

        ens = VotingClassifier(estimators=[("lr", lr), ("rf", rf), ("xgb", xgb_model)], voting="soft")
        ens.fit(X_t, y_t)

        cal = CalibratedClassifierCV(estimator=ens, method="sigmoid", cv="prefit")
        cal.fit(X_v, y_v)
        return cal

    # -----------------------------------------------------------------
    # AUDIT SECTION 3: WALK-FORWARD VALIDATION VERIFICATION
    # -----------------------------------------------------------------
    print("\n--- AUDIT SECTION 3: 5-FOLD WALK-FORWARD CROSS VALIDATION ---")
    wf_results = []
    X_tr_val = np.vstack([X_train, X_val])
    y_tr_val = np.concatenate([y_tr_signal, y_val_signal])
    df_tr_val = pd.concat([train_df, val_df], ignore_index=True)

    block_size = len(X_tr_val) // 6
    for fold in range(1, 6):
        tr_end_idx = fold * block_size
        v_end_idx = (fold + 1) * block_size
        
        sub_tr_end = int(tr_end_idx * 0.8)
        X_f_tr = X_tr_val[:sub_tr_end]
        y_f_tr = y_tr_val[:sub_tr_end]
        
        X_f_cal = X_tr_val[sub_tr_end:tr_end_idx]
        y_f_cal = y_tr_val[sub_tr_end:tr_end_idx]

        X_f_v = X_tr_val[tr_end_idx:v_end_idx]
        y_f_v = y_tr_val[tr_end_idx:v_end_idx]

        tr_start_date = str(df_tr_val["timestamp"].iloc[0]).split(" ")[0]
        tr_end_date = str(df_tr_val["timestamp"].iloc[tr_end_idx - 1]).split(" ")[0]
        v_start_date = str(df_tr_val["timestamp"].iloc[tr_end_idx]).split(" ")[0]
        v_end_date = str(df_tr_val["timestamp"].iloc[v_end_idx - 1]).split(" ")[0]

        fold_model = make_calibrated_ensemble(X_f_tr, y_f_tr, X_f_cal, y_f_cal)
        f_preds = fold_model.predict(X_f_v)

        f_acc = accuracy_score(y_f_v, f_preds)
        f_f1 = f1_score(y_f_v, f_preds, average="weighted")
        f_bal = balanced_accuracy_score(y_f_v, f_preds)

        fold_info = {
            "fold": fold,
            "train_dates": f"{tr_start_date} -> {tr_end_date}",
            "val_dates": f"{v_start_date} -> {v_end_date}",
            "train_samples": tr_end_idx,
            "val_samples": len(y_f_v),
            "accuracy": round(f_acc * 100, 2),
            "f1": round(f_f1 * 100, 2),
            "balanced_accuracy": round(f_bal * 100, 2)
        }
        wf_results.append(fold_info)
        print(f"  Fold {fold}: Train ({fold_info['train_samples']} samples) [{fold_info['train_dates']}] -> Val ({fold_info['val_samples']} samples) [{fold_info['val_dates']}] | Acc: {fold_info['accuracy']}% | F1: {fold_info['f1']}% | Bal: {fold_info['balanced_accuracy']}%")

    wf_accs = [f["accuracy"] for f in wf_results]
    wf_mean_acc = np.mean(wf_accs)
    wf_std_acc = np.std(wf_accs)

    # -----------------------------------------------------------------
    # AUDIT SECTION 4: UNSEEN FINAL TEST EVALUATION
    # -----------------------------------------------------------------
    print("\n--- AUDIT SECTION 4: UNSEEN FINAL TEST VERIFICATION ---")
    final_model = make_calibrated_ensemble(X_train, y_tr_signal, X_val, y_val_signal)
    test_preds = final_model.predict(X_test)
    test_probs = final_model.predict_proba(X_test)

    test_acc = accuracy_score(y_te_signal, test_preds)
    test_f1 = f1_score(y_te_signal, test_preds, average="weighted")
    test_bal = balanced_accuracy_score(y_te_signal, test_preds)
    test_cm = confusion_matrix(y_te_signal, test_preds).tolist()

    class_counts = pd.Series(y_te_signal).value_counts().to_dict()
    print(f"  Final Test Period : {test_df['timestamp'].iloc[0]} -> {test_df['timestamp'].iloc[-1]}")
    print(f"  Test Samples      : {len(test_df):,}")
    print(f"  Class Distribution: SELL(0)={class_counts.get(0,0)}, HOLD(1)={class_counts.get(1,0)}, BUY(2)={class_counts.get(2,0)}")
    print(f"  Final Test Acc    : {test_acc*100:.2f}%")
    print(f"  Final Test F1     : {test_f1*100:.2f}%")
    print(f"  Final Test Bal Acc: {test_bal*100:.2f}%")

    # -----------------------------------------------------------------
    # AUDIT SECTION 6: INDEPENDENT HIGH-CONFIDENCE SWEEP
    # -----------------------------------------------------------------
    print("\n--- AUDIT SECTION 6: HIGH-CONFIDENCE SWEEP VERIFICATION ---")
    max_probs = np.max(test_probs, axis=1)

    conf_details = {}
    for thresh in [0.60, 0.65]:
        mask = max_probs >= thresh
        signals_cnt = int(np.sum(mask))
        if signals_cnt > 0:
            sub_y = y_te_signal[mask]
            sub_pred = test_preds[mask]

            correct_cnt = int(np.sum(sub_y == sub_pred))
            incorrect_cnt = signals_cnt - correct_cnt
            cov_pct = round((signals_cnt / len(test_df)) * 100.0, 2)
            prec_pct = round(precision_score(sub_y, sub_pred, average="weighted", zero_division=0) * 100.0, 2)
            rec_pct = round(recall_score(sub_y, sub_pred, average="weighted", zero_division=0) * 100.0, 2)
            f1_pct = round(f1_score(sub_y, sub_pred, average="weighted") * 100.0, 2)
            acc_pct = round(accuracy_score(sub_y, sub_pred) * 100.0, 2)

            conf_details[f">={int(thresh*100)}%"] = {
                "threshold_pct": int(thresh * 100),
                "signals_count": signals_cnt,
                "coverage_pct": cov_pct,
                "correct_predictions": correct_cnt,
                "incorrect_predictions": incorrect_cnt,
                "accuracy_pct": acc_pct,
                "precision_pct": prec_pct,
                "recall_pct": rec_pct,
                "f1_score_pct": f1_pct
            }
            print(f"  Threshold >= {int(thresh*100)}%: {signals_cnt} signals ({cov_pct}% coverage) | Correct: {correct_cnt} | Incorrect: {incorrect_cnt} | Precision: {prec_pct}% | Acc: {acc_pct}%")

    # Save complete audit report JSON
    audit_report = {
        "symbol": symbol,
        "total_candles": len(full_df),
        "walk_forward_folds": wf_results,
        "walk_forward_summary": {
            "mean_accuracy": round(wf_mean_acc, 2),
            "std_accuracy": round(wf_std_acc, 2)
        },
        "final_test_summary": {
            "start_date": str(test_df['timestamp'].iloc[0]),
            "end_date": str(test_df['timestamp'].iloc[-1]),
            "test_samples": len(test_df),
            "class_distribution": class_counts,
            "accuracy_pct": round(test_acc * 100, 2),
            "f1_pct": round(test_f1 * 100, 2),
            "balanced_accuracy_pct": round(test_bal * 100, 2),
            "confusion_matrix": test_cm
        },
        "high_confidence_audit": conf_details
    }

    with open(os.path.join(MODEL_DIR, "audit_report.json"), "w") as f:
        json.dump(audit_report, f, indent=2)

    print("\n" + "=" * 80)
    print("  TRADESIMX — AUDIT COMPLETED AND SAVED TO audit_report.json")
    print("=" * 80)

if __name__ == "__main__":
    run_audit("BTC-USD")
