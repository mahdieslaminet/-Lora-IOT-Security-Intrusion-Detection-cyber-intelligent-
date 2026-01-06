import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

import SectionCard from "../components/SectionCard";
import LeaderboardTable from "../components/LeaderboardTable";
import ConfusionMatrix from "../components/ConfusionMatrix";
import FeatureImportanceList from "../components/FeatureImportanceList";
import StatTile from "../components/StatTile";
import type { TrainingStatus } from "../lib/types";

type ResultsPageProps = {
  trainingStatus: TrainingStatus | null;
};

export default function ResultsPage({ trainingStatus }: ResultsPageProps) {
  const results = trainingStatus?.results;
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    if (results?.leaderboard?.length) {
      setSelectedModel(results.leaderboard[0].model);
    }
  }, [results]);

  const leaderboard = results?.leaderboard ?? [];
  const modelResult = results?.models?.[selectedModel];
  const bestModel = leaderboard[0];

  const chartData = useMemo(() => {
    return leaderboard.map((row) => ({
      model: row.model,
      Accuracy: row.accuracy_mean,
      Precision: row.precision_mean,
      Recall: row.recall_mean,
      F1: row.f1_mean,
    }));
  }, [leaderboard]);

  const exportJson = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "iot_anomaly_results.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box className="fade-in">
      {!results && <Typography variant="body2">Run a training job to see results.</Typography>}
      {results && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <StatTile label="Best Model" value={bestModel?.model ?? "-"} subtitle="Top F1 score" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatTile label="Accuracy" value={bestModel ? bestModel.accuracy_mean.toFixed(3) : "-"} subtitle="mean" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatTile label="Precision" value={bestModel ? bestModel.precision_mean.toFixed(3) : "-"} subtitle="mean" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatTile label="Recall" value={bestModel ? bestModel.recall_mean.toFixed(3) : "-"} subtitle="mean" />
          </Grid>

          <Grid item xs={12}>
            <SectionCard
              title="Leaderboard"
              subtitle="Mean ± std across nested CV folds."
            >
              <LeaderboardTable rows={leaderboard} />
              <Box mt={2}>
                <Button variant="outlined" onClick={exportJson}>
                  Export Results (JSON)
                </Button>
              </Box>
            </SectionCard>
          </Grid>

          <Grid item xs={12}>
            <SectionCard
              title="Model Comparison"
              subtitle="Interactive metric comparison across models."
            >
              <Box height={320}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Accuracy" fill="#0F766E" />
                    <Bar dataKey="Precision" fill="#F97316" />
                    <Bar dataKey="Recall" fill="#38BDF8" />
                    <Bar dataKey="F1" fill="#FACC15" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <SectionCard title="Model Details" subtitle="Inspect confusion matrix and selected features.">
              <TextField
                select
                fullWidth
                label="Select model"
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                sx={{ mb: 2 }}
              >
                {leaderboard.map((row) => (
                  <MenuItem key={row.model} value={row.model}>
                    {row.model}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="subtitle2" gutterBottom>
                Confusion Matrix
              </Typography>
              <ConfusionMatrix matrix={modelResult?.confusion_matrix ?? []} />
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={8}>
            <SectionCard title="Feature Importance" subtitle="RFE ranking or tree importances.">
              <FeatureImportanceList items={modelResult?.feature_importances ?? []} />
            </SectionCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
