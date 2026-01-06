"""Encoding helpers used in preprocessing."""

from __future__ import annotations

import numpy as np
import pandas as pd


def cyclical_time_encoding(series: pd.Series, period: int) -> pd.DataFrame:
    """Return sin/cos cyclical encoding for a numeric time series."""
    radians = 2 * np.pi * (series.astype(float) / period)
    return pd.DataFrame(
        {
            "time_sin": np.sin(radians),
            "time_cos": np.cos(radians),
        },
        index=series.index,
    )


def bin_numeric(series: pd.Series, bins: list[float], labels: list[str] | None = None) -> pd.Series:
    """Bin a numeric series into categorical buckets."""
    return pd.cut(series.astype(float), bins=bins, labels=labels, include_lowest=True)
