import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import DataUsageRoundedIcon from "@mui/icons-material/DataUsageRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";

import SectionCard from "../components/SectionCard";
import StatTile from "../components/StatTile";
import type { DatasetInfo, DatasetPreview, DatasetSummary, TrainingHistoryItem, TrainingStatus } from "../lib/types";
import { getDatasetPreview, getDatasetSummary, getTrainingHistory } from "../lib/api";

const statusColor = (status: string): "success" | "error" | "warning" => {
  if (status === "completed") return "success";
  if (status === "failed") return "error";
  return "warning";
};

type DashboardPageProps = {
  dataset: DatasetInfo | null;
  mapping: Record<string, string>;
  trainingStatus: TrainingStatus | null;
};

export default function DashboardPage({ dataset, mapping, trainingStatus }: DashboardPageProps) {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [history, setHistory] = useState<TrainingHistoryItem[]>([]);

  useEffect(() => {
    let active = true;
    if (!dataset) {
      setSummary(null);
      setPreview(null);
      return;
    }
    getDatasetSummary(dataset.dataset_id, mapping)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setSummary(null);
      });
    getDatasetPreview(dataset.dataset_id, 6)
      .then((data) => {
        if (active) setPreview(data);
      })
      .catch(() => {
        if (active) setPreview(null);
      });
    return () => {
      active = false;
    };
  }, [dataset, mapping]);

  useEffect(() => {
    let active = true;
    getTrainingHistory()
      .then((jobs) => {
        if (active) setHistory(jobs.slice(0, 6));
      })
      .catch(() => {
        if (active) setHistory([]);
      });
    return () => {
      active = false;
    };
  }, [trainingStatus]);

  const mappedCount = useMemo(() => Object.values(mapping || {}).filter(Boolean).length, [mapping]);
  const requiredCount = dataset?.required?.length ?? 0;
  const coverage = requiredCount ? Math.round((mappedCount / requiredCount) * 100) : 0;

  const labelChart = (summary?.label_distribution ?? []).map((entry) => ({
    label: entry.label === 1 ? "Anomaly" : "Normal",
    count: entry.count,
  }));

  const latestJob = history[0];

  return (
    <Box className="fade-in">
      <Box
        sx={{
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          background: "linear-gradient(120deg, rgba(15, 118, 110, 0.18), rgba(249, 115, 22, 0.12))",
          border: "1px solid rgba(15, 118, 110, 0.18)",
          mb: 4,
        }}
      >
        <Typography variant="h4" gutterBottom>
          IoT Anomaly Detection Control Room
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
          Track dataset health, feature mapping, and training outcomes in one place. The dashboard reflects the full
          pipeline from Vigoya et al. with SMOTE, RFE, and nested cross-validation.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <StatTile
            label="Dataset"
            value={dataset ? dataset.name : "No dataset"}
            subtitle={summary ? `${summary.rows.toLocaleString()} rows` : "Load a dataset"}
            icon={<StorageRoundedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatTile
            label="Columns"
            value={summary ? summary.columns : "-"}
            subtitle={summary ? `${summary.numeric_columns.length} numeric` : "-"}
            icon={<DataUsageRoundedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatTile
            label="Anomaly Rate"
            value={summary ? `${(summary.anomaly_rate * 100).toFixed(1)}%` : "-"}
            subtitle={summary ? "Derived label" : "Awaiting summary"}
            icon={<TrendingUpRoundedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatTile
            label="Last Run"
            value={latestJob ? latestJob.status : "-"}
            subtitle={latestJob ? latestJob.dataset_name : "No training yet"}
            icon={<AutoGraphRoundedIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} md={7}>
          <SectionCard
            title="Dataset Health"
            subtitle="Label distribution, mapping coverage, and missingness hotspots."
          >
            <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
              <Box flex={1} minHeight={200}>
                {labelChart.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={labelChart}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0F766E" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Load a dataset to see class balance.
                  </Typography>
                )}
              </Box>
              <Box flex={1} display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="subtitle2">Mapping coverage</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mappedCount}/{requiredCount} core attributes mapped
                  </Typography>
                  <LinearProgress variant="determinate" value={coverage} sx={{ height: 8, borderRadius: 4, mt: 1 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Missingness hotspots
                  </Typography>
                  {summary?.missingness?.length ? (
                    summary.missingness.slice(0, 5).map((item) => (
                      <Box key={item.column} display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption">{item.column}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(item.missing_ratio * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No missingness data yet.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <SectionCard
            title="Pipeline Status"
            subtitle="Nested CV, SMOTE, RFE, and model search."
          >
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Active job</Typography>
                <Chip label={trainingStatus?.status ?? "idle"} color={statusColor(trainingStatus?.status ?? "idle")} size="small" />
              </Box>
              <LinearProgress
                variant={trainingStatus ? "determinate" : "indeterminate"}
                value={(trainingStatus?.progress ?? 0) * 100}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" color="text.secondary">
                {trainingStatus?.message ?? "No training running. Start a job to populate this timeline."}
              </Typography>
              <Button variant="contained" component={Link} to="/training">
                Configure Training
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Recent Training Runs" subtitle="Latest jobs with status and timing.">
            {history.length ? (
              history.map((job) => (
                <Box key={job.job_id} display="flex" justifyContent="space-between" mb={1}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {job.dataset_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.model_names.join(", ") || "-"}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Chip label={job.status} color={statusColor(job.status)} size="small" />
                    <Typography variant="caption" color="text.secondary" display="block">
                      {job.started_at ? new Date(job.started_at).toLocaleString() : ""}
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

        <Grid item xs={12} md={6}>
          <SectionCard title="Dataset Preview" subtitle="Quick look at raw columns.">
            {preview?.rows?.length ? (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {preview.columns.slice(0, 4).map((col) => (
                        <TableCell key={col}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.rows.map((row, idx) => (
                      <TableRow key={idx}>
                        {preview.columns.slice(0, 4).map((col) => (
                          <TableCell key={col}>{String(row[col] ?? "-").slice(0, 28)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Load a dataset to preview records.
              </Typography>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
