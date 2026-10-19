export type FeatureFlagKey =
  | "navbar"
  | "heroSection"
  | "home"
  | "service"
  | "contact"
  | "blog"
  | "footer"
  | "contactForm"
  | "bookings"
  | "leadsAdmin"
  | "analyticsDashboard"
  

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

const DEFAULTS: FeatureFlags = {
  navbar: false,
  heroSection: true,
  home: false,
  service: false,
  contact: false,
  blog: false,
  footer: false,    
  contactForm: false,
  bookings: false,
  leadsAdmin: false,
  analyticsDashboard: false,
};

export function envFlag(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value === "true" || value === "1";
}

export function createFeatureFlags(
  overrides: Partial<FeatureFlags> = {},
): FeatureFlags {
  const definedOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined),
  ) as Partial<FeatureFlags>;

  return { ...DEFAULTS, ...definedOverrides };
}