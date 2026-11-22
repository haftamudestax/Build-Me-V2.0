import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { visitors } from "./visitors";

export const TALK_TO_US_STATUSES = [
  "submitted",
  "reviewed",
  "resolved",
] as const;

export type TalkToUsStatus = (typeof TALK_TO_US_STATUSES)[number];

export const TALK_TO_US_EMAIL_STATUSES = [
  "pending",
  "sent",
  "failed",
] as const;

export type TalkToUsEmailStatus =
  (typeof TALK_TO_US_EMAIL_STATUSES)[number];

export const talkToUsMessages = pgTable(
  "talk_to_us_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, {
        onDelete: "cascade",
      }),

    /** Shown to the visitor as their confirmation, for example TTU-K7M2PX. */
    reference: varchar("reference", { length: 20 }).notNull().unique(),

    name: varchar("name", { length: 120 }).notNull(),

    email: varchar("email", { length: 254 }).notNull(),

    message: text("message").notNull(),

    source: varchar("source", { length: 50 }).notNull().default("website"),

    /** Your follow-up state for this message. */
    status: varchar("status", { length: 20 })
      .$type<TalkToUsStatus>()
      .notNull()
      .default("submitted"),

    /** Whether the notification email to the owner went out. */
    emailStatus: varchar("email_status", { length: 20 })
      .$type<TalkToUsEmailStatus>()
      .notNull()
      .default("pending"),

    emailError: text("email_error"),

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
    uniqueIndex("talk_to_us_messages_visitor_id_idempotency_key_uidx").on(
      table.visitorId,
      table.idempotencyKey,
    ),

    index("talk_to_us_messages_visitor_id_created_at_idx").on(
      table.visitorId,
      table.createdAt,
    ),

    index("talk_to_us_messages_status_idx").on(table.status),

    index("talk_to_us_messages_created_at_idx").on(table.createdAt),

    check(
      "talk_to_us_messages_status_check",
      sql`${table.status} IN (
        'submitted',
        'reviewed',
        'resolved'
      )`,
    ),

    check(
      "talk_to_us_messages_email_status_check",
      sql`${table.emailStatus} IN (
        'pending',
        'sent',
        'failed'
      )`,
    ),

    check(
      "talk_to_us_messages_message_length_check",
      sql`char_length(${table.message}) BETWEEN 10 AND 1000`,
    ),
  ],
);

export type TalkToUsMessage = typeof talkToUsMessages.$inferSelect;

export type NewTalkToUsMessage = typeof talkToUsMessages.$inferInsert;