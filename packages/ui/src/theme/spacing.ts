export const SPACING_UNIT = 8; // px — the single source of truth

// MUI consumes this as a multiplier function: theme.spacing(2) === 16px
export const spacing = SPACING_UNIT;

// Named scale for direct use (e.g. in Tailwind config, or CSS vars)
export const spacingScale = {
  xs: `${SPACING_UNIT * 0.5}px`,  // 4px
  sm: `${SPACING_UNIT * 1}px`,    // 8px
  md: `${SPACING_UNIT * 2}px`,    // 16px
  lg: `${SPACING_UNIT * 3}px`,    // 24px
  xl: `${SPACING_UNIT * 4}px`,    // 32px
  "2xl": `${SPACING_UNIT * 6}px`, // 48px
  "3xl": `${SPACING_UNIT * 8}px`, // 64px
};