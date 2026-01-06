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
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";

import SectionCard from "../components/SectionCard";
import StatTile from "../components/StatTile";
import { getRelatedPapers } from "../lib/api";
import type { RelatedPaper } from "../lib/types";

const codeBlockStyles = {
  fontFamily: "'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.85rem",
  padding: "12px 14px",
  background: "rgba(15, 118, 110, 0.08)",
  borderRadius: 12,
  whiteSpace: "pre-wrap" as const,
};

export default function RelatedPapersPage() {
  const [papers, setPapers] = useState<RelatedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRelatedPapers();
        setPapers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load papers");
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
            Related Research
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Papers aligned with IoT security, datasets, and LLM-driven cyber defense.
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <StatTile
            label="References"
            value={papers.length}
            subtitle="Peer-reviewed + arXiv"
            icon={<MenuBookRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatTile
            label="Focus"
            value="IoT + LLM"
            subtitle="Defense + datasets"
            icon={<ScienceRoundedIcon />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {papers.map((paper) => (
          <Grid item xs={12} key={paper.title}>
            <SectionCard title={paper.title} subtitle={paper.summary}>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {paper.tags.map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" />
                ))}
              </Stack>

              <Box sx={{ mb: 2 }}>
                <Link href={paper.link} target="_blank" rel="noreferrer" underline="hover">
                  {paper.link}
                </Link>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    How it works
                  </Typography>
                  <Stack spacing={1}>
                    {paper.how_it_works.map((line, index) => (
                      <Typography variant="body2" color="text.secondary" key={index}>
                        - {line}
                      </Typography>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Tutorial-style code sketch
                  </Typography>
                  <Box sx={codeBlockStyles} component="pre">
                    {paper.code}
                  </Box>
                </Grid>
              </Grid>
            </SectionCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
