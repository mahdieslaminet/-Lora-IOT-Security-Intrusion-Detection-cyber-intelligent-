"""Preprocessor setup for API requests."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional

import yaml

from iot_anomaly_detection.data.preprocessing import FeaturePreprocessor, PreprocessConfig


CONFIG_PATH = Path(__file__).resolve().parents[3] / "config" / "params.yaml"


def load_preprocess_config() -> PreprocessConfig:
    if not CONFIG_PATH.exists():
        return PreprocessConfig()
    with CONFIG_PATH.open("r", encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}
    config = raw.get("preprocessing", {})
    return PreprocessConfig(
        frame_len_bins=config.get("frame_len_bins"),
        port_bins=config.get("port_bins"),
        max_unique_for_categorical=config.get("max_unique_for_categorical", 50),
        keep_numeric_frame_len=config.get("keep_numeric_frame_len", False),
        keep_numeric_ports=config.get("keep_numeric_ports", True),
        text_length_threshold=config.get("text_length_threshold", 30),
    )


def build_preprocessor(mapping: Optional[Dict[str, str]] = None) -> FeaturePreprocessor:
    config = load_preprocess_config()
    return FeaturePreprocessor(config=config, mapping=mapping)
