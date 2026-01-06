"""Model registry and training utilities."""

from .base import BaseAnomalyDetector, ModelResult
from .registry import register_model, get_model, list_models
from .sklearn_models import (
    LogisticRegressionDetector,
    BernoulliNBDetector,
    RandomForestDetector,
    AdaBoostDetector,
    LinearSVMDetector,
    ExtraTreesDetector,
    GradientBoostingDetector,
)
from .trainer import nested_cv_evaluate
from .evaluator import evaluate_predictions

__all__ = [
    "BaseAnomalyDetector",
    "ModelResult",
    "register_model",
    "get_model",
    "list_models",
    "LogisticRegressionDetector",
    "BernoulliNBDetector",
    "RandomForestDetector",
    "AdaBoostDetector",
    "LinearSVMDetector",
    "ExtraTreesDetector",
    "GradientBoostingDetector",
    "nested_cv_evaluate",
    "evaluate_predictions",
]
