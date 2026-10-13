import os
import sys
import logging
import optuna
import numpy as np
from sklearn.metrics import f1_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb

optuna.logging.set_verbosity(optuna.logging.WARNING)
logger = logging.getLogger("TradeSimX.HyperparameterTuning")

def tune_logistic_regression(X_tr, y_tr, X_v, y_v, n_trials=15):
    """Optuna hyperparameter tuning for Logistic Regression."""
    def objective(trial):
        params = {
            "C": trial.suggest_float("C", 1e-3, 10.0, log=True),
            "class_weight": trial.suggest_categorical("class_weight", ["balanced", None]),
            "solver": trial.suggest_categorical("solver", ["lbfgs", "saga"]),
            "max_iter": 1000,
            "random_state": 42
        }
        clf = LogisticRegression(**params)
        clf.fit(X_tr, y_tr)
        preds = clf.predict(X_v)
        return f1_score(y_v, preds, average="weighted")

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials)
    logger.info(f"LogisticRegression Optuna Best Val F1: {study.best_value:.4f} | Best Params: {study.best_params}")
    return study.best_params, study.best_value

def tune_xgboost(X_tr, y_tr, X_v, y_v, n_trials=15):
    """Optuna hyperparameter tuning for XGBoost on Train/Val split only."""
    def objective(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 80, 200),
            "max_depth": trial.suggest_int("max_depth", 3, 7),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.1, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 0.95),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 0.95),
            "reg_alpha": trial.suggest_float("reg_alpha", 1e-3, 10.0, log=True),
            "reg_lambda": trial.suggest_float("reg_lambda", 1e-3, 10.0, log=True),
            "random_state": 42
        }
        clf = xgb.XGBClassifier(**params)
        clf.fit(X_tr, y_tr)
        preds = clf.predict(X_v)
        return f1_score(y_v, preds, average="weighted")

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials)
    logger.info(f"XGBoost Optuna Best Val F1: {study.best_value:.4f} | Best Params: {study.best_params}")
    return study.best_params, study.best_value

def tune_random_forest(X_tr, y_tr, X_v, y_v, n_trials=15):
    """Optuna hyperparameter tuning for Random Forest on Train/Val split only."""
    def objective(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 80, 200),
            "max_depth": trial.suggest_int("max_depth", 4, 10),
            "min_samples_split": trial.suggest_int("min_samples_split", 2, 10),
            "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 5),
            "class_weight": trial.suggest_categorical("class_weight", ["balanced", "balanced_subsample", None]),
            "random_state": 42
        }
        clf = RandomForestClassifier(**params)
        clf.fit(X_tr, y_tr)
        preds = clf.predict(X_v)
        return f1_score(y_v, preds, average="weighted")

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials)
    logger.info(f"RandomForest Optuna Best Val F1: {study.best_value:.4f} | Best Params: {study.best_params}")
    return study.best_params, study.best_value
