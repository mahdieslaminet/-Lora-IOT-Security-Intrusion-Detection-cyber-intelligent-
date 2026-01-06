"""Evaluation utilities for API responses."""

from __future__ import annotations

from typing import Dict, List


def build_leaderboard(rows: List[Dict[str, float]]) -> List[Dict[str, float]]:
    """Sort leaderboard rows by F1 mean descending."""
    return sorted(rows, key=lambda r: r.get("f1_mean", 0), reverse=True)
