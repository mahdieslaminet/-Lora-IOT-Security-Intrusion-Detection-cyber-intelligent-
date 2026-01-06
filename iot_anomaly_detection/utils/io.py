"""I/O helpers for dataset loading."""

from __future__ import annotations

from pathlib import Path

import pandas as pd


SUPPORTED_EXTENSIONS = {".csv", ".json", ".parquet"}


def read_table(path: str | Path) -> pd.DataFrame:
    """Read CSV, JSON, or Parquet into a DataFrame."""
    path = Path(path)
    if path.suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {path.suffix}")
    if path.suffix == ".csv":
        return pd.read_csv(path)
    if path.suffix == ".json":
        return pd.read_json(path)
    return pd.read_parquet(path)
