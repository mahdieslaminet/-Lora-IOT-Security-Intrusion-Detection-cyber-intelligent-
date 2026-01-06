"""Class imbalance handling helpers."""

from __future__ import annotations

import numpy as np
from imblearn.over_sampling import SMOTE


def smote_resample(X: np.ndarray, y: np.ndarray, random_state: int = 42):
    """Apply SMOTE to balance classes."""
    sampler = SMOTE(random_state=random_state)
    return sampler.fit_resample(X, y)
