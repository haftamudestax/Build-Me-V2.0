export const REFERRAL_RELATIONSHIPS = [
  "friend",
  "family",
  "colleague",
] as const;

export type ReferralRelationship =
  (typeof REFERRAL_RELATIONSHIPS)[number];