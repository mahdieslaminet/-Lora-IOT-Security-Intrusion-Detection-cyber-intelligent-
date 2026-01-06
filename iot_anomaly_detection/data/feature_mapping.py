"""Feature mapping utilities for proxy datasets."""

from __future__ import annotations

from typing import Dict, Iterable

import numpy as np
import pandas as pd

from ..utils.constants import CORE_FEATURES, MAPPING_FEATURES, LABEL_ALIASES


FEATURE_SYNONYMS = {
    "ip.src": ["ip.src", "src_ip", "source_ip", "ip_source", "ip_src", "srcip"],
    "ip.dst": ["ip.dst", "dst_ip", "dest_ip", "destination_ip", "ip_dest", "ip_dst", "dstip"],
    "tcp.srcport": ["tcp.srcport", "src_port", "sport", "source_port", "tcp_sport"],
    "tcp.dstport": ["tcp.dstport", "dst_port", "dport", "destination_port", "tcp_dport"],
    "udp.srcport": ["udp.srcport", "udp_sport"],
    "udp.dstport": ["udp.dstport", "udp_dport"],
    "frame.len": [
        "frame.len",
        "len",
        "length",
        "pkt_len",
        "packet_length",
        "bytes",
        "power",
        "windspeed",
        "individuals_affected",
        "impact_indicator_value",
    ],
    "frame.time": [
        "frame.time",
        "timestamp",
        "time",
        "frame_time",
        "datetime",
        "date_of_breach",
        "date_posted_or_updated",
        "breach_start",
        "breach_end",
        "start_date",
        "end_date",
        "timestamp",
    ],
    "tcp.flags": ["tcp.flags", "flags", "tcp_flag"],
    "protocol": ["protocol", "proto", "l4_proto", "incident_type", "type_of_breach", "scenario"],
    "label": ["label", "target", "class", "attack", "is_attack", "malicious", "scenario", "has_disruption", "data_theft"],
}


REQUIRED_FEATURES = list(MAPPING_FEATURES.values())


def infer_feature_mapping(columns: Iterable[str]) -> Dict[str, str]:
    """Infer a mapping from dataset columns to canonical feature names."""
    column_lookup = {col.lower(): col for col in columns}
    mapping: Dict[str, str] = {}
    for canonical, candidates in FEATURE_SYNONYMS.items():
        for candidate in candidates:
            key = candidate.lower()
            if key in column_lookup:
                mapping[canonical] = column_lookup[key]
                break
    return mapping


def _coerce_label(series: pd.Series) -> pd.Series:
    if series.dtype.kind in {"i", "u", "b", "f"}:
        return series.fillna(0).astype(int).clip(0, 1)
    lowered = series.astype(str).str.lower().str.strip()
    return lowered.map(LABEL_ALIASES).fillna(0).astype(int)


def _derive_label(df: pd.DataFrame) -> pd.Series:
    if "Scenario" in df.columns or "scenario" in df.columns:
        col = "Scenario" if "Scenario" in df.columns else "scenario"
        series = df[col].astype(str).str.lower().str.strip()
        return (~series.str.contains("normal", na=False)).astype(int)
    if "has_disruption" in df.columns:
        series = df["has_disruption"]
        if series.dtype == bool:
            return series.astype(int)
        if series.dtype.kind in {"i", "u", "b", "f"}:
            return (series.fillna(0) > 0).astype(int)
        lowered = series.astype(str).str.lower().str.strip()
        return lowered.isin({"true", "yes", "1"}).astype(int)
    if "data_theft" in df.columns:
        series = df["data_theft"]
        if series.dtype == bool:
            return series.astype(int)
        if series.dtype.kind in {"i", "u", "b", "f"}:
            return (series.fillna(0) > 0).astype(int)
        return series.astype(str).str.contains("yes|true", case=False, na=False).astype(int)
    if "incident_type" in df.columns:
        keywords = ["Disruption", "Ransomware", "Hijacking"]
        pattern = "|".join(keywords)
        return df["incident_type"].astype(str).str.contains(pattern, case=False, na=False).astype(int)
    if "Type_of_Breach" in df.columns:
        keywords = ["Hacking", "Unauthorized", "Malware", "Ransomware", "IT Incident"]
        pattern = "|".join(keywords)
        return df["Type_of_Breach"].astype(str).str.contains(pattern, case=False, na=False).astype(int)
    if "instruction" in df.columns or "output" in df.columns:
        col = "output" if "output" in df.columns else "instruction"
        keywords = ["error", "alarm", "fault", "anomaly", "fail", "shutdown"]
        pattern = "|".join(keywords)
        return df[col].astype(str).str.contains(pattern, case=False, na=False).astype(int)
    if "text" in df.columns:
        keywords = ["fault", "damage", "crack", "anomaly", "defect"]
        pattern = "|".join(keywords)
        return df["text"].astype(str).str.contains(pattern, case=False, na=False).astype(int)
    if "impact_indicator" in df.columns:
        series = pd.to_numeric(df["impact_indicator"], errors="coerce").fillna(0)
        return (series > 0).astype(int)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].nunique(dropna=True) > 1:
            threshold = df[col].quantile(0.9)
            return (df[col] >= threshold).astype(int)
    return pd.Series([0] * len(df), index=df.index)


def _simulate_if_missing(df: pd.DataFrame, missing: list[str]) -> pd.DataFrame:
    """Create placeholder columns for missing core features."""
    for feature in missing:
        if feature in {"ip.src", "ip.dst"}:
            df[feature] = "0.0.0.0"
        elif feature in {"tcp.srcport", "tcp.dstport", "udp.srcport", "udp.dstport"}:
            df[feature] = 0
        elif feature == "frame.len":
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[feature] = df[numeric_cols[0]] if len(numeric_cols) else 0
        elif feature == "frame.time":
            df[feature] = pd.Timestamp("2021-01-01")
        elif feature == "tcp.flags":
            df[feature] = "0x00"
        elif feature == "protocol":
            df[feature] = "unknown"
        elif feature == "label":
            df[feature] = 0
        else:
            df[feature] = 0
    return df


def apply_feature_mapping(df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
    """Rename columns to canonical names and simulate missing features."""
    renamed = df.rename(columns={src: canonical for canonical, src in mapping.items()})
    missing = [feature for feature in REQUIRED_FEATURES if feature not in renamed.columns]
    renamed = _simulate_if_missing(renamed, missing)
    if "label" in renamed.columns:
        coerced = _coerce_label(renamed["label"])
        if coerced.nunique(dropna=True) > 1:
            renamed["label"] = coerced
        else:
            renamed["label"] = _derive_label(df)
    else:
        renamed["label"] = _derive_label(df)
    return renamed
