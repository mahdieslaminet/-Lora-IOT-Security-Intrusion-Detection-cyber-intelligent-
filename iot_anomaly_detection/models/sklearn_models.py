"""Scikit-learn model adapters."""

from __future__ import annotations

from typing import Any, Dict

from sklearn.ensemble import AdaBoostClassifier, RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import BernoulliNB
from sklearn.svm import LinearSVC

from .base import BaseAnomalyDetector
from .registry import register_model


class LogisticRegressionDetector(BaseAnomalyDetector):
    name = "logistic_regression"

    def build_estimator(self, params: Dict[str, Any]):
        return LogisticRegression(max_iter=500, **params)

    def get_default_params(self) -> Dict[str, Any]:
        return {"C": 1.0, "penalty": "l2", "solver": "liblinear"}

    def get_search_space(self) -> Dict[str, list[Any]]:
        return {"C": [0.1, 1.0, 10.0], "penalty": ["l2"], "solver": ["liblinear"]}


class BernoulliNBDetector(BaseAnomalyDetector):
    name = "naive_bayes"

    def build_estimator(self, params: Dict[str, Any]):
        return BernoulliNB(**params)

    def get_default_params(self) -> Dict[str, Any]:
        return {"alpha": 1.0, "binarize": 0.0}

    def get_search_space(self) -> Dict[str, list[Any]]:
        return {"alpha": [0.1, 0.5, 1.0, 2.0], "binarize": [0.0]}


class RandomForestDetector(BaseAnomalyDetector):
    name = "random_forest"

    def build_estimator(self, params: Dict[str, Any]):
        return RandomForestClassifier(random_state=42, **params)

    def get_default_params(self) -> Dict[str, Any]:
        return {"n_estimators": 200, "max_features": "sqrt", "max_depth": None}

    def get_search_space(self) -> Dict[str, list[Any]]:
        return {
            "n_estimators": [100, 200, 300],
            "max_features": ["sqrt", "log2"],
            "max_depth": [None, 10, 20],
        }


class AdaBoostDetector(BaseAnomalyDetector):
    name = "adaboost"

    def build_estimator(self, params: Dict[str, Any]):
        return AdaBoostClassifier(random_state=42, **params)

    def get_default_params(self) -> Dict[str, Any]:
        return {"n_estimators": 100, "learning_rate": 1.0}

    def get_search_space(self) -> Dict[str, list[Any]]:
        return {"n_estimators": [50, 100, 200], "learning_rate": [0.5, 1.0, 1.5]}


class LinearSVMDetector(BaseAnomalyDetector):
    name = "linear_svm"

    def build_estimator(self, params: Dict[str, Any]):
        return LinearSVC(**params)

    def get_default_params(self) -> Dict[str, Any]:
        return {"C": 1.0, "loss": "squared_hinge"}

    def get_search_space(self) -> Dict[str, list[Any]]:
        return {"C": [0.1, 1.0, 10.0], "loss": ["hinge", "squared_hinge"]}


class ExtraTreesDetector(BaseAnomalyDetector):
    name = "extra_trees"

    def build_estimator(self, params: Dict[str, Any]):
        return ExtraTreesClassifier(random_state=42, **params)

    def get_default_params(self) -> Dict[str, Any]:
        return {"n_estimators": 300, "max_features": "sqrt", "max_depth": None}

    def get_search_space(self) -> Dict[str, list[Any]]:
        return {
            "n_estimators": [200, 300, 500],
            "max_features": ["sqrt", "log2"],
            "max_depth": [None, 10, 20],
        }


class GradientBoostingDetector(BaseAnomalyDetector):
    name = "gradient_boosting"

    def build_estimator(self, params: Dict[str, Any]):
        return GradientBoostingClassifier(**params)

    def get_default_params(self) -> Dict[str, Any]:
        return {"n_estimators": 200, "learning_rate": 0.1, "max_depth": 3}

    def get_search_space(self) -> Dict[str, list[Any]]:
        return {
            "n_estimators": [100, 200, 300],
            "learning_rate": [0.05, 0.1, 0.2],
            "max_depth": [2, 3, 4],
        }


register_model(LogisticRegressionDetector.name, LogisticRegressionDetector)
register_model(BernoulliNBDetector.name, BernoulliNBDetector)
register_model(RandomForestDetector.name, RandomForestDetector)
register_model(AdaBoostDetector.name, AdaBoostDetector)
register_model(LinearSVMDetector.name, LinearSVMDetector)
register_model(ExtraTreesDetector.name, ExtraTreesDetector)
register_model(GradientBoostingDetector.name, GradientBoostingDetector)
