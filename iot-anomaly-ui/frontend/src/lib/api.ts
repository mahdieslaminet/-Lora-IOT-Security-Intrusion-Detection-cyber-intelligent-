import type {
  DatasetInfo,
  TrainingStatus,
  DatasetSummary,
  DatasetPreview,
  TrainingHistoryItem,
  DatasetCatalogItem,
  CVESimilarity,
  BlueTeamBriefing,
  ChatRequest,
  ChatResponse,
  TutorialContent,
  RelatedPaper
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function loadHFDataset(name: string, split = "train", sample_size?: number): Promise<DatasetInfo> {
  const res = await fetch(`${API_BASE}/datasets/hf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, split, sample_size })
  });
  if (!res.ok) {
    throw new Error("Failed to load dataset");
  }
  return res.json();
}

export async function uploadDataset(file: File): Promise<DatasetInfo> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    throw new Error("Failed to upload dataset");
  }
  return res.json();
}

export async function validateMapping(dataset_id: string, mapping: Record<string, string>) {
  const res = await fetch(`${API_BASE}/datasets/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id, mapping })
  });
  if (!res.ok) {
    throw new Error("Failed to validate mapping");
  }
  return res.json();
}

export async function getDatasetSummary(
  dataset_id: string,
  mapping?: Record<string, string>
): Promise<DatasetSummary> {
  const res = await fetch(`${API_BASE}/datasets/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id, mapping })
  });
  if (!res.ok) {
    throw new Error("Failed to fetch dataset summary");
  }
  return res.json();
}

export async function getDatasetCatalog(): Promise<DatasetCatalogItem[]> {
  const res = await fetch(`${API_BASE}/datasets/catalog`);
  if (!res.ok) {
    throw new Error("Failed to fetch dataset catalog");
  }
  const data = await res.json();
  return data.datasets ?? [];
}

export async function getDatasetPreview(dataset_id: string, limit = 5): Promise<DatasetPreview> {
  const res = await fetch(`${API_BASE}/datasets/${dataset_id}/preview?limit=${limit}`);
  if (!res.ok) {
    throw new Error("Failed to fetch dataset preview");
  }
  return res.json();
}

export async function listModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) {
    throw new Error("Failed to list models");
  }
  const data = await res.json();
  return data.models ?? [];
}

export async function getTrainingHistory(): Promise<TrainingHistoryItem[]> {
  const res = await fetch(`${API_BASE}/train/history`);
  if (!res.ok) {
    throw new Error("Failed to fetch training history");
  }
  const data = await res.json();
  return data.jobs ?? [];
}

export async function getCVESimilarity(
  dataset_id: string,
  top_k = 8,
  cve_sample_size = 5000,
  max_rows = 300
): Promise<CVESimilarity[]> {
  const res = await fetch(`${API_BASE}/analysis/cve-similarity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id, top_k, cve_sample_size, max_rows })
  });
  if (!res.ok) {
    throw new Error("Failed to fetch CVE similarity");
  }
  const data = await res.json();
  return data.matches ?? [];
}

export async function getBlueTeamBriefing(
  dataset_id: string,
  mapping?: Record<string, string>,
  job_id?: string
): Promise<BlueTeamBriefing> {
  const res = await fetch(`${API_BASE}/analysis/briefing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id, mapping, job_id })
  });
  if (!res.ok) {
    throw new Error("Failed to fetch blue team briefing");
  }
  return res.json();
}

export async function startTraining(
  dataset_id: string,
  mapping: Record<string, string>,
  model_names: string[],
  rfe_features: number,
  param_grids?: Record<string, Record<string, unknown[]>>
): Promise<{ job_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id, mapping, model_names, rfe_features, param_grids })
  });
  if (!res.ok) {
    throw new Error("Failed to start training");
  }
  return res.json();
}

export async function getTraining(job_id: string): Promise<TrainingStatus> {
  const res = await fetch(`${API_BASE}/train/${job_id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch training status");
  }
  return res.json();
}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const message = await res.json().catch(() => ({}));
    throw new Error(message.detail ?? "Failed to send chat message");
  }
  return res.json();
}

export async function getTutorialContent(): Promise<TutorialContent> {
  const res = await fetch(`${API_BASE}/content/tutorial`);
  if (!res.ok) {
    throw new Error("Failed to fetch tutorial content");
  }
  return res.json();
}

export async function getRelatedPapers(): Promise<RelatedPaper[]> {
  const res = await fetch(`${API_BASE}/content/related-papers`);
  if (!res.ok) {
    throw new Error("Failed to fetch related papers");
  }
  const data = await res.json();
  return data.papers ?? [];
}
