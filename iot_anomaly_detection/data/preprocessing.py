"""Preprocessing pipeline that mirrors the paper's feature engineering."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

from ..utils.constants import CORE_FEATURES, FRAME_LEN_BINS, PORT_BINS
from ..utils.encoding import cyclical_time_encoding, bin_numeric
from .feature_mapping import apply_feature_mapping, infer_feature_mapping


@dataclass
class PreprocessConfig:
    frame_len_bins: list[float] = None
    port_bins: list[int] = None
    max_unique_for_categorical: int = 50
    keep_numeric_frame_len: bool = False
    keep_numeric_ports: bool = True
    text_length_threshold: int = 30

    def __post_init__(self):
        if self.frame_len_bins is None:
            self.frame_len_bins = FRAME_LEN_BINS
        if self.port_bins is None:
            self.port_bins = PORT_BINS


def _ensure_datetime(series: pd.Series) -> pd.Series:
    if np.issubdtype(series.dtype, np.datetime64):
        return series
    return pd.to_datetime(series, errors="coerce")


def _add_flow_features(df: pd.DataFrame, time_col: str, length_col: str) -> pd.DataFrame:
    keys = [col for col in ["ip.src", "ip.dst", "tcp.srcport", "tcp.dstport", "protocol"] if col in df.columns]
    if not keys:
        return df
    grouped = df.groupby(keys, dropna=False)
    df["flow.packets"] = grouped[time_col].transform("count")
    if time_col in df.columns:
        time_series = _ensure_datetime(df[time_col])
        df[time_col] = time_series
        duration = grouped[time_col].transform(lambda x: (x.max() - x.min()).total_seconds())
        df["flow.duration"] = duration.fillna(0)
    if length_col in df.columns:
        df["flow.bytes"] = grouped[length_col].transform("sum")
    if "flow.duration" in df.columns and "flow.bytes" in df.columns:
        duration = df["flow.duration"].replace(0, np.nan)
        df["flow.rate"] = (df["flow.bytes"] / duration).fillna(0)
    return df


def _add_time_features(df: pd.DataFrame, time_col: str) -> pd.DataFrame:
    if time_col not in df.columns:
        return df
    dt = _ensure_datetime(df[time_col])
    seconds = (dt.dt.hour * 3600 + dt.dt.minute * 60 + dt.dt.second).fillna(0)
    encoded = cyclical_time_encoding(seconds, period=24 * 3600)
    df = df.drop(columns=[time_col])
    return pd.concat([df, encoded], axis=1)


def _bin_frame_len(df: pd.DataFrame, length_col: str, bins: list[float], keep_numeric: bool) -> pd.DataFrame:
    if length_col not in df.columns:
        return df
    df[f"{length_col}.bin"] = bin_numeric(df[length_col], bins=bins)
    if not keep_numeric:
        df = df.drop(columns=[length_col])
    return df


def _bin_ports(df: pd.DataFrame, bins: list[int], keep_numeric: bool) -> pd.DataFrame:
    port_cols = [col for col in df.columns if col.endswith("port")]
    for col in port_cols:
        df[f"{col}.bin"] = bin_numeric(df[col], bins=bins)
        if not keep_numeric:
            df = df.drop(columns=[col])
    return df


def build_feature_frame(
    df: pd.DataFrame,
    mapping: Optional[Dict[str, str]] = None,
    config: Optional[PreprocessConfig] = None,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Build model-ready features and labels from a raw DataFrame."""
    config = config or PreprocessConfig()
    mapping = mapping or infer_feature_mapping(df.columns)
    df = apply_feature_mapping(df, mapping)

    label_col = CORE_FEATURES["label"]
    time_col = CORE_FEATURES["time"]
    length_col = CORE_FEATURES["frame_len"]

    df = _add_flow_features(df, time_col=time_col, length_col=length_col)
    df = _add_time_features(df, time_col=time_col)
    df = _bin_frame_len(df, length_col=length_col, bins=config.frame_len_bins, keep_numeric=config.keep_numeric_frame_len)
    df = _bin_ports(df, bins=config.port_bins, keep_numeric=config.keep_numeric_ports)

    y = df[label_col]
    X = df.drop(columns=[label_col])

    return X, y


class FeaturePreprocessor(BaseEstimator, TransformerMixin):
    """Sklearn-compatible transformer with paper-style preprocessing."""

    def __init__(self, config: Optional[PreprocessConfig] = None, mapping: Optional[Dict[str, str]] = None):
        self.config = config or PreprocessConfig()
        self.mapping = mapping
        self.feature_columns_: list[str] | None = None
        self.categorical_columns_: list[str] | None = None
        self.text_columns_: list[str] | None = None
        self.mapping_: Dict[str, str] | None = None

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None):
        self.mapping_ = self.mapping or infer_feature_mapping(X.columns)
        features, _ = build_feature_frame(X, mapping=self.mapping_, config=self.config)

        self.text_columns_ = []
        categorical = []
        for col in features.columns:
            if features[col].dtype == "object" or str(features[col].dtype).startswith("category"):
                series = features[col].astype(str)
                unique_count = series.nunique(dropna=False)
                avg_len = series.str.len().mean()
                if unique_count > self.config.max_unique_for_categorical or avg_len > self.config.text_length_threshold:
                    self.text_columns_.append(col)
                else:
                    categorical.append(col)
            elif features[col].nunique(dropna=False) <= self.config.max_unique_for_categorical:
                if col.endswith("port") or col in {"protocol", "tcp.flags", "frame.len.bin"}:
                    categorical.append(col)
        self.categorical_columns_ = sorted(set(categorical))

        features = self._add_text_features(features)
        encoded = pd.get_dummies(features, columns=self.categorical_columns_, dummy_na=True)
        self.feature_columns_ = encoded.columns.tolist()
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        if self.feature_columns_ is None:
            raise RuntimeError("FeaturePreprocessor must be fitted before calling transform.")
        mapping = self.mapping_ or self.mapping or infer_feature_mapping(X.columns)
        features, _ = build_feature_frame(X, mapping=mapping, config=self.config)
        features = self._add_text_features(features)
        encoded = pd.get_dummies(features, columns=self.categorical_columns_, dummy_na=True)
        encoded = encoded.reindex(columns=self.feature_columns_, fill_value=0)
        return encoded.to_numpy()

    def get_feature_names_out(self) -> list[str]:
        if self.feature_columns_ is None:
            raise RuntimeError("FeaturePreprocessor must be fitted before accessing feature names.")
        return self.feature_columns_

    def _add_text_features(self, features: pd.DataFrame) -> pd.DataFrame:
        if not self.text_columns_:
            return features
        features = features.copy()
        for col in self.text_columns_:
            if col in features.columns:
                series = features[col].astype(str)
                features[f"{col}.len"] = series.str.len().fillna(0)
                features[f"{col}.tokens"] = series.str.split().str.len().fillna(0)
                features = features.drop(columns=[col])
        return features
