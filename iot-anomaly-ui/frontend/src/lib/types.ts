export type DatasetInfo = {
  dataset_id: string;
  name: string;
  columns: string[];
  mapping: Record<string, string>;
  required: string[];
};

export type DatasetCatalogItem = {
  name: string;
  label: string;
  type: string;
  notes: string;
};
export type DatasetSummary = {
  dataset_id: string;
  name: string;
  rows: number;
  columns: number;
  anomaly_rate: number;
  label_distribution: Array<{ label: number; count: number; ratio: number }>;
  missingness: Array<{ column: string; missing_ratio: number }>;
  time_range?: { start: string; end: string } | null;
  numeric_columns: string[];
  categorical_columns: string[];
};

export type DatasetPreview = {
  dataset_id: string;
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
};

export type CVESimilarity = {
  text: string;
  keyphrase: string;
  score: number;
};

export type BlueTeamBriefing = {
  dataset_id: string;
  dataset_name: string;
  summary: DatasetSummary;
  risk_score: number;
  severity: string;
  findings: string[];
  defensive_controls: string[];
  blue_team_tools: string[];
  response_playbook: string[];
  scenarios: Array<{ title: string; description: string; actions: string[] }>;
  white_team_checks: string[];
  cve_matches: CVESimilarity[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  dataset_id?: string | null;
  mapping?: Record<string, string>;
  job_id?: string;
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  include_cve?: boolean;
};

export type ChatResponse = {
  reply: string;
  model: string;
};

export type LibraryLink = {
  name: string;
  url: string;
  description: string;
};

export type TutorialContent = {
  title: string;
  intro: string;
  quickstart: {
    notebook: string[];
    backend: string[];
    frontend: string[];
    docker: string[];
  };
  pipeline: string[];
  env: Array<{ name: string; description: string }>;
  libraries: {
    python: LibraryLink[];
    frontend: LibraryLink[];
  };
  troubleshooting: string[];
};

export type RelatedPaper = {
  title: string;
  link: string;
  summary: string;
  how_it_works: string[];
  code: string;
  tags: string[];
};

export type TrainingStatus = {
  job_id: string;
  status: string;
  progress: number;
  message: string;
  results?: TrainingResults;
  error?: string;
};

export type TrainingHistoryItem = {
  job_id: string;
  status: string;
  progress: number;
  message: string;
  dataset_id: string;
  dataset_name: string;
  model_names: string[];
  rfe_features: number;
  started_at: string;
  completed_at?: string | null;
};

export type LeaderboardRow = {
  model: string;
  accuracy_mean: number;
  accuracy_std: number;
  precision_mean: number;
  precision_std: number;
  recall_mean: number;
  recall_std: number;
  f1_mean: number;
  f1_std: number;
};

export type ModelResult = {
  summary: Record<string, { mean: number; std: number }>;
  confusion_matrix: number[][];
  feature_importances: Array<{ feature: string; score?: number; rank?: number }>;
};

export type TrainingResults = {
  leaderboard: LeaderboardRow[];
  models: Record<string, ModelResult>;
};
