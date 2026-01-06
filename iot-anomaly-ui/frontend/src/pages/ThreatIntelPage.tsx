import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
} from "@mui/material";

import SectionCard from "../components/SectionCard";
import StatTile from "../components/StatTile";
import type { CVESimilarity, BlueTeamBriefing, DatasetInfo } from "../lib/types";
import { getCVESimilarity, getBlueTeamBriefing } from "../lib/api";

type ThreatIntelPageProps = {
  dataset: DatasetInfo | null;
  mapping: Record<string, string>;
};

export default function ThreatIntelPage({ dataset, mapping }: ThreatIntelPageProps) {
  const [cveMatches, setCveMatches] = useState<CVESimilarity[]>([]);
  const [briefing, setBriefing] = useState<BlueTeamBriefing | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!dataset) return;
    setLoading(true);
    try {
      const [matches, report] = await Promise.all([
        getCVESimilarity(dataset.dataset_id),
        getBlueTeamBriefing(dataset.dataset_id, mapping),
      ]);
      setCveMatches(matches);
      setBriefing(report);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [dataset, mapping]);

  return (
    <Box className="fade-in">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Threat Intel & Blue Team Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Similarity to known CVEs plus defensive playbooks.
          </Typography>
        </Box>
        <Button variant="contained" onClick={refresh} disabled={!dataset || loading}>
          Refresh Analysis
        </Button>
      </Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {!dataset && (
        <Typography variant="body2" color="text.secondary">
          Load a dataset to activate the assistant.
        </Typography>
      )}

      {dataset && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <StatTile label="Risk Score" value={briefing ? briefing.risk_score : "-"} subtitle="0-100" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatTile label="Severity" value={briefing ? briefing.severity : "-"} subtitle="Derived" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatTile label="CVE Matches" value={cveMatches.length} subtitle="Top similarity" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatTile label="Dataset" value={dataset.name} subtitle="Active" />
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard title="Blue Team Findings" subtitle="Key observations from telemetry and incidents.">
              {briefing?.findings?.length ? (
                <List dense>
                  {briefing.findings.map((finding, index) => (
                    <ListItem key={index} divider>
                      <ListItemText primary={finding} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No findings yet.
                </Typography>
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard title="CVE Similarity" subtitle="Potential alignment with known vulnerabilities.">
              {cveMatches.length ? (
                <List dense>
                  {cveMatches.slice(0, 6).map((match, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={match.keyphrase || match.text.slice(0, 80)}
                        secondary={`score: ${match.score.toFixed(3)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No CVE matches available.
                </Typography>
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard title="Response Playbook" subtitle="Recommended actions for blue team response.">
              {briefing?.response_playbook?.length ? (
                <List dense>
                  {briefing.response_playbook.map((step, index) => (
                    <ListItem key={index} divider>
                      <ListItemText primary={step} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No playbook generated yet.
                </Typography>
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard title="Defensive Controls" subtitle="Prioritized control recommendations.">
              {briefing?.defensive_controls?.length ? (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {briefing.defensive_controls.map((control, index) => (
                    <Chip key={index} label={control} variant="outlined" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No controls listed yet.
                </Typography>
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard title="Blue Team Tooling" subtitle="Suggested tools for detection and defense.">
              {briefing?.blue_team_tools?.length ? (
                <List dense>
                  {briefing.blue_team_tools.map((tool, index) => (
                    <ListItem key={index} divider>
                      <ListItemText primary={tool} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No tooling suggestions yet.
                </Typography>
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12}>
            <SectionCard title="Attack & Defense Scenarios" subtitle="How to act under realistic threat conditions.">
              {briefing?.scenarios?.length ? (
                <Grid container spacing={2}>
                  {briefing.scenarios.map((scenario, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Box
                        sx={{
                          borderRadius: 3,
                          border: "1px solid rgba(15, 118, 110, 0.2)",
                          p: 2,
                          background: "rgba(15, 118, 110, 0.04)",
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {scenario.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {scenario.description}
                        </Typography>
                        <List dense>
                          {scenario.actions.map((action, actionIndex) => (
                            <ListItem key={actionIndex} divider>
                              <ListItemText primary={action} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No scenarios generated yet.
                </Typography>
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12}>
            <SectionCard title="White Team Oversight" subtitle="Governance checks for incident response.">
              {briefing?.white_team_checks?.length ? (
                <List dense>
                  {briefing.white_team_checks.map((check, index) => (
                    <ListItem key={index} divider>
                      <ListItemText primary={check} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No white team checks yet.
                </Typography>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
