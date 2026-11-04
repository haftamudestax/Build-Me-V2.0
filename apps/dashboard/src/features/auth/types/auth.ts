
export const APP_ROLES = [
  "user",
  "moderator",
  "admin",
  "super_admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface AppUserProfile {
  id: string;
  email: string;
  role: AppRole;
}
