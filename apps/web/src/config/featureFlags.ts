import { createFeatureFlags, envFlag } from "@build-me/config";

export const featureFlags = createFeatureFlags({
  navbar: envFlag(import.meta.env.VITE_FEATURE_NAVBAR),
  heroSection: envFlag(import.meta.env.VITE_FEATURE_HERO_SECTION),
  footer: envFlag(import.meta.env.VITE_FEATURE_FOOTER),

  contactForm: envFlag(import.meta.env.VITE_FEATURE_CONTACT_FORM),
  bookings: envFlag(import.meta.env.VITE_FEATURE_BOOKINGS),
  leadsAdmin: envFlag(import.meta.env.VITE_FEATURE_LEADS_ADMIN),
  analyticsDashboard: envFlag(
    import.meta.env.VITE_FEATURE_ANALYTICS_DASHBOARD,
  ),
  blog: envFlag(import.meta.env.VITE_FEATURE_BLOG),
});