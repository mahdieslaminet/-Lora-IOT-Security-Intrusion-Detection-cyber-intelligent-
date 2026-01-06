"""Training orchestration for the API."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4
import concurrent.futures

import numpy as np
import pandas as pd

from iot_anomaly_detection.data.feature_mapping import apply_feature_mapping
from iot_anomaly_detection.models.registry import get_model
from iot_anomaly_detection.models.trainer import nested_cv_evaluate

from .dataset_loader import DatasetStore
from .preprocessor import build_preprocessor


@dataclass
class TrainingJob:
    job_id: str
    status: str = "pending"
    progress: float = 0.0
    message: str = ""
    results: Optional[Dict[str, object]] = None
    error: Optional[str] = None
    dataset_id: str = ""
    dataset_name: str = ""
    model_names: List[str] = field(default_factory=list)
    rfe_features: int = 10
    started_at: str = ""
    completed_at: Optional[str] = None


class TrainingStore:
    def __init__(self, dataset_store: DatasetStore):
        self.dataset_store = dataset_store
        self.jobs: Dict[str, TrainingJob] = {}
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

    def start_training(
        self,
        dataset_id: str,
        model_names: List[str],
        mapping: Dict[str, str],
        rfe_features: int,
        param_grids: Optional[Dict[str, Dict[str, List[object]]]] = None,
    ) -> TrainingJob:
        record = self.dataset_store.get(dataset_id)
        job_id = uuid4().hex
        job = TrainingJob(
            job_id=job_id,
            status="running",
            message="starting",
            dataset_id=dataset_id,
            dataset_name=record.name,
            model_names=model_names,
            rfe_features=rfe_features,
            started_at=datetime.utcnow().isoformat(),
        )
        self.jobs[job_id] = job
        self.executor.submit(self._run_training, job, dataset_id, model_names, mapping, rfe_features, param_grids)
        return job

    def get(self, job_id: str) -> TrainingJob:
        if job_id not in self.jobs:
            raise KeyError(f"Unknown job id: {job_id}")
        return self.jobs[job_id]

    def list_jobs(self) -> List[TrainingJob]:
        return sorted(self.jobs.values(), key=lambda job: job.started_at, reverse=True)

    def latest_for_dataset(self, dataset_id: str) -> Optional[TrainingJob]:
        for job in self.list_jobs():
            if job.dataset_id == dataset_id:
                return job
        return None

    def _run_training(
        self,
        job: TrainingJob,
        dataset_id: str,
        model_names: List[str],
        mapping: Dict[str, str],
        rfe_features: int,
        param_grids: Optional[Dict[str, Dict[str, List[object]]]] = None,
    ) -> None:
        try:
            record = self.dataset_store.get(dataset_id)
            raw_df = record.df

            mapped = apply_feature_mapping(raw_df, mapping)
            y = mapped["label"]
            X = raw_df

            preprocessor = build_preprocessor(mapping=mapping)
            results: Dict[str, object] = {"models": {}, "leaderboard": []}

            for idx, name in enumerate(model_names):
                model_cls = get_model(name)
                model = model_cls()
                override_grid = param_grids.get(name) if param_grids else None
                summary, metrics, estimators, fold_predictions = nested_cv_evaluate(
                    X,
                    y,
                    model,
                    preprocessor,
                    rfe_features=rfe_features,
                    param_grid_override=override_grid,
                )

                confusion = self._aggregate_confusion(fold_predictions)
                feature_importances = self._extract_feature_importance(preprocessor, estimators)

                results["models"][name] = {
                    "summary": summary,
                    "confusion_matrix": confusion,
                    "feature_importances": feature_importances,
                }

                results["leaderboard"].append(
                    {
                        "model": name,
                        "accuracy_mean": summary["accuracy"]["mean"],
                        "accuracy_std": summary["accuracy"]["std"],
                        "precision_mean": summary["precision"]["mean"],
                        "precision_std": summary["precision"]["std"],
                        "recall_mean": summary["recall"]["mean"],
                        "recall_std": summary["recall"]["std"],
                        "f1_mean": summary["f1"]["mean"],
                        "f1_std": summary["f1"]["std"],
                    }
                )

                job.progress = float(idx + 1) / max(len(model_names), 1)
                job.message = f"completed {idx + 1}/{len(model_names)} models"

            job.status = "completed"
            job.completed_at = datetime.utcnow().isoformat()
            job.results = results
        except Exception as exc:
            job.status = "failed"
            job.error = str(exc)
            job.completed_at = datetime.utcnow().isoformat()

    @staticmethod
    def _aggregate_confusion(fold_predictions: List[tuple[pd.Series, pd.Series]]) -> List[List[int]]:
        y_true = pd.concat([pair[0] for pair in fold_predictions], ignore_index=True)
        y_pred = pd.concat([pair[1] for pair in fold_predictions], ignore_index=True)
        tp = int(((y_true == 1) & (y_pred == 1)).sum())
        tn = int(((y_true == 0) & (y_pred == 0)).sum())
        fp = int(((y_true == 0) & (y_pred == 1)).sum())
        fn = int(((y_true == 1) & (y_pred == 0)).sum())
        return [[tn, fp], [fn, tp]]

    @staticmethod
    def _extract_feature_importance(preprocessor, estimators) -> List[Dict[str, object]]:
        if not estimators:
            return []
        estimator = estimators[-1]
        feature_names: list[str] = []
        preprocess_step = getattr(estimator, "named_steps", {}).get("preprocess") if hasattr(estimator, "named_steps") else None
        if preprocess_step and hasattr(preprocess_step, "get_feature_names_out"):
            try:
                feature_names = preprocess_step.get_feature_names_out()
            except Exception:
                feature_names = []
        elif preprocessor and hasattr(preprocessor, "get_feature_names_out"):
            try:
                feature_names = preprocessor.get_feature_names_out()
            except Exception:
                feature_names = []

        rfe = getattr(estimator, "named_steps", {}).get("rfe") if hasattr(estimator, "named_steps") else None
        if rfe is not None and hasattr(rfe, "ranking_") and feature_names:
            ranks = rfe.ranking_
            pairs = sorted(zip(feature_names, ranks), key=lambda x: x[1])
            return [{"feature": name, "rank": int(rank)} for name, rank in pairs[:20]]

        model = getattr(estimator, "named_steps", {}).get("model") if hasattr(estimator, "named_steps") else None
        if model is not None and hasattr(model, "feature_importances_") and feature_names:
            scores = model.feature_importances_
            pairs = sorted(zip(feature_names, scores), key=lambda x: x[1], reverse=True)
            return [{"feature": name, "score": float(score)} for name, score in pairs[:20]]

        return []
