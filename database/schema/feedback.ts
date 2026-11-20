
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { visitors } from "./visitors";

export const FEEDBACK_TYPES = [
  "nps",
  "rating",
  "issue",
  "suggestion",
  "complaint",
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_CATEGORIES = [
  "business",
  "platforms",
  "partners",
] as const;

export type FeedbackCategory =
  (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = [
  "submitted",
  "reviewed",
  "resolved",
] as const;

export type FeedbackStatus =
  (typeof FEEDBACK_STATUSES)[number];

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, {
        onDelete: "cascade",
      }),

    type: varchar("type", { length: 20 })
      .$type<FeedbackType>()
      .notNull(),

    name: varchar("name", { length: 120 }),

    email: varchar("email", { length: 254 }),

    category: varchar("category", { length: 20 })
      .$type<FeedbackCategory>(),

    rating: integer("rating"),


    npsScore: integer("nps_score"),

    comments: text("comments"),

    status: varchar("status", { length: 20 })
      .$type<FeedbackStatus>()
      .notNull()
      .default("submitted"),

    idempotencyKey: varchar("idempotency_key", {
      length: 128,
    }),

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
    uniqueIndex("feedback_visitor_id_idempotency_key_uidx").on(
      table.visitorId,
      table.idempotencyKey,
    ),

    index("feedback_type_idx").on(table.type),

    index("feedback_status_idx").on(table.status),

    index("feedback_created_at_idx").on(table.createdAt),

    index("feedback_visitor_id_idx").on(table.visitorId),

    check(
      "feedback_type_check",
      sql`${table.type} IN (
        'nps',
        'rating',
        'issue',
        'suggestion',
        'complaint'
      )`,
    ),

    check(
      "feedback_category_check",
      sql`${table.category} IS NULL OR ${table.category} IN (
        'business',
        'platforms',
        'partners'
      )`,
    ),

    check(
      "feedback_rating_check",
      sql`${table.rating} IS NULL OR (
        ${table.rating} >= 1 AND ${table.rating} <= 5
      )`,
    ),

    check(
      "feedback_nps_score_check",
      sql`${table.npsScore} IS NULL OR (
        ${table.npsScore} >= 0 AND ${table.npsScore} <= 10
      )`,
    ),

    check(
      "feedback_status_check",
      sql`${table.status} IN (
        'submitted',
        'reviewed',
        'resolved'
      )`,
    ),
  ],
);

export type Feedback = typeof feedback.$inferSelect;

export type NewFeedback = typeof feedback.$inferInsert;
