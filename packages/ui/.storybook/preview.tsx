import type { Preview } from "@storybook/react-vite";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "../src/theme";
import "../src/styles/tailwind.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],

  parameters: {
    layout: "padded",
    a11y: {
      test: "error",
    },
  },
};

export default preview;
