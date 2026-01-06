import { createTheme } from "@mui/material/styles";

export const buildTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#0F766E" : "#5EEAD4"
      },
      secondary: {
        main: mode === "light" ? "#F97316" : "#FDBA74"
      },
      background: {
        default: mode === "light" ? "#f5f1ea" : "#0b1115",
        paper: mode === "light" ? "#fffaf2" : "#121a20"
      }
    },
    typography: {
      fontFamily: '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif',
      h4: {
        fontWeight: 600,
        letterSpacing: "-0.02em"
      },
      h6: {
        fontWeight: 600
      },
      button: {
        textTransform: "none",
        fontWeight: 600
      }
    },
    shape: {
      borderRadius: 16
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12
          }
        }
      }
    }
  });
