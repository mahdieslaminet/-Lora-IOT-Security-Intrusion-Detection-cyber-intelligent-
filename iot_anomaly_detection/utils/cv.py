"""Cross-validation utilities."""

from __future__ import annotations

from sklearn.model_selection import StratifiedKFold


def build_nested_cv(random_state: int = 42):
    """Return outer and inner stratified KFold splitters."""
    outer = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    inner = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    return outer, inner
