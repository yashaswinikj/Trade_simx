import os
import sys
import logging
import numpy as np
from sklearn.calibration import CalibratedClassifierCV

logger = logging.getLogger("TradeSimX.ProbabilityCalibration")

class ModelCalibrator:
    def __init__(self, method="sigmoid"):
        self.method = method # "sigmoid" (Platt scaling) or "isotonic"

    def calibrate(self, base_model, X_val, y_val):
        """
        Calibrates model output probabilities strictly using the Validation set.
        Prevents raw classifier overconfidence and aligns probabilities with empirical accuracy.
        """
        calibrated_model = CalibratedClassifierCV(estimator=base_model, method=self.method, cv="prefit")
        calibrated_model.fit(X_val, y_val)
        logger.info(f"Successfully calibrated model probabilities using Platt Scaling ('{self.method}').")
        return calibrated_model

calibrator = ModelCalibrator(method="sigmoid")
