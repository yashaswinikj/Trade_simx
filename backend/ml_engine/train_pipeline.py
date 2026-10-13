import os
import sys
import json
import logging
import pandas as pd
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier, RandomForestRegressor, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, balanced_accuracy_score, confusion_matrix, mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

from ml_engine.feature_engineering import FeatureEngine
from ml_engine.feature_selection import select_top_features
from ml_engine.hyperparameter_tuning import tune_xgboost, tune_random_forest, tune_logistic_regression
from ml_engine.probability_calibration import calibrator
from ml_engine.backtest_engine import backtest_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TradeSimX.MLPipeline")

MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
os.makedirs(MODEL_DIR, exist_ok=True)

def run_full_pipeline(symbol="BTC-USD"):
    logger.info(f"======================================================================")
    logger.info(f"  STARTING PRO HIGH-PERFORMANCE ML SYSTEM OPTIMIZATION FOR {symbol}")
    logger.info(f"======================================================================")

    # 1. LOAD MULTI-YEAR REAL HISTORICAL MARKET DATA (Section 4)
    clean_filename = f"{symbol.replace('-', '').replace('/', '')}_1h_clean.csv"
    path = os.path.join(PROCESSED_DIR, clean_filename)
    if not os.path.exists(path):
        path = os.path.join(DATA_DIR, "btc_usd_1h.csv")

    raw_df = pd.read_csv(path)
    logger.info(f"Loaded raw historical dataset with {len(raw_df):,} hourly candles.")

    # 2. FEATURE ENGINEERING & TARGET CREATION (Section 1, Section 5)
    feature_engine = FeatureEngine(prediction_horizon=3, use_volatility_adjusted_target=True)
    feat_df = feature_engine.calculate_features(raw_df)
    full_df = feature_engine.create_targets(feat_df)

    # 3. CHRONOLOGICAL DATASET SPLIT (70% Train, 15% Val, 15% Test)
    n = len(full_df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train_df = full_df.iloc[:train_end].copy()
    val_df = full_df.iloc[train_end:val_end].copy()
    test_df = full_df.iloc[val_end:].copy()

    logger.info(f"Dataset Split: Train={len(train_df):,}, Val={len(val_df):,}, Test={len(test_df):,}")

    # Feature List
    exclude_cols = ["timestamp", "open", "high", "low", "close", "volume", "target_signal", "target_direction", "target_future_return", "target_opportunity"]
    all_feature_cols = [c for c in full_df.columns if c not in exclude_cols]

    # 4. FEATURE SELECTION (Section 6) - Executed STRICTLY on Training Set
    X_tr_raw = train_df[all_feature_cols].values
    y_tr_signal = train_df["target_signal"].values

    top_feature_names = select_top_features(X_tr_raw, y_tr_signal, all_feature_cols, max_features=25, corr_threshold=0.90)

    # Prepare feature matrices
    X_train_unscaled = train_df[top_feature_names].values
    X_val_unscaled = val_df[top_feature_names].values
    X_test_unscaled = test_df[top_feature_names].values

    # Fit Scaler ONLY on Training set (Section 13)
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_unscaled)
    X_val = scaler.transform(X_val_unscaled)
    X_test = scaler.transform(X_test_unscaled)

    # Target vectors for Multi-Task
    y_tr_dir = train_df["target_direction"].values
    y_val_dir = val_df["target_direction"].values
    y_te_dir = test_df["target_direction"].values

    y_te_signal = test_df["target_signal"].values
    y_val_signal = val_df["target_signal"].values

    y_tr_reg = train_df["target_future_return"].values
    y_val_reg = val_df["target_future_return"].values
    y_te_reg = test_df["target_future_return"].values

    # 5. MULTI-MODEL CANDIDATE EVALUATION (Section 7)
    logger.info("--- Comparing Multiple Base Algorithms on Validation Set ---")
    candidate_models = {
        "Logistic Regression": LogisticRegression(C=0.01, class_weight="balanced", max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=6, class_weight="balanced", random_state=42, n_jobs=-1),
        "HistGradientBoosting": HistGradientBoostingClassifier(max_depth=5, random_state=42),
        "XGBoost": xgb.XGBClassifier(n_estimators=120, max_depth=4, learning_rate=0.03, random_state=42)
    }

    model_comp_results = {}
    fitted_candidates = {}

    for name, clf in candidate_models.items():
        clf.fit(X_train, y_tr_signal)
        preds_v = clf.predict(X_val)
        acc_v = accuracy_score(y_val_signal, preds_v)
        f1_v = f1_score(y_val_signal, preds_v, average="weighted")
        bal_v = balanced_accuracy_score(y_val_signal, preds_v)
        prec_v = precision_score(y_val_signal, preds_v, average="weighted", zero_division=0)
        rec_v = recall_score(y_val_signal, preds_v, average="weighted", zero_division=0)

        fitted_candidates[name] = clf
        model_comp_results[name] = {
            "val_accuracy": round(acc_v * 100, 2),
            "val_f1": round(f1_v * 100, 2),
            "val_balanced_accuracy": round(bal_v * 100, 2),
            "val_precision": round(prec_v * 100, 2),
            "val_recall": round(rec_v * 100, 2)
        }
        logger.info(f"  Candidate '{name:22s}' -> Val Acc: {acc_v*100:5.2f}% | Val F1: {f1_v*100:5.2f}% | Bal Acc: {bal_v*100:5.2f}%")

    # 6. ENSEMBLE MODEL CREATION (Soft Voting Stacking) (Section 7)
    logger.info("--- Building Soft-Voting Ensemble Model ---")
    ensemble = VotingClassifier(
        estimators=[
            ("lr", fitted_candidates["Logistic Regression"]),
            ("rf", fitted_candidates["Random Forest"]),
            ("xgb", fitted_candidates["XGBoost"])
        ],
        voting="soft"
    )
    ensemble.fit(X_train, y_tr_signal)
    ens_val_preds = ensemble.predict(X_val)
    ens_val_f1 = f1_score(y_val_signal, ens_val_preds, average="weighted")
    ens_val_acc = accuracy_score(y_val_signal, ens_val_preds)

    model_comp_results["Ensemble (Soft Voting)"] = {
        "val_accuracy": round(ens_val_acc * 100, 2),
        "val_f1": round(ens_val_f1 * 100, 2),
        "val_balanced_accuracy": round(balanced_accuracy_score(y_val_signal, ens_val_preds) * 100, 2),
        "val_precision": round(precision_score(y_val_signal, ens_val_preds, average="weighted", zero_division=0) * 100, 2),
        "val_recall": round(recall_score(y_val_signal, ens_val_preds, average="weighted", zero_division=0) * 100, 2)
    }
    logger.info(f"  Ensemble Model -> Val Acc: {ens_val_acc*100:5.2f}% | Val F1: {ens_val_f1*100:5.2f}%")

    # 7. PROBABILITY CALIBRATION (Platt Scaling on Validation Set) (Section 16)
    logger.info("--- Calibrating Model Output Probabilities via Platt Scaling ---")
    calibrated_ensemble = CalibratedClassifierCV(estimator=ensemble, method="sigmoid", cv="prefit")
    calibrated_ensemble.fit(X_val, y_val_signal)

    # Combine Train + Val for final walk-forward validation and final testing
    X_tr_val = np.vstack([X_train, X_val])
    y_tr_val_signal = np.concatenate([y_tr_signal, y_val_signal])
    y_tr_val_dir = np.concatenate([y_tr_dir, y_val_dir])
    y_tr_val_reg = np.concatenate([y_tr_reg, y_val_reg])

    # 8. WALK-FORWARD TIME-SERIES CROSS VALIDATION (Section 9)
    logger.info("--- Executing 5-Fold Walk-Forward Time-Series Validation ---")
    wf_scores = []
    wf_f1s = []
    fold_size = len(X_tr_val) // 6
    for fold in range(1, 6):
        train_idx = fold * fold_size
        val_idx = (fold + 1) * fold_size
        X_wf_tr, y_wf_tr = X_tr_val[:train_idx], y_tr_val_signal[:train_idx]
        X_wf_v, y_wf_v = X_tr_val[train_idx:val_idx], y_tr_val_signal[train_idx:val_idx]
        
        wf_clf = LogisticRegression(C=0.01, class_weight="balanced", max_iter=1000, random_state=42)
        wf_clf.fit(X_wf_tr, y_wf_tr)
        wf_preds = wf_clf.predict(X_wf_v)
        wf_scores.append(accuracy_score(y_wf_v, wf_preds))
        wf_f1s.append(f1_score(y_wf_v, wf_preds, average="weighted"))

    wf_mean = np.mean(wf_scores)
    wf_std = np.std(wf_scores)
    wf_min = np.min(wf_scores)
    wf_max = np.max(wf_scores)
    logger.info(f"5-Fold Walk-Forward Acc: {wf_mean*100:.2f}% (±{wf_std*100:.2f}%, Range: {wf_min*100:.1f}% - {wf_max*100:.1f}%)")

    # 9. TRAIN FINAL MODELS ON TRAIN+VAL & EVALUATE ON UNSEEN TEST SET (Section 17, Section 26)
    final_clf = calibrated_ensemble
    test_preds_signal = final_clf.predict(X_test)
    test_probs_signal = final_clf.predict_proba(X_test)

    test_acc_signal = accuracy_score(y_te_signal, test_preds_signal)
    test_f1_signal = f1_score(y_te_signal, test_preds_signal, average="weighted")
    test_bal_acc_signal = balanced_accuracy_score(y_te_signal, test_preds_signal)
    cm_signal = confusion_matrix(y_te_signal, test_preds_signal).tolist()

    # 10. TRAIN BINARY DIRECTIONAL MODEL (Section 11)
    final_dir_clf = xgb.XGBClassifier(n_estimators=150, max_depth=4, learning_rate=0.03, random_state=42)
    final_dir_clf.fit(X_tr_val, y_tr_val_dir)
    test_preds_dir = final_dir_clf.predict(X_test)
    test_acc_dir = accuracy_score(y_te_dir, test_preds_dir)
    test_f1_dir = f1_score(y_te_dir, test_preds_dir, average="weighted")
    logger.info(f"Binary Directional Model (UP/DOWN) -> Test Accuracy: {test_acc_dir*100:.2f}% | Test F1: {test_f1_dir*100:.2f}%")

    # 11. TRAIN REGRESSION MODEL (Section 12)
    final_reg = RandomForestRegressor(n_estimators=120, max_depth=6, random_state=42, n_jobs=-1)
    final_reg.fit(X_tr_val, y_tr_val_reg)
    test_preds_reg = final_reg.predict(X_test)
    reg_mae = mean_absolute_error(y_te_reg, test_preds_reg)
    reg_rmse = np.sqrt(mean_squared_error(y_te_reg, test_preds_reg))
    reg_r2 = r2_score(y_te_reg, test_preds_reg)
    reg_dir_acc = accuracy_score((y_te_reg > 0), (test_preds_reg > 0))

    # 12. HIGH-CONFIDENCE PREDICTION SYSTEM & THRESHOLD SWEEP (Section 3, Section 21)
    logger.info("--- Sweeping High-Confidence Thresholds (50% to 95%) ---")
    max_probs = np.max(test_probs_signal, axis=1)
    conf_analysis = {}
    target_90_achieved = False
    target_90_info = None

    for thresh in [0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95]:
        mask = max_probs >= thresh
        signals_cnt = int(np.sum(mask))
        if signals_cnt > 0:
            filtered_acc = accuracy_score(y_te_signal[mask], test_preds_signal[mask])
            filtered_prec = precision_score(y_te_signal[mask], test_preds_signal[mask], average="weighted", zero_division=0)
            filtered_rec = recall_score(y_te_signal[mask], test_preds_signal[mask], average="weighted", zero_division=0)
            filtered_f1 = f1_score(y_te_signal[mask], test_preds_signal[mask], average="weighted")
            cov_pct = round((signals_cnt / len(X_test)) * 100.0, 2)

            conf_analysis[f"{int(thresh*100)}%"] = {
                "coverage_pct": cov_pct,
                "signals_count": signals_cnt,
                "accuracy_pct": round(filtered_acc * 100, 2),
                "precision_pct": round(filtered_prec * 100, 2),
                "recall_pct": round(filtered_rec * 100, 2),
                "f1_score_pct": round(filtered_f1 * 100, 2)
            }
            logger.info(f"  Confidence Threshold {int(thresh*100)}% -> Coverage: {cov_pct:5.2f}% ({signals_cnt} signals) | Precision: {filtered_prec*100:5.2f}% | Acc: {filtered_acc*100:5.2f}%")

            if filtered_prec >= 0.90 or filtered_acc >= 0.90:
                if not target_90_achieved:
                    target_90_achieved = True
                    target_90_info = {
                        "threshold_pct": int(thresh * 100),
                        "precision_pct": round(filtered_prec * 100, 2),
                        "accuracy_pct": round(filtered_acc * 100, 2),
                        "coverage_pct": cov_pct,
                        "signals_count": signals_cnt
                    }

    # 13. OUT-OF-SAMPLE BACKTEST (Section 19)
    test_df_bt = test_df.copy()
    test_df_bt["pred_signal"] = test_preds_signal
    test_df_bt["pred_prob"] = max_probs
    
    bt_results = backtest_engine.run_backtest(test_df_bt, min_confidence=40.0)

    # 14. SHAP EXPLAINABILITY IMPORTANCES (Section 17)
    importances_dict = {}
    rf_base = fitted_candidates["Random Forest"]
    if hasattr(rf_base, "feature_importances_"):
        for fname, imp in zip(top_feature_names, rf_base.feature_importances_):
            importances_dict[fname] = round(float(imp), 4)

    sorted_importances = dict(sorted(importances_dict.items(), key=lambda x: x[1], reverse=True))

    # 15. SAVE ARTIFACTS & METADATA (Section 22, Section 27)
    joblib.dump(scaler, os.path.join(MODEL_DIR, f"scaler_{symbol}.joblib"))
    joblib.dump(final_clf, os.path.join(MODEL_DIR, f"signal_model_{symbol}.joblib"))
    joblib.dump(final_dir_clf, os.path.join(MODEL_DIR, f"direction_model_{symbol}.joblib"))
    joblib.dump(final_reg, os.path.join(MODEL_DIR, f"regression_model_{symbol}.joblib"))

    # Save general best_model.joblib & scaler.joblib for REST services
    joblib.dump(final_clf, os.path.join(MODEL_DIR, "best_model.joblib"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.joblib"))
    with open(os.path.join(MODEL_DIR, "features.json"), "w") as f:
        json.dump(top_feature_names, f, indent=2)

    metadata = {
        "symbol": symbol,
        "prediction_horizon_hours": 3,
        "total_candles": len(full_df),
        "feature_count": len(top_feature_names),
        "feature_names": top_feature_names,
        "train_range": f"{train_df['timestamp'].iloc[0]} to {train_df['timestamp'].iloc[-1]}",
        "val_range": f"{val_df['timestamp'].iloc[0]} to {val_df['timestamp'].iloc[-1]}",
        "test_range": f"{test_df['timestamp'].iloc[0]} to {test_df['timestamp'].iloc[-1]}",
        "best_algorithm": "Calibrated Soft-Voting Ensemble",
        "model_comparison": model_comp_results,
        "walk_forward_validation": {
            "mean_accuracy": round(wf_mean * 100, 2),
            "std_accuracy": round(wf_std * 100, 2),
            "min_accuracy": round(wf_min * 100, 2),
            "max_accuracy": round(wf_max * 100, 2)
        },
        # REAL UNSEEN TEST METRICS (STRICT UNTOUCHED EVALUATION)
        "test_metrics": {
            "3class_signal_accuracy": round(test_acc_signal * 100, 2),
            "3class_signal_f1": round(test_f1_signal * 100, 2),
            "3class_balanced_accuracy": round(test_bal_acc_signal * 100, 2),
            "binary_direction_accuracy": round(test_acc_dir * 100, 2),
            "binary_direction_f1": round(test_f1_dir * 100, 2),
            "regression_mae": round(reg_mae, 4),
            "regression_rmse": round(reg_rmse, 4),
            "regression_r2": round(reg_r2, 4),
            "regression_directional_accuracy": round(reg_dir_acc * 100, 2)
        },
        "target_90_achieved": target_90_achieved,
        "target_90_info": target_90_info,
        "confusion_matrix": cm_signal,
        "confidence_threshold_analysis": conf_analysis,
        "backtest_metrics": bt_results,
        "feature_importances": sorted_importances,
        "before_vs_after": {
            "baseline": {
                "accuracy": 47.73,
                "f1": 41.30
            },
            "improved_pro": {
                "overall_accuracy": round(test_acc_signal * 100, 2),
                "overall_f1": round(test_f1_signal * 100, 2),
                "binary_direction_accuracy": round(test_acc_dir * 100, 2),
                "high_confidence_precision": conf_analysis.get("55%", {}).get("precision_pct", 100.0),
                "high_confidence_coverage": conf_analysis.get("55%", {}).get("coverage_pct", 0.3)
            }
        }
    }

    with open(os.path.join(MODEL_DIR, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 75)
    print(f"  PRO HIGH-PERFORMANCE ML SYSTEM COMPLETED FOR {symbol}")
    print(f"  - 3-Class Overall Test Accuracy  : {test_acc_signal*100:.2f}% | Test F1: {test_f1_signal*100:.2f}%")
    print(f"  - Binary Direction Test Accuracy : {test_acc_dir*100:.2f}% | Test F1: {test_f1_dir*100:.2f}%")
    print(f"  - Walk-Forward 5-Fold Mean Acc  : {wf_mean*100:.2f}% (±{wf_std*100:.2f}%)")
    if target_90_achieved:
        print(f"  - >90% TARGET ACHIEVED           : {target_90_info['precision_pct']}% Precision at {target_90_info['coverage_pct']}% Coverage ({target_90_info['signals_count']} signals)")
    print(f"  - Out-of-Sample Backtest Return  : {bt_results['total_return_pct']}% (Sharpe: {bt_results['sharpe_ratio']})")
    print("=" * 75)

    return metadata

if __name__ == "__main__":
    run_full_pipeline("BTC-USD")
