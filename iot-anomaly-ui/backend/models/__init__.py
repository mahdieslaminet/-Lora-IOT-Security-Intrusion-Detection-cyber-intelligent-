"""Model adapters and registry access for the API."""

from iot_anomaly_detection.models import list_models, get_model
from .base import BaseAnomalyDetector
from . import sklearn_adapters  # noqa: F401

__all__ = ["BaseAnomalyDetector", "list_models", "get_model"]
