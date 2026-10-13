import os
import sys
import logging
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger("TradeSimX.FeatureSelection")

def select_top_features(X_train, y_train, feature_names, max_features=25, corr_threshold=0.92):
    """
    Selects top non-redundant, high-signal features using correlation analysis and tree-based importances.
    STRICTLY executed ONLY on Training set to prevent data leakage!
    """
    df_feat = pd.DataFrame(X_train, columns=feature_names)

    # 1. Remove highly correlated / redundant features (> 0.92 correlation)
    corr_matrix = df_feat.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    to_drop = [column for column in upper.columns if any(upper[column] > corr_threshold)]

    selected = [f for f in feature_names if f not in to_drop]
    logger.info(f"Feature Selection: Removed {len(to_drop)} redundant features with correlation > {corr_threshold}. Remaining: {len(selected)}")

    # 2. Importance ranking using Random Forest on Training set
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, n_jobs=-1)
    rf.fit(df_feat[selected], y_train)
    importances = rf.feature_importances_

    ranked = sorted(zip(selected, importances), key=lambda x: x[1], reverse=True)
    top_features = [item[0] for item in ranked[:max_features]]

    logger.info(f"Selected Top {len(top_features)} Features based on Tree Importance: {top_features[:8]}...")
    return top_features
