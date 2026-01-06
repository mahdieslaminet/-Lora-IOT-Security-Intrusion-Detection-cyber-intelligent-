import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import SectionCard from "../components/SectionCard";
import type { DatasetCatalogItem, DatasetInfo } from "../lib/types";
import { loadHFDataset, uploadDataset, validateMapping, getDatasetCatalog } from "../lib/api";

type DatasetUploadPageProps = {
  dataset: DatasetInfo | null;
  mapping: Record<string, string>;
  setDataset: (dataset: DatasetInfo) => void;
  setMapping: (mapping: Record<string, string>) => void;
};

export default function DatasetUploadPage({ dataset, mapping, setDataset, setMapping }: DatasetUploadPageProps) {
  const [hfName, setHfName] = useState("fenar/iot-security");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<DatasetCatalogItem[]>([]);
  const mappedCount = Object.values(mapping || {}).filter(Boolean).length;
  const coverage = dataset?.required?.length ? Math.round((mappedCount / dataset.required.length) * 100) : 0;

  useEffect(() => {
    getDatasetCatalog()
      .then((items) => setCatalog(items))
      .catch(() => setCatalog([]));
  }, []);

  const handleLoadHF = async (nameOverride?: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const datasetName = nameOverride ?? hfName;
      const data = await loadHFDataset(datasetName, "train", 5000);
      setDataset(data);
      setMapping(data.mapping ?? {});
      setMessage(`Loaded ${data.name} with ${data.columns.length} columns.`);
    } catch (error) {
      setMessage("Failed to load dataset. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await uploadDataset(file);
      setDataset(data);
      setMapping(data.mapping ?? {});
      setMessage(`Uploaded ${data.name} with ${data.columns.length} columns.`);
    } catch (error) {
      setMessage("Upload failed. Ensure the file is CSV/JSON/Parquet.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!dataset) return;
    const result = await validateMapping(dataset.dataset_id, mapping);
    setValidation(result.valid ? "Mapping looks good." : `Missing columns: ${result.missing.join(", ")}`);
  };

  return (
    <Box className="fade-in">
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <SectionCard
            title="Load a Dataset"
            subtitle="Upload a file or pull from Hugging Face datasets."
          >
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Hugging Face dataset"
                value={hfName}
                onChange={(event) => setHfName(event.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={() => handleLoadHF()} disabled={loading}>
                Load from Hugging Face
              </Button>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                Upload CSV/JSON/Parquet
                <input
                  type="file"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </Button>
              {loading && <LinearProgress />}
              {message && <Alert severity="info">{message}</Alert>}
            </Box>
          </SectionCard>

          <Box mt={3}>
            <SectionCard
              title="Dataset Catalog"
              subtitle="Quick-load supported datasets including SCADA telemetry."
            >
              <Box display="flex" flexDirection="column" gap={1}>
                {catalog.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Catalog unavailable.
                  </Typography>
                )}
                {catalog.map((item) => (
                  <Box key={item.name} display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2">{item.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.name} • {item.type}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setHfName(item.name);
                        handleLoadHF(item.name);
                      }}
                    >
                      Load
                    </Button>
                  </Box>
                ))}
              </Box>
            </SectionCard>
          </Box>
        </Grid>

        <Grid item xs={12} md={7}>
          <SectionCard
            title="Map Core Attributes"
            subtitle="Align dataset columns with the 14 packet-level attributes from the paper."
          >
            {!dataset && <Typography variant="body2">Load a dataset to map columns.</Typography>}
            {dataset && (
              <Box display="flex" flexDirection="column" gap={2}>
                {dataset.required.map((feature) => (
                  <TextField
                    key={feature}
                    select
                    label={feature}
                    value={mapping[feature] ?? ""}
                    onChange={(event) =>
                      setMapping({
                        ...mapping,
                        [feature]: event.target.value,
                      })
                    }
                    fullWidth
                  >
                    <MenuItem value="">Not available</MenuItem>
                    {dataset.columns.map((col) => (
                      <MenuItem key={col} value={col}>
                        {col}
                      </MenuItem>
                    ))}
                  </TextField>
                ))}
                <Button variant="contained" onClick={handleValidate}>
                  Validate Mapping
                </Button>
                {validation && <Alert severity="info">{validation}</Alert>}
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard
            title="Mapping Insights"
            subtitle="Coverage tracker and quick glance at mapped columns."
          >
            <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
              <Box flex={1}>
                <Typography variant="subtitle2">Coverage</Typography>
                <Typography variant="body2" color="text.secondary">
                  {mappedCount}/{dataset?.required?.length ?? 0} core fields mapped
                </Typography>
                <LinearProgress variant="determinate" value={coverage} sx={{ height: 10, borderRadius: 6, mt: 1 }} />
              </Box>
              <Box flex={1} display="flex" flexWrap="wrap" gap={1}>
                {dataset?.required?.map((feature) => (
                  <Chip
                    key={feature}
                    label={`${feature}: ${mapping[feature] ?? "missing"}`}
                    size="small"
                    color={mapping[feature] ? "success" : "default"}
                    variant={mapping[feature] ? "filled" : "outlined"}
                  />
                )) ?? (
                  <Typography variant="body2" color="text.secondary">
                    Load a dataset to begin mapping.
                  </Typography>
                )}
              </Box>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
