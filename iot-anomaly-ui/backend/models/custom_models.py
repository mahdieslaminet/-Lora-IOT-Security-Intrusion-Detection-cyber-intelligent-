"""Custom model stubs for extension."""

from __future__ import annotations

from typing import Any, Dict

from sklearn.base import BaseEstimator

from iot_anomaly_detection.models.base import BaseAnomalyDetector
from iot_anomaly_detection.models.registry import register_model


class ExampleCustomModel(BaseAnomalyDetector):
    name = "example_custom"

    def build_estimator(self, params: Dict[str, Any]) -> BaseEstimator:
        raise NotImplementedError("Replace with a real estimator.")

    def get_default_params(self) -> Dict[str, Any]:
        return {}

    def get_search_space(self) -> Dict[str, list[Any]]:
        return {}


# Uncomment to register when implemented.
# register_model(ExampleCustomModel.name, ExampleCustomModel)
