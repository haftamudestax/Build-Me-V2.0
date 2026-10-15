import { createTheme } from "@mui/material/styles";
import { palette } from "./palette";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { breakpoints } from "./breakpoints";

export const theme = createTheme({
  palette,
  typography,
  spacing,
  breakpoints,
  shape: {
    borderRadius: 8,
  },
});