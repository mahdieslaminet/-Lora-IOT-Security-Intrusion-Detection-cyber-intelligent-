import { Box, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
  subtitle?: string;
};

export default function StatTile({ label, value, icon, accent, subtitle }: StatTileProps) {
  const theme = useTheme();
  const borderColor = accent ?? (theme.palette.mode === "light" ? "rgba(15, 118, 110, 0.25)" : "rgba(94, 234, 212, 0.3)");
  const background = theme.palette.mode === "light"
    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 238, 223, 0.6))"
    : "linear-gradient(135deg, rgba(16, 24, 32, 0.9), rgba(12, 19, 25, 0.7))";

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1px solid ${borderColor}`,
        background,
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {icon && (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: borderColor,
          }}
        >
          {icon}
        </Box>
      )}
    </Box>
  );
}
