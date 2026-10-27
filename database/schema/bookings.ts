
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  jsonb,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { visitors } from "./visitors";

/**
 * Supported booking journeys.
 */
export const BOOKING_TYPES = [
  "delivery_project",
  "mentor_me",
  "coffee_with_me",
] as const;

export type BookingType = (typeof BOOKING_TYPES)[number];

/**
 * Mentoring request details stored in bookings.request_details.
 */
export type MentorMeRequestDetails = {
  mentoringTopic: string;
  goals: string;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "other";
  preferredFormat: "online" | "in_person";
  additionalContext?: string;
};

/**
 * Coffee meeting details stored in bookings.request_details.
 */
export type CoffeeWithMeRequestDetails = {
  preferredFormat: "online" | "in_person";
  timezone: string;
  additionalContext?: string;
};

/**
 * Delivery project details stored in bookings.request_details when needed.
 */
export type DeliveryProjectRequestDetails = {
  additionalContext?: string;
};

/**
 * Flexible JSON payload for booking-specific details.
 * Runtime validation must be performed by the API before insertion.
 */
export type BookingRequestDetails =
  | MentorMeRequestDetails
  | CoffeeWithMeRequestDetails
  | DeliveryProjectRequestDetails
  | Record<string, unknown>;

export const COFFEE_MEETING_DURATION_MINUTES = 30;

/**
 * Shared booking table for all Work With Me journeys.
 */
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),

    // delivery_project | mentor_me | coffee_with_me
    bookingType: varchar("booking_type", { length: 50 })
      .$type<BookingType>()
      .notNull(),

    status: varchar("status", { length: 20 })
      .notNull()
      .default("pending"),

    /**
     * A stable client-generated key reused for retries of the same request.
     * Nullable for compatibility with existing bookings.
     */
    idempotencyKey: varchar("idempotency_key", { length: 128 }),

    /**
     * Journey-specific details:
     * - mentor_me: topic, goals, experience level, format, context
     * - coffee_with_me: format, timezone, context
     * - delivery_project: any additional project-specific details
     */
    requestDetails: jsonb("request_details")
      .$type<BookingRequestDetails>()
      .notNull()
      .default({}),

    // Shared customer information
    name: varchar("name", { length: 120 }),
    email: varchar("email", { length: 254 }),

    // Deliver My Project fields
    projectTitle: varchar("project_title", { length: 160 }),
    projectType: varchar("project_type", { length: 80 }),
    projectDescription: text("project_description"),
    timeline: varchar("timeline", { length: 80 }),
    budget: varchar("budget", { length: 120 }),

    // Coffee With Me scheduling
    // The API should normalize meeting instants to UTC.
    meetingStartAt: timestamp("meeting_start_at", {
      withTimezone: true,
    }),

    meetingDurationMinutes: integer("meeting_duration_minutes"),

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
    uniqueIndex("bookings_visitor_id_idempotency_key_uidx").on(
      table.visitorId,
      table.idempotencyKey,
    ),

    index("bookings_booking_type_idx").on(table.bookingType),

    index("bookings_meeting_start_at_idx").on(table.meetingStartAt),
  ],
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
