import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";

import SectionCard from "../components/SectionCard";
import StatTile from "../components/StatTile";
import { getTutorialContent } from "../lib/api";
import type { TutorialContent } from "../lib/types";

const codeBlockStyles = {
  fontFamily: "'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.85rem",
  padding: "12px 14px",
  background: "rgba(15, 118, 110, 0.08)",
  borderRadius: 12,
  whiteSpace: "pre-wrap" as const,
};

export default function TutorialPage() {
  const [content, setContent] = useState<TutorialContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTutorialContent();
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tutorial");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box className="fade-in">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Tutorial & Setup
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step-by-step guide to run the project and reproduce the paper pipeline.
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {content && (
        <>
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <StatTile
                label="Pipeline"
                value="Nested CV"
                subtitle="SMOTE + RFE + ROC AUC"
                icon={<TimelineRoundedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatTile
                label="Runtime"
                value="Notebook"
                subtitle="Reproducible charts"
                icon={<RocketLaunchRoundedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatTile
                label="Dashboard"
                value="FastAPI + React"
                subtitle="Training + results"
                icon={<StorageRoundedIcon />}
              />
            </Grid>
          </Grid>

          <SectionCard title={content.title} subtitle={content.intro}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
              {content.pipeline.map((step, index) => (
                <Chip key={index} label={`${index + 1}. ${step}`} variant="outlined" />
              ))}
            </Stack>
          </SectionCard>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Quick Start: Notebook" subtitle="Run the reproduction notebook.">
                <Box sx={codeBlockStyles} component="pre">
                  {content.quickstart.notebook.join("\n")}
                </Box>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Quick Start: Backend" subtitle="Launch the API server.">
                <Box sx={codeBlockStyles} component="pre">
                  {content.quickstart.backend.join("\n")}
                </Box>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Quick Start: Frontend" subtitle="Launch the UI.">
                <Box sx={codeBlockStyles} component="pre">
                  {content.quickstart.frontend.join("\n")}
                </Box>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Quick Start: Docker" subtitle="One-command deployment.">
                <Box sx={codeBlockStyles} component="pre">
                  {content.quickstart.docker.join("\n")}
                </Box>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Environment Variables" subtitle="Optional configuration.">
                <Stack spacing={1}>
                  {content.env.map((item) => (
                    <Box key={item.name} display="flex" gap={1} alignItems="center">
                      <TerminalRoundedIcon fontSize="small" />
                      <Typography variant="subtitle2">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Troubleshooting" subtitle="Common fixes and tips.">
                <Stack spacing={1}>
                  {content.troubleshooting.map((item, index) => (
                    <Typography variant="body2" color="text.secondary" key={index}>
                      - {item}
                    </Typography>
                  ))}
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Python Libraries" subtitle="Latest downloads.">
                <Stack spacing={1}>
                  {content.libraries.python.map((lib) => (
                    <Box key={lib.name}>
                      <Link href={lib.url} target="_blank" rel="noreferrer" underline="hover">
                        {lib.name}
                      </Link>
                      <Typography variant="body2" color="text.secondary">
                        {lib.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Frontend Libraries" subtitle="Latest downloads.">
                <Stack spacing={1}>
                  {content.libraries.frontend.map((lib) => (
                    <Box key={lib.name}>
                      <Link href={lib.url} target="_blank" rel="noreferrer" underline="hover">
                        {lib.name}
                      </Link>
                      <Typography variant="body2" color="text.secondary">
                        {lib.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
