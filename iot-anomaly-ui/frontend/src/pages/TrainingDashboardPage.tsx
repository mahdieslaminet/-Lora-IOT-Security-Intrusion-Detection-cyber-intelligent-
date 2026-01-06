import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  LinearProgress,
  TextField,
  Typography,
  Alert,
  Chip,
} from "@mui/material";

import SectionCard from "../components/SectionCard";
import type { DatasetInfo, TrainingHistoryItem, TrainingStatus } from "../lib/types";
import { listModels, startTraining, getTraining, getTrainingHistory } from "../lib/api";

type TrainingDashboardProps = {
  dataset: DatasetInfo | null;
  mapping: Record<string, string>;
  setTrainingStatus: (status: TrainingStatus | null) => void;
};

const DEFAULT_GRIDS: Record<string, Record<string, unknown[]>> = {
  logistic_regression: { C: [0.1, 1.0, 10.0], penalty: ["l2"], solver: ["liblinear"] },
  naive_bayes: { alpha: [0.1, 0.5, 1.0, 2.0], binarize: [0.0] },
  random_forest: { n_estimators: [100, 200, 300], max_features: ["sqrt", "log2"], max_depth: [null, 10, 20] },
  adaboost: { n_estimators: [50, 100, 200], learning_rate: [0.5, 1.0, 1.5] },
  linear_svm: { C: [0.1, 1.0, 10.0], loss: ["hinge", "squared_hinge"] },
  extra_trees: { n_estimators: [200, 300, 500], max_features: ["sqrt", "log2"], max_depth: [null, 10, 20] },
  gradient_boosting: { n_estimators: [100, 200, 300], learning_rate: [0.05, 0.1, 0.2], max_depth: [2, 3, 4] },
};

export default function TrainingDashboardPage({ dataset, mapping, setTrainingStatus }: TrainingDashboardProps) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [rfeFeatures, setRfeFeatures] = useState(10);
  const [gridText, setGridText] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TrainingHistoryItem[]>([]);

  useEffect(() => {
    listModels().then((models) => {
      setAvailableModels(models);
      setSelectedModels(models.slice(0, 5));
      const grids: Record<string, string> = {};
      models.forEach((model) => {
        grids[model] = JSON.stringify(DEFAULT_GRIDS[model] ?? {}, null, 2);
      });
      setGridText(grids);
    });
  }, []);

  useEffect(() => {
    getTrainingHistory()
      .then((jobs) => setHistory(jobs.slice(0, 6)))
      .catch(() => setHistory([]));
  }, [status]);

  useEffect(() => {
    if (!status || !status.job_id || status.status === "completed" || status.status === "failed") {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const updated = await getTraining(status.job_id);
        setStatus(updated);
        setTrainingStatus(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          clearInterval(interval);
        }
      } catch (err) {
        setError("Failed to fetch training status.");
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [status, setTrainingStatus]);

  const paramGrids = useMemo(() => {
    const parsed: Record<string, Record<string, unknown[]>> = {};
    for (const model of selectedModels) {
      try {
        parsed[model] = JSON.parse(gridText[model] ?? "{}") as Record<string, unknown[]>;
      } catch {
        return null;
      }
    }
    return parsed;
  }, [gridText, selectedModels]);

  const start = async () => {
    setError(null);
    if (!dataset) {
      setError("Load a dataset first.");
      return;
    }
    if (!selectedModels.length) {
      setError("Select at least one model.");
      return;
    }
    if (!paramGrids) {
      setError("Fix invalid JSON in hyperparameter grids.");
      return;
    }
    try {
      const response = await startTraining(dataset.dataset_id, mapping, selectedModels, rfeFeatures, paramGrids);
      const nextStatus: TrainingStatus = {
        job_id: response.job_id,
        status: response.status,
        progress: 0,
        message: "training started",
      };
      setStatus(nextStatus);
      setTrainingStatus(nextStatus);
    } catch (err) {
      setError("Failed to start training.");
    }
  };

  return (
    <Box className="fade-in">
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <SectionCard
            title="Model Selection"
            subtitle="Choose which models to train and compare."
          >
            <Box display="flex" flexDirection="column" gap={1}>
              {dataset && (
                <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                  <Chip label={dataset.name} color="primary" size="small" />
                  <Chip label={`Mapped: ${Object.values(mapping || {}).filter(Boolean).length}`} size="small" />
                </Box>
              )}
              {availableModels.map((model) => (
                <FormControlLabel
                  key={model}
                  control={
                    <Checkbox
                      checked={selectedModels.includes(model)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedModels([...selectedModels, model]);
                        } else {
                          setSelectedModels(selectedModels.filter((item) => item !== model));
                        }
                      }}
                    />
                  }
                  label={model}
                />
              ))}
              <TextField
                type="number"
                label="RFE selected features"
                value={rfeFeatures}
                onChange={(event) => setRfeFeatures(Number(event.target.value))}
              />
              <Button variant="contained" onClick={start}>
                Start Training
              </Button>
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <SectionCard
            title="Hyperparameter Grids"
            subtitle="Edit the grid search ranges per model."
          >
            <Box display="flex" flexDirection="column" gap={2}>
              {selectedModels.map((model) => (
                <TextField
                  key={model}
                  label={`${model} grid (JSON)`}
                  value={gridText[model] ?? "{}"}
                  onChange={(event) =>
                    setGridText({
                      ...gridText,
                      [model]: event.target.value,
                    })
                  }
                  multiline
                  minRows={3}
                />
              ))}
            </Box>
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <SectionCard title="Training Progress" subtitle="Nested CV with SMOTE and ROC AUC tuning.">
            {!status && <Typography variant="body2">No training job started yet.</Typography>}
            {status && (
              <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="body2">{status.message}</Typography>
                <LinearProgress variant="determinate" value={status.progress * 100} />
                <Typography variant="caption">Status: {status.status}</Typography>
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Recent Jobs" subtitle="Quick glance at the latest training runs.">
            {history.length ? (
              history.map((job) => (
                <Box key={job.job_id} display="flex" justifyContent="space-between" mb={1}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {job.dataset_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.model_names.join(", ")}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Chip
                      label={job.status}
                      size="small"
                      color={job.status === "completed" ? "success" : job.status === "failed" ? "error" : "warning"}
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(job.started_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No training history yet.
              </Typography>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
