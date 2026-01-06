"""Training utilities including nested CV with SMOTE and RFE."""

from __future__ import annotations

from typing import Any, Dict, List, Tuple
import warnings

import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline
from sklearn.feature_selection import RFE
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GridSearchCV
from sklearn.tree import DecisionTreeClassifier

from ..data.preprocessing import FeaturePreprocessor
from ..utils.cv import build_nested_cv
from ..utils.metrics import MetricSummary, compute_classification_metrics, summarize_metrics
from .base import BaseAnomalyDetector

warnings.filterwarnings(
    "ignore",
    message="`BaseEstimator._validate_data` is deprecated.*",
    category=FutureWarning,
)


def _prefixed_grid(grid: Dict[str, list[Any]], prefix: str = "model") -> Dict[str, list[Any]]:
    return {f"{prefix}__{key}": values for key, values in grid.items()}


class SafeRFE(RFE):
    """RFE that caps selected features to available feature count."""

    def fit(self, X, y=None, **fit_params):  # type: ignore[override]
        if self.n_features_to_select is not None and X is not None:
            self.n_features_to_select = min(self.n_features_to_select, X.shape[1])
        return super().fit(X, y, **fit_params)


def nested_cv_evaluate(
    X: pd.DataFrame,
    y: pd.Series,
    model: BaseAnomalyDetector,
    preprocessor: FeaturePreprocessor,
    rfe_features: int = 10,
    random_state: int = 42,
    param_grid_override: Dict[str, list[Any]] | None = None,
) -> Tuple[Dict[str, Dict[str, float]], List[MetricSummary], List[Any], List[Tuple[pd.Series, pd.Series]]]:
    """Run nested CV with SMOTE, RFE, and grid search."""
    outer_cv, inner_cv = build_nested_cv(random_state=random_state)
    metrics: List[MetricSummary] = []
    best_estimators: List[Any] = []
    fold_predictions: List[Tuple[pd.Series, pd.Series]] = []

    param_grid = _prefixed_grid(param_grid_override or model.get_search_space())

    for train_idx, test_idx in outer_cv.split(X, y):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        pipeline = Pipeline(
            steps=[
                ("preprocess", preprocessor),
                ("impute", SimpleImputer(strategy="median")),
                ("smote", SMOTE(random_state=random_state)),
                (
                    "rfe",
                    SafeRFE(
                        estimator=DecisionTreeClassifier(random_state=random_state),
                        n_features_to_select=rfe_features,
                        step=0.1,
                    ),
                ),
                ("model", model.build_estimator(model.get_default_params())),
            ]
        )

        search = GridSearchCV(
            pipeline,
            param_grid=param_grid,
            cv=inner_cv,
            scoring="roc_auc",
            n_jobs=-1,
        )
        search.fit(X_train, y_train)

        best_model = search.best_estimator_
        y_pred = best_model.predict(X_test)
        metrics.append(compute_classification_metrics(y_test, y_pred))
        fold_predictions.append((y_test.reset_index(drop=True), pd.Series(y_pred)))
        best_estimators.append(best_model)

    summary = summarize_metrics(metrics)
    return summary, metrics, best_estimators, fold_predictions
