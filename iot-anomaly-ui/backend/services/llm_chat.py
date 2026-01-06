"""Gemini chat integration for the dashboard assistant."""

from __future__ import annotations

import json
import os
from typing import Dict, List, Optional, Tuple

DEFAULT_MODEL = "gemini-2.5-pro"
DEFAULT_BASE_URL = "https://api.gapgpt.app/"
_API_KEY_ENV = "GEMINI_API_KEY"
_BASE_URL_ENV = "GAPGPT_BASE_URL"

_CLIENT: Optional[object] = None


def _import_genai() -> Tuple[object, object]:
    try:
        from google.genai import Client, types
    except Exception as exc:  # pragma: no cover - import guard
        raise RuntimeError(
            "google-genai is not installed. Run `pip install -r requirements.txt` "
            "or `pip install google-genai`."
        ) from exc
    return Client, types

SYSTEM_PROMPT = (
    "You are a senior cybersecurity analyst and ML engineer specializing in IoT/SCADA anomaly detection. "
    "Use the provided dataset summary and ML evaluation context to answer. "
    "Deliver blue-team guidance, defensive controls, and realistic response steps. "
    "If context is missing, ask the user to load a dataset or run training. "
    "Do not claim to have performed actions you did not perform; be transparent about uncertainty. "
    "Refuse or redirect offensive requests toward defensive, safe guidance."
)


def _get_client() -> Tuple[object, object]:
    global _CLIENT
    Client, types = _import_genai()
    api_key = os.getenv(_API_KEY_ENV)
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set.")
    if _CLIENT is None:
        base_url = os.getenv(_BASE_URL_ENV, DEFAULT_BASE_URL)
        _CLIENT = Client(api_key=api_key, http_options=types.HttpOptions(base_url=base_url))
    return _CLIENT, types


def _summarize_leaderboard(leaderboard: Optional[List[Dict[str, object]]]) -> Dict[str, object]:
    if not leaderboard:
        return {}
    sorted_rows = sorted(leaderboard, key=lambda row: row.get("f1_mean", 0), reverse=True)
    top = sorted_rows[0]
    top_metrics = {key: top.get(key) for key in ("accuracy_mean", "precision_mean", "recall_mean", "f1_mean")}
    return {
        "top_model": top.get("model"),
        "top_metrics": top_metrics,
        "rows": sorted_rows[:5],
    }


def build_chat_context(
    dataset_name: Optional[str],
    summary: Optional[Dict[str, object]],
    leaderboard: Optional[List[Dict[str, object]]],
    cve_matches: Optional[List[Dict[str, object]]] = None,
) -> Dict[str, object]:
    context: Dict[str, object] = {
        "dataset_name": dataset_name,
    }
    if summary:
        context["dataset_summary"] = summary
    if leaderboard:
        context["leaderboard"] = _summarize_leaderboard(leaderboard)
    if cve_matches:
        context["cve_matches"] = cve_matches
    return context


def _build_prompt(messages: List[Dict[str, str]], context: Dict[str, object]) -> str:
    transcript_lines: List[str] = []
    for message in messages:
        role = message.get("role", "user")
        role_label = "User" if role == "user" else "Assistant"
        content = str(message.get("content", "")).strip()
        if content:
            transcript_lines.append(f"{role_label}: {content}")
    transcript = "\n".join(transcript_lines) if transcript_lines else "User: (no messages provided)"
    context_blob = json.dumps(context, ensure_ascii=True, indent=2)
    return f"{SYSTEM_PROMPT}\n\nContext (JSON):\n{context_blob}\n\nConversation:\n{transcript}\n\nAssistant:"


def generate_chat_reply(
    messages: List[Dict[str, str]],
    context: Dict[str, object],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.2,
) -> str:
    client, types = _get_client()
    prompt = _build_prompt(messages, context)

    config = None
    try:
        config = types.GenerateContentConfig(temperature=temperature, max_output_tokens=900)
    except Exception:
        config = None

    if config:
        response = client.models.generate_content(model=model, contents=prompt, config=config)
    else:
        response = client.models.generate_content(model=model, contents=prompt)

    text = getattr(response, "text", "")
    return (text or "").strip()
