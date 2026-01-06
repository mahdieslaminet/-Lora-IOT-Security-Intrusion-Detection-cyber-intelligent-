import { Box, Typography } from "@mui/material";

type ConfusionMatrixProps = {
  matrix: number[][];
};

export default function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  if (!matrix?.length) {
    return <Typography variant="body2">No confusion matrix available.</Typography>;
  }

  return (
    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
      {matrix.flat().map((value, index) => (
        <Box
          key={index}
          sx={{
            padding: 2,
            borderRadius: 2,
            background: "rgba(15, 118, 110, 0.08)",
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {index === 0 ? "TN" : index === 1 ? "FP" : index === 2 ? "FN" : "TP"}
          </Typography>
          <Typography variant="h6">{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}
