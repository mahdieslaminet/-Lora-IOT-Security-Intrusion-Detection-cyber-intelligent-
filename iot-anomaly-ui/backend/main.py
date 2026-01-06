"""FastAPI backend for IoT anomaly detection UI."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from services.dataset_loader import (
    DatasetStore,
    load_hf,
    load_uploaded,
    required_features,
    suggest_mapping,
    compute_summary,
    DATASET_CATALOG,
)
from services.trainer import TrainingStore
from services.evaluator import build_leaderboard
from services.analysis import compute_cve_similarity, build_blue_team_briefing
from services.llm_chat import build_chat_context, generate_chat_reply
from services.content import get_tutorial_content, get_related_papers
from iot_anomaly_detection.models import list_models


app = FastAPI(title="IoT Anomaly Detection")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

DATA_ROOT = Path(__file__).resolve().parent / "data"
dataset_store = DatasetStore(DATA_ROOT)
trainer = TrainingStore(dataset_store)


class HFRequest(BaseModel):
    name: str
    split: str = "train"
    sample_size: Optional[int] = None


class MappingRequest(BaseModel):
    dataset_id: str
    mapping: Dict[str, str]


class TrainRequest(BaseModel):
    dataset_id: str
    mapping: Dict[str, str]
    model_names: List[str]
    rfe_features: int = 10
    param_grids: Optional[Dict[str, Dict[str, List[object]]]] = None


class SummaryRequest(BaseModel):
    dataset_id: str
    mapping: Optional[Dict[str, str]] = None


class CVERequest(BaseModel):
    dataset_id: str
    top_k: int = 8
    cve_sample_size: int = 5000
    max_rows: int = 300


class BriefingRequest(BaseModel):
    dataset_id: str
    mapping: Optional[Dict[str, str]] = None
    job_id: Optional[str] = None
    include_cve: bool = True


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    dataset_id: Optional[str] = None
    mapping: Optional[Dict[str, str]] = None
    job_id: Optional[str] = None
    messages: List[ChatMessage] = []
    model: str = "gemini-2.5-pro"
    temperature: float = 0.2
    include_cve: bool = False


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/models")
async def models():
    return {"models": sorted(list_models().keys())}


@app.get("/datasets/catalog")
async def dataset_catalog():
    return {"datasets": DATASET_CATALOG}


@app.post("/datasets/hf")
async def load_hf_dataset(request: HFRequest):
    df = load_hf(request.name, split=request.split, sample_size=request.sample_size)
    record = dataset_store.add(request.name, df)
    mapping = suggest_mapping(df)
    return {
        "dataset_id": record.dataset_id,
        "name": record.name,
        "columns": df.columns.tolist(),
        "mapping": mapping,
        "required": required_features(),
    }


@app.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    path = DATA_ROOT / file.filename
    content = await file.read()
    path.write_bytes(content)
    df = load_uploaded(path)
    record = dataset_store.add(file.filename, df)
    mapping = suggest_mapping(df)
    return {
        "dataset_id": record.dataset_id,
        "name": record.name,
        "columns": df.columns.tolist(),
        "mapping": mapping,
        "required": required_features(),
    }


@app.post("/datasets/validate")
async def validate_dataset(request: MappingRequest):
    record = dataset_store.get(request.dataset_id)
    mapping = request.mapping
    available = set(record.df.columns)
    missing = [canonical for canonical, src in mapping.items() if src not in available]
    return {
        "dataset_id": record.dataset_id,
        "missing": missing,
        "valid": len(missing) == 0,
    }


@app.post("/datasets/summary")
async def dataset_summary(request: SummaryRequest):
    record = dataset_store.get(request.dataset_id)
    summary = compute_summary(record.df, mapping=request.mapping)
    return {
        "dataset_id": record.dataset_id,
        "name": record.name,
        **summary,
    }


@app.get("/datasets/{dataset_id}/preview")
async def dataset_preview(dataset_id: str, limit: int = Query(5, ge=1, le=20)):
    record = dataset_store.get(dataset_id)
    preview = record.df.head(limit)
    preview = preview.where(preview.notna(), None).to_dict(orient="records")
    return {
        "dataset_id": record.dataset_id,
        "columns": record.df.columns.tolist(),
        "rows": preview,
    }


@app.post("/train")
async def start_training(request: TrainRequest):
    job = trainer.start_training(
        dataset_id=request.dataset_id,
        model_names=request.model_names,
        mapping=request.mapping,
        rfe_features=request.rfe_features,
        param_grids=request.param_grids,
    )
    return {"job_id": job.job_id, "status": job.status}


@app.get("/train/{job_id}")
async def get_training(job_id: str):
    job = trainer.get(job_id)
    results = job.results
    if results and "leaderboard" in results:
        results["leaderboard"] = build_leaderboard(results["leaderboard"])
    return {
        "job_id": job.job_id,
        "status": job.status,
        "progress": job.progress,
        "message": job.message,
        "results": results,
        "error": job.error,
    }


@app.get("/train/history")
async def get_training_history():
    jobs = trainer.list_jobs()
    return {
        "jobs": [
            {
                "job_id": job.job_id,
                "status": job.status,
                "progress": job.progress,
                "message": job.message,
                "dataset_id": job.dataset_id,
                "dataset_name": job.dataset_name,
                "model_names": job.model_names,
                "rfe_features": job.rfe_features,
                "started_at": job.started_at,
                "completed_at": job.completed_at,
            }
            for job in jobs
        ]
    }


@app.post("/analysis/cve-similarity")
async def analysis_cve_similarity(request: CVERequest):
    record = dataset_store.get(request.dataset_id)
    matches = compute_cve_similarity(
        record.df,
        top_k=request.top_k,
        sample_size=request.cve_sample_size,
        max_rows=request.max_rows,
    )
    return {
        "dataset_id": record.dataset_id,
        "matches": [
            {
                "text": match.text,
                "keyphrase": match.keyphrase,
                "score": match.score,
            }
            for match in matches
        ],
    }


@app.post("/analysis/briefing")
async def analysis_briefing(request: BriefingRequest):
    record = dataset_store.get(request.dataset_id)
    summary = compute_summary(record.df, mapping=request.mapping)

    best_f1 = None
    if request.job_id:
        job = trainer.get(request.job_id)
    else:
        job = trainer.latest_for_dataset(request.dataset_id)
    if job and job.results and job.results.get("leaderboard"):
        leaderboard = job.results["leaderboard"]
        if leaderboard:
            best_f1 = leaderboard[0].get("f1_mean")

    cve_matches = []
    if request.include_cve:
        cve_matches = compute_cve_similarity(record.df, top_k=5, sample_size=3000, max_rows=200)

    briefing = build_blue_team_briefing(summary, cve_matches, best_f1=best_f1)
    return {
        "dataset_id": record.dataset_id,
        "dataset_name": record.name,
        "summary": summary,
        "cve_matches": [
            {"text": match.text, "keyphrase": match.keyphrase, "score": match.score}
            for match in cve_matches
        ],
        **briefing,
    }


@app.post("/assistant/chat")
async def assistant_chat(request: ChatRequest):
    summary = None
    leaderboard = None
    dataset_name = None
    cve_matches: List[Dict[str, object]] = []

    if request.dataset_id:
        record = dataset_store.get(request.dataset_id)
        dataset_name = record.name
        summary = compute_summary(record.df, mapping=request.mapping)

        if request.include_cve:
            cve_rows = compute_cve_similarity(record.df, top_k=3, sample_size=2000, max_rows=200)
            cve_matches = [
                {"text": match.text, "keyphrase": match.keyphrase, "score": match.score}
                for match in cve_rows
            ]

        job = None
        if request.job_id:
            try:
                job = trainer.get(request.job_id)
            except KeyError:
                job = None
        if job is None:
            job = trainer.latest_for_dataset(request.dataset_id)
        if job and job.results:
            leaderboard = job.results.get("leaderboard")

    context = build_chat_context(dataset_name, summary, leaderboard, cve_matches)
    messages = [message.model_dump() for message in request.messages][-12:]
    try:
        reply = generate_chat_reply(
            messages=messages,
            context=context,
            model=request.model,
            temperature=request.temperature,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Assistant request failed.") from exc

    return {"reply": reply, "model": request.model}


@app.get("/content/tutorial")
async def content_tutorial():
    return get_tutorial_content()


@app.get("/content/related-papers")
async def content_related_papers():
    return {"papers": get_related_papers()}
