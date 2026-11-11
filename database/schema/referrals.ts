import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { visitors } from "./visitors";

export const REFERRAL_RELATIONSHIPS = [
  "friend",
  "family",
  "colleague",
] as const;

export type ReferralRelationship =
  (typeof REFERRAL_RELATIONSHIPS)[number];

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),

    referrerName: varchar("referrer_name", { length: 120 }).notNull(),
    referrerEmail: varchar("referrer_email", { length: 254 }).notNull(),

    referredName: varchar("referred_name", { length: 120 }).notNull(),
    referredEmail: varchar("referred_email", { length: 254 }).notNull(),

    relationship: varchar("relationship", { length: 20 })
      .$type<ReferralRelationship>()
      .notNull(),

    message: text("message"),

    status: varchar("status", { length: 20 })
      .notNull()
      .default("pending"),

    idempotencyKey: varchar("idempotency_key", { length: 128 }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("referrals_visitor_id_idempotency_key_uidx").on(
      table.visitorId,
      table.idempotencyKey,
    ),
    index("referrals_status_idx").on(table.status),
    index("referrals_created_at_idx").on(table.createdAt),
  ],
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;