
import type { ThemeOptions } from "@mui/material/styles";

const fontFamily = [
  '"Inter"',
  "system-ui",
  "-apple-system",
  "sans-serif",
].join(", ");

export const typography = {
  fontFamily,

  // Headings
  h1: { fontFamily, fontSize: "2.5rem", fontWeight: 700, lineHeight: 1.2 },
  h2: { fontFamily, fontSize: "2rem", fontWeight: 700, lineHeight: 1.25 },
  h3: { fontFamily, fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.3 },
  h4: { fontFamily, fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.35 },
  h5: { fontFamily, fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.4 },
  h6: { fontFamily, fontSize: "1rem", fontWeight: 600, lineHeight: 1.4 },

  // Body
  body1: { fontFamily, fontSize: "1rem", fontWeight: 400, lineHeight: 1.5 },
  body2: { fontFamily, fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 },

  // Captions and overlines
  caption: { fontFamily, fontSize: "0.75rem", fontWeight: 500, lineHeight: 1.4 },
  overline: {
    fontFamily,
    fontSize: "0.6875rem",
    fontWeight: 600,
    lineHeight: 1.4,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  // Font weights
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
} satisfies NonNullable<ThemeOptions["typography"]>;
