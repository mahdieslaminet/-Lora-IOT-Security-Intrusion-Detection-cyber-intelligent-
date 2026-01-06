"""RFE selector helpers."""

from __future__ import annotations

from sklearn.feature_selection import RFE
from sklearn.tree import DecisionTreeClassifier


def build_rfe_selector(n_features: int = 10, random_state: int = 42) -> RFE:
    """Build an RFE selector with a decision tree estimator."""
    estimator = DecisionTreeClassifier(random_state=random_state)
    return RFE(estimator=estimator, n_features_to_select=n_features, step=0.1)
