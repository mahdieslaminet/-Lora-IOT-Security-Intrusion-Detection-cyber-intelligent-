import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";
import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function SectionCard({ title, subtitle, children }: SectionCardProps) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        backdropFilter: "blur(12px)",
        background:
          theme.palette.mode === "light"
            ? "rgba(255, 250, 242, 0.86)"
            : "rgba(18, 26, 32, 0.86)",
        border:
          theme.palette.mode === "light"
            ? "1px solid rgba(15, 118, 110, 0.12)"
            : "1px solid rgba(94, 234, 212, 0.16)",
        boxShadow:
          theme.palette.mode === "light"
            ? "0 20px 45px rgba(15, 23, 42, 0.08)"
            : "0 20px 45px rgba(2, 6, 23, 0.45)",
      }}
    >
      <CardContent>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
