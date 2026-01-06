import { Drawer, Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme } from "@mui/material";
import { NavLink } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DatasetRoundedIcon from "@mui/icons-material/DatasetRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import ShieldMoonRoundedIcon from "@mui/icons-material/ShieldMoonRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: <DashboardRoundedIcon /> },
  { label: "Dataset", path: "/dataset", icon: <DatasetRoundedIcon /> },
  { label: "Training", path: "/training", icon: <AutoGraphRoundedIcon /> },
  { label: "Results", path: "/results", icon: <LeaderboardRoundedIcon /> },
  { label: "Threat Intel", path: "/intel", icon: <ShieldMoonRoundedIcon /> },
  { label: "Assistant", path: "/assistant", icon: <ChatBubbleRoundedIcon /> },
  { label: "Tutorial", path: "/tutorial", icon: <MenuBookRoundedIcon /> },
  { label: "Related Papers", path: "/papers", icon: <LibraryBooksRoundedIcon /> },
];

type SideNavProps = {
  open: boolean;
  onClose: () => void;
  variant: "permanent" | "temporary";
  width?: number;
};

export default function SideNav({ open, onClose, variant, width = 240 }: SideNavProps) {
  const theme = useTheme();
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width,
          borderRight: "1px solid rgba(15, 118, 110, 0.12)",
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(180deg, rgba(255, 250, 242, 0.95), rgba(244, 233, 212, 0.85))"
              : "linear-gradient(180deg, rgba(10, 18, 24, 0.95), rgba(12, 21, 27, 0.85))",
          backdropFilter: "blur(18px)",
        },
      }}
    >
      <Box display="flex" flexDirection="column" height="100%" px={2} py={3}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          IoT Anomaly Lab
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
          Reproducing Vigoya et al. (2021)
        </Typography>
        <List disablePadding sx={{ flexGrow: 1 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                borderRadius: 2,
                mb: 1,
                "&.active": {
                  background:
                    theme.palette.mode === "light"
                      ? "rgba(15, 118, 110, 0.15)"
                      : "rgba(94, 234, 212, 0.12)",
                  color: theme.palette.primary.main,
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Status: online
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
