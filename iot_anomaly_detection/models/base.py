"""Base classes for model adapters."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict

from sklearn.base import BaseEstimator


@dataclass
class ModelResult:
    name: str
    metrics: Dict[str, Dict[str, float]]


class BaseAnomalyDetector(ABC):
    """Base adapter interface for anomaly detection models."""

    name: str

    @abstractmethod
    def build_estimator(self, params: Dict[str, Any]) -> BaseEstimator:
        raise NotImplementedError

    @abstractmethod
    def get_default_params(self) -> Dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_search_space(self) -> Dict[str, list[Any]]:
        raise NotImplementedError
