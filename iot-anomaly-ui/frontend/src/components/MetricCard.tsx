import { Card, CardContent, Typography, useTheme } from "@mui/material";

type MetricCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
};

export default function MetricCard({ label, value, subtitle }: MetricCardProps) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        borderRadius: 3,
        border:
          theme.palette.mode === "light"
            ? "1px solid rgba(15, 118, 110, 0.15)"
            : "1px solid rgba(94, 234, 212, 0.16)",
        background:
          theme.palette.mode === "light"
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(15, 23, 42, 0.65)",
      }}
    >
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
