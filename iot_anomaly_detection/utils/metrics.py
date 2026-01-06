"""Evaluation metric utilities."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


@dataclass
class MetricSummary:
    accuracy: float
    precision: float
    recall: float
    f1: float


def compute_classification_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> MetricSummary:
    """Compute classification metrics for binary labels."""
    return MetricSummary(
        accuracy=accuracy_score(y_true, y_pred),
        precision=precision_score(y_true, y_pred, zero_division=0),
        recall=recall_score(y_true, y_pred, zero_division=0),
        f1=f1_score(y_true, y_pred, zero_division=0),
    )


def summarize_metrics(metrics: list[MetricSummary]) -> Dict[str, Dict[str, float]]:
    """Aggregate metrics into mean/std dictionary."""
    values = {
        "accuracy": np.array([m.accuracy for m in metrics]),
        "precision": np.array([m.precision for m in metrics]),
        "recall": np.array([m.recall for m in metrics]),
        "f1": np.array([m.f1 for m in metrics]),
    }
    return {
        key: {"mean": float(arr.mean()), "std": float(arr.std(ddof=1))}
        for key, arr in values.items()
    }
