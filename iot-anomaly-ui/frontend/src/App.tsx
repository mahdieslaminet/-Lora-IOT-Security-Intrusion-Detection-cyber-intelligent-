import { useMemo, useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import { buildTheme } from "./styles/theme";
import DatasetUploadPage from "./pages/DatasetUploadPage";
import TrainingDashboardPage from "./pages/TrainingDashboardPage";
import ResultsPage from "./pages/ResultsPage";
import DashboardPage from "./pages/DashboardPage";
import ThreatIntelPage from "./pages/ThreatIntelPage";
import AssistantPage from "./pages/AssistantPage";
import TutorialPage from "./pages/TutorialPage";
import RelatedPapersPage from "./pages/RelatedPapersPage";
import SideNav from "./components/SideNav";
import type { DatasetInfo, TrainingStatus } from "./lib/types";

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    document.body.dataset.theme = mode;
  }, [mode]);

  const Layout = () => {
    const themeContext = useTheme();
    const isMobile = useMediaQuery(themeContext.breakpoints.down("md"));

    return (
      <Box display="flex" minHeight="100vh">
        <SideNav
          open={!isMobile || navOpen}
          onClose={() => setNavOpen(false)}
          variant={isMobile ? "temporary" : "permanent"}
        />
        <Box flexGrow={1} position="relative">
          {isMobile && (
            <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(12px)" }}>
              <Toolbar sx={{ justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton onClick={() => setNavOpen(true)} aria-label="Open navigation">
                    <MenuRoundedIcon />
                  </IconButton>
                  <Typography variant="h6">IoT Anomaly Lab</Typography>
                </Stack>
                <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
                  {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
              </Toolbar>
            </AppBar>
          )}
          {!isMobile && (
            <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(12px)" }}>
              <Toolbar sx={{ justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">Mission Control</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dataset ? dataset.name : "No dataset loaded"}
                  </Typography>
                </Stack>
                <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
                  {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
              </Toolbar>
            </AppBar>
          )}
          <Container sx={{ py: 4, flexGrow: 1 }}>
            <Routes>
              <Route
                path="/"
                element={<DashboardPage dataset={dataset} mapping={mapping} trainingStatus={trainingStatus} />}
              />
              <Route
                path="/dataset"
                element={
                  <DatasetUploadPage
                    dataset={dataset}
                    mapping={mapping}
                    setDataset={setDataset}
                    setMapping={setMapping}
                  />
                }
              />
              <Route
                path="/training"
                element={
                  <TrainingDashboardPage
                    dataset={dataset}
                    mapping={mapping}
                    setTrainingStatus={setTrainingStatus}
                  />
                }
              />
              <Route path="/results" element={<ResultsPage trainingStatus={trainingStatus} />} />
              <Route path="/intel" element={<ThreatIntelPage dataset={dataset} mapping={mapping} />} />
              <Route
                path="/assistant"
                element={
                  <AssistantPage dataset={dataset} mapping={mapping} trainingStatus={trainingStatus} />
                }
              />
              <Route path="/tutorial" element={<TutorialPage />} />
              <Route path="/papers" element={<RelatedPapersPage />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box minHeight="100vh" position="relative">
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <Box className="orb orb-1" />
          <Box className="orb orb-2" />
          <Box className="orb orb-3" />
        </Box>
        <Box position="relative" zIndex={1}>
          <Layout />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
