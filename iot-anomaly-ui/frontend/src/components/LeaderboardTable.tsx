import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import type { LeaderboardRow } from "../lib/types";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
};

export default function LeaderboardTable({ rows }: LeaderboardTableProps) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Model</TableCell>
            <TableCell>Accuracy</TableCell>
            <TableCell>Precision</TableCell>
            <TableCell>Recall</TableCell>
            <TableCell>F1</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row.model}
              sx={{
                background: index === 0 ? "rgba(15, 118, 110, 0.08)" : "transparent",
              }}
            >
              <TableCell>
                <Chip label={row.model} color="primary" variant="outlined" />
              </TableCell>
              <TableCell>{row.accuracy_mean.toFixed(3)} ± {row.accuracy_std.toFixed(3)}</TableCell>
              <TableCell>{row.precision_mean.toFixed(3)} ± {row.precision_std.toFixed(3)}</TableCell>
              <TableCell>{row.recall_mean.toFixed(3)} ± {row.recall_std.toFixed(3)}</TableCell>
              <TableCell>{row.f1_mean.toFixed(3)} ± {row.f1_std.toFixed(3)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
