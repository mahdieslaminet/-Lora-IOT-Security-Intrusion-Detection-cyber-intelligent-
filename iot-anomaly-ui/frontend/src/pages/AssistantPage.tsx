import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";

import SectionCard from "../components/SectionCard";
import StatTile from "../components/StatTile";
import { sendChat } from "../lib/api";
import type { ChatMessage, DatasetInfo, TrainingStatus } from "../lib/types";

const SUGGESTED_PROMPTS = [
  "Summarize the anomaly patterns you see.",
  "Which defenses should be prioritized based on the ML results?",
  "What scenario best fits these incidents, and how should blue team respond?",
  "Explain the top risk drivers and how to reduce them.",
];

type AssistantPageProps = {
  dataset: DatasetInfo | null;
  mapping: Record<string, string>;
  trainingStatus: TrainingStatus | null;
};

export default function AssistantPage({ dataset, mapping, trainingStatus }: AssistantPageProps) {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeCve, setIncludeCve] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const bestModel = useMemo(() => {
    const leaderboard = trainingStatus?.results?.leaderboard ?? [];
    if (!leaderboard.length) return null;
    return [...leaderboard].sort((a, b) => (b.f1_mean ?? 0) - (a.f1_mean ?? 0))[0];
  }, [trainingStatus]);

  const handleSend = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await sendChat({
        dataset_id: dataset?.dataset_id ?? null,
        mapping,
        job_id: trainingStatus?.job_id,
        messages: nextMessages,
        include_cve: includeCve,
      });
      setMessages([...nextMessages, { role: "assistant", content: response.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const userBubble = theme.palette.mode === "light" ? "rgba(15, 118, 110, 0.18)" : "rgba(94, 234, 212, 0.2)";
  const assistantBubble =
    theme.palette.mode === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(18, 26, 32, 0.8)";

  return (
    <Box className="fade-in">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Gemini Blue-Team Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ask for security analysis grounded in the ML pipeline, CVE similarity, and dataset context.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={<Switch checked={includeCve} onChange={(event) => setIncludeCve(event.target.checked)} />}
            label="Include CVE context"
          />
          <Button variant="outlined" onClick={() => setMessages([])} disabled={loading}>
            New Chat
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <StatTile
            label="Dataset"
            value={dataset ? dataset.name : "Not loaded"}
            subtitle={dataset ? "Context active" : "Upload or load a dataset"}
            icon={<AutoAwesomeRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatTile
            label="Training"
            value={trainingStatus ? trainingStatus.status : "Idle"}
            subtitle={trainingStatus ? "Latest job" : "Run training to enrich context"}
            icon={<PsychologyRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatTile
            label="Best Model"
            value={bestModel ? bestModel.model : "-"}
            subtitle={bestModel ? `F1: ${bestModel.f1_mean.toFixed(3)}` : "No results yet"}
            icon={<ChatBubbleRoundedIcon />}
          />
        </Grid>
      </Grid>

      <SectionCard title="Conversation" subtitle="The assistant adapts to your dataset and training results.">
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!dataset && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Load a dataset to activate the full context. You can still ask general security questions.
          </Alert>
        )}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            maxHeight: 420,
            overflowY: "auto",
            pr: 1,
          }}
        >
          {!messages.length && (
            <Typography variant="body2" color="text.secondary">
              Ask a question to begin. The assistant will ground answers in your dataset and model results.
            </Typography>
          )}
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <Box
                key={`${message.role}-${index}`}
                display="flex"
                justifyContent={isUser ? "flex-end" : "flex-start"}
              >
                <Box
                  sx={{
                    maxWidth: "78%",
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(15, 118, 110, 0.2)",
                    background: isUser ? userBubble : assistantBubble,
                    boxShadow:
                      theme.palette.mode === "light"
                        ? "0 12px 30px rgba(15, 23, 42, 0.08)"
                        : "0 12px 30px rgba(2, 6, 23, 0.4)",
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {message.content}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          {loading && (
            <Typography variant="caption" color="text.secondary">
              Assistant is thinking...
            </Typography>
          )}
          <div ref={bottomRef} />
        </Box>

        <Box mt={3}>
          <Typography variant="caption" color="text.secondary">
            Suggested prompts
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Chip
                key={prompt}
                label={prompt}
                variant="outlined"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        <Box mt={3} display="flex" gap={2} flexDirection={{ xs: "column", md: "row" }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about anomalies, defenses, or response scenarios..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend(input);
              }
            }}
          />
          <Button
            variant="contained"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            sx={{ minWidth: 140 }}
          >
            Send
          </Button>
        </Box>
      </SectionCard>
    </Box>
  );
}
