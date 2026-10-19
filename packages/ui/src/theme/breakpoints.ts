
export const breakpointValues = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  large: 1440,
} as const;

/**
 * MUI uses xs, sm, md, lg, and xl internally.
 * These values map the team's responsive vocabulary
 * to MUI's breakpoint system.
 */
export const breakpoints = {
  values: {
    xs: breakpointValues.mobile,
    sm: breakpointValues.tablet,
    md: breakpointValues.desktop,
    lg: breakpointValues.large,
    xl: breakpointValues.large + 320,
  },
} as const;
