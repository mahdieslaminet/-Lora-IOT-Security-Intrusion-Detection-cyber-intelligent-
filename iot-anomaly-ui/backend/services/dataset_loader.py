"""Dataset loading and storage for the API."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional
from uuid import uuid4

import numpy as np
import pandas as pd

from iot_anomaly_detection.data import load_hf_dataset, load_local_dataset
from iot_anomaly_detection.data.feature_mapping import infer_feature_mapping, apply_feature_mapping
from iot_anomaly_detection.utils.constants import MAPPING_FEATURES


@dataclass
class DatasetRecord:
    dataset_id: str
    name: str
    df: pd.DataFrame


class DatasetStore:
    def __init__(self, root: Path):
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        self._datasets: Dict[str, DatasetRecord] = {}

    def add(self, name: str, df: pd.DataFrame) -> DatasetRecord:
        dataset_id = uuid4().hex
        record = DatasetRecord(dataset_id=dataset_id, name=name, df=df)
        self._datasets[dataset_id] = record
        return record

    def get(self, dataset_id: str) -> DatasetRecord:
        if dataset_id not in self._datasets:
            raise KeyError(f"Unknown dataset id: {dataset_id}")
        return self._datasets[dataset_id]


DATASET_CATALOG = [
    {
        "name": "fenar/iot-security",
        "label": "IoT Security (proxy)",
        "type": "iot",
        "notes": "Proxy IoT dataset for DAD reproduction.",
    },
    {
        "name": "schooly/Cyber-Security-Breaches",
        "label": "Cyber Security Breaches",
        "type": "incident",
        "notes": "Breach metadata and summaries.",
    },
    {
        "name": "stu8king/securityincidents",
        "label": "Security Incidents",
        "type": "incident",
        "notes": "Incident records with narrative fields.",
    },
    {
        "name": "kutay1907/scadaphotodataset",
        "label": "SCADA Photo Dataset",
        "type": "image",
        "notes": "Small image + text dataset.",
    },
    {
        "name": "kutay1907/ScadaData100k",
        "label": "SCADA Text Instructions",
        "type": "text",
        "notes": "Instruction/input/output records.",
    },
    {
        "name": "vossmoos/vestasv52-scada-windturbine-granada",
        "label": "Vestas V52 SCADA (Wind Turbine)",
        "type": "scada",
        "notes": "Telemetry with scenario labels.",
    },
]


def load_hf(name: str, split: str = "train", sample_size: Optional[int] = None) -> pd.DataFrame:
    return load_hf_dataset(name, split=split, sample_size=sample_size)


def load_uploaded(path: Path) -> pd.DataFrame:
    return load_local_dataset(str(path))


def suggest_mapping(df: pd.DataFrame) -> Dict[str, str]:
    return infer_feature_mapping(df.columns)


def required_features() -> list[str]:
    return list(MAPPING_FEATURES.values())


def compute_summary(df: pd.DataFrame, mapping: Optional[Dict[str, str]] = None) -> Dict[str, object]:
    mapping = mapping or infer_feature_mapping(df.columns)
    mapped = apply_feature_mapping(df, mapping)
    total = len(mapped)

    label_counts = mapped["label"].value_counts(dropna=False)
    label_distribution = [
        {
            "label": int(label),
            "count": int(count),
            "ratio": float(count / total) if total else 0.0,
        }
        for label, count in label_counts.items()
    ]

    anomaly_rate = 0.0
    for entry in label_distribution:
        if entry["label"] == 1:
            anomaly_rate = entry["ratio"]

    missing = df.isna().mean().sort_values(ascending=False).head(10)
    missingness = [
        {"column": column, "missing_ratio": float(ratio)}
        for column, ratio in missing.items()
    ]

    time_range = None
    if "frame.time" in mapped.columns:
        time_series = pd.to_datetime(mapped["frame.time"], errors="coerce")
        if time_series.notna().any():
            time_range = {
                "start": time_series.min().isoformat(),
                "end": time_series.max().isoformat(),
            }

    return {
        "rows": int(total),
        "columns": int(df.shape[1]),
        "missingness": missingness,
        "label_distribution": label_distribution,
        "anomaly_rate": anomaly_rate,
        "time_range": time_range,
        "numeric_columns": df.select_dtypes(include=[np.number]).columns.tolist(),
        "categorical_columns": df.select_dtypes(exclude=[np.number]).columns.tolist(),
    }
