"""Registry for model adapters."""

from __future__ import annotations

from typing import Dict, Type

from .base import BaseAnomalyDetector


_MODEL_REGISTRY: Dict[str, Type[BaseAnomalyDetector]] = {}


def register_model(name: str, model_cls: Type[BaseAnomalyDetector]) -> None:
    if name in _MODEL_REGISTRY:
        raise ValueError(f"Model '{name}' already registered.")
    _MODEL_REGISTRY[name] = model_cls


def get_model(name: str) -> Type[BaseAnomalyDetector]:
    if name not in _MODEL_REGISTRY:
        raise KeyError(f"Model '{name}' is not registered.")
    return _MODEL_REGISTRY[name]


def list_models() -> Dict[str, Type[BaseAnomalyDetector]]:
    return dict(_MODEL_REGISTRY)
