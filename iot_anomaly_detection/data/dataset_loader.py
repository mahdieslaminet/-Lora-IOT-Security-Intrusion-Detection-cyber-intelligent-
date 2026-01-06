"""Dataset loading for Hugging Face and local files."""

from __future__ import annotations

from typing import Optional

import pandas as pd

from datasets import load_dataset

from ..utils.io import read_table


def load_hf_dataset(name: str, split: str = "train", sample_size: Optional[int] = None) -> pd.DataFrame:
    """Load a Hugging Face dataset split into a DataFrame."""
    dataset = load_dataset(name, split=split)
    df = dataset.to_pandas()
    if sample_size:
        df = df.sample(sample_size, random_state=42)
    return df.reset_index(drop=True)


def load_local_dataset(path: str) -> pd.DataFrame:
    """Load a local CSV/JSON/Parquet file into a DataFrame."""
    return read_table(path).reset_index(drop=True)
