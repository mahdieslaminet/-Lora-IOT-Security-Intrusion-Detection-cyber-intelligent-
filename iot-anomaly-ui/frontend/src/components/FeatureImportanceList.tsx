import { List, ListItem, ListItemText, Typography } from "@mui/material";

type FeatureImportance = {
  feature: string;
  score?: number;
  rank?: number;
};

type FeatureImportanceListProps = {
  items: FeatureImportance[];
};

export default function FeatureImportanceList({ items }: FeatureImportanceListProps) {
  if (!items?.length) {
    return <Typography variant="body2">No feature importance data available.</Typography>;
  }

  return (
    <List dense>
      {items.slice(0, 12).map((item) => (
        <ListItem key={item.feature} divider>
          <ListItemText
            primary={item.feature}
            secondary={
              item.score !== undefined
                ? `score: ${item.score.toFixed(4)}`
                : item.rank !== undefined
                ? `rank: ${item.rank}`
                : ""
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
