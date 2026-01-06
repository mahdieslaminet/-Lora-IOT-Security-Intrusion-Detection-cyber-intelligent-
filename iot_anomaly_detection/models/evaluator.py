"""Evaluation helpers for trained models."""

from __future__ import annotations

from typing import Dict

import numpy as np
from sklearn.metrics import confusion_matrix

from ..utils.metrics import MetricSummary, compute_classification_metrics


def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, object]:
    """Return metrics and confusion matrix for predictions."""
    metrics: MetricSummary = compute_classification_metrics(y_true, y_pred)
    return {
        "metrics": metrics,
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }
