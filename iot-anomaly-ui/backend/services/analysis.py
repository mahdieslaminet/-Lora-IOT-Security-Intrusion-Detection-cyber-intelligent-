"""Threat intelligence and blue team analysis utilities."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


CVE_DATASET = "ahadda5/cve150k"

_CVE_CACHE: Dict[int, Dict[str, object]] = {}


@dataclass
class CVEEntry:
    text: str
    keyphrase: str


@dataclass
class CVESimilarity:
    text: str
    keyphrase: str
    score: float


def _load_cve_index(sample_size: int = 5000) -> Dict[str, object]:
    if sample_size in _CVE_CACHE:
        return _CVE_CACHE[sample_size]

    dataset = load_dataset(CVE_DATASET, split="train")
    if sample_size:
        dataset = dataset.shuffle(seed=42).select(range(min(sample_size, len(dataset))))

    entries: List[CVEEntry] = []
    texts: List[str] = []
    for row in dataset:
        tokens = row.get("text", [])
        if isinstance(tokens, list):
            text = " ".join(tokens)
        else:
            text = str(tokens)
        keyphrase = row.get("keyphrase", [])
        if isinstance(keyphrase, list):
            keyphrase_text = ", ".join(keyphrase)
        else:
            keyphrase_text = str(keyphrase)
        entries.append(CVEEntry(text=text, keyphrase=keyphrase_text))
        texts.append(text)

    vectorizer = TfidfVectorizer(max_features=6000, stop_words="english")
    matrix = vectorizer.fit_transform(texts)

    _CVE_CACHE[sample_size] = {
        "entries": entries,
        "vectorizer": vectorizer,
        "matrix": matrix,
    }
    return _CVE_CACHE[sample_size]


def _select_text_columns(df: pd.DataFrame) -> List[str]:
    priority = [
        "description",
        "Summary",
        "summary",
        "incident_type",
        "Type_of_Breach",
        "instruction",
        "input",
        "output",
        "text",
        "Scenario",
        "scenario",
    ]
    columns = [col for col in priority if col in df.columns]
    if columns:
        return columns
    return df.select_dtypes(include=["object"]).columns.tolist()


def build_dataset_document(df: pd.DataFrame, max_rows: int = 300) -> str:
    if df.empty:
        return ""
    columns = _select_text_columns(df)
    if not columns:
        return ""
    sample = df[columns].head(max_rows)
    docs = []
    for _, row in sample.iterrows():
        parts = [str(value) for value in row.values if value not in (None, np.nan)]
        docs.append(" ".join(parts))
    return " ".join(docs)


def compute_cve_similarity(
    df: pd.DataFrame,
    top_k: int = 8,
    sample_size: int = 5000,
    max_rows: int = 300,
) -> List[CVESimilarity]:
    document = build_dataset_document(df, max_rows=max_rows)
    if not document:
        return []

    cache = _load_cve_index(sample_size)
    vectorizer: TfidfVectorizer = cache["vectorizer"]  # type: ignore[assignment]
    matrix = cache["matrix"]
    entries: List[CVEEntry] = cache["entries"]  # type: ignore[assignment]

    query_vec = vectorizer.transform([document])
    scores = cosine_similarity(query_vec, matrix).ravel()
    top_idx = np.argsort(scores)[::-1][:top_k]

    return [
        CVESimilarity(
            text=entries[idx].text,
            keyphrase=entries[idx].keyphrase,
            score=float(scores[idx]),
        )
        for idx in top_idx
    ]


def build_blue_team_briefing(
    summary: Dict[str, object],
    cve_matches: List[CVESimilarity],
    best_f1: Optional[float] = None,
) -> Dict[str, object]:
    anomaly_rate = float(summary.get("anomaly_rate", 0.0))
    missingness = summary.get("missingness", []) or []
    max_missing = max((item.get("missing_ratio", 0) for item in missingness), default=0.0)

    base = anomaly_rate * 100
    penalty = max_missing * 40
    model_factor = 0.0 if best_f1 is None else (1 - best_f1) * 20
    risk_score = int(min(100, base + penalty + model_factor))

    severity = "low"
    if risk_score >= 70:
        severity = "high"
    elif risk_score >= 40:
        severity = "medium"

    findings = []
    if anomaly_rate > 0.15:
        findings.append("Elevated anomaly rate indicates potential abuse or abnormal telemetry patterns.")
    if max_missing > 0.2:
        findings.append("High missingness in key columns may hide attack signals or sensor faults.")
    if best_f1 is not None and best_f1 < 0.7:
        findings.append("Model separation is moderate; consider feature tuning or additional sensors.")
    if cve_matches:
        findings.append("Textual similarity suggests alignment with known CVE patterns (triage recommended).")

    defensive_controls = [
        "Network segmentation around SCADA/ICS zones",
        "Centralized logging (SIEM) with anomaly thresholds",
        "Patch management and vulnerability scanning cadence",
        "Privileged access management and MFA",
    ]

    blue_team_tools = [
        "Suricata/Zeek for network telemetry",
        "Wazuh/OSSEC for host monitoring",
        "Sigma rules for standardized detections",
        "YARA rules for payload scanning",
    ]

    response_playbook = [
        "Detect: Validate anomalous signals against baselines.",
        "Contain: Isolate affected endpoints or segments.",
        "Eradicate: Patch vulnerable services and rotate credentials.",
        "Recover: Restore from trusted backups and monitor regressions.",
        "Lessons Learned: Update detection rules and incident runbooks.",
    ]

    scenarios = [
        {
            "title": "Telemetry Manipulation",
            "description": "An adversary manipulates SCADA telemetry to hide device degradation or trigger false alarms.",
            "actions": [
                "Cross-check telemetry with secondary sensors.",
                "Audit command logs for unauthorized changes.",
                "Harden ingestion pipelines with integrity checks.",
            ],
        },
        {
            "title": "Credential Abuse",
            "description": "Access tokens are used to trigger high-risk operations or data exfiltration.",
            "actions": [
                "Review privileged account usage and alert on anomalies.",
                "Rotate credentials and enforce MFA.",
                "Enable least-privilege access policies.",
            ],
        },
    ]

    white_team_checks = [
        "Verify incident response SLAs and escalation paths.",
        "Ensure compliance evidence is captured (logs, tickets, approvals).",
        "Conduct post-incident review and governance reporting.",
    ]

    return {
        "risk_score": risk_score,
        "severity": severity,
        "findings": findings,
        "defensive_controls": defensive_controls,
        "blue_team_tools": blue_team_tools,
        "response_playbook": response_playbook,
        "scenarios": scenarios,
        "white_team_checks": white_team_checks,
    }
