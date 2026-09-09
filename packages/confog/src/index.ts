export const config = {
  apiUrl: import.meta.env?.VITE_API_URL ?? "http://localhost:4000",
};

export { createFeatureFlags, envFlag } from "./features";
export type { FeatureFlags, FeatureFlagKey } from "./features";