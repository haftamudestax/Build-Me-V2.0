
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { visitors } from './visitors';

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),

  visitorId: uuid('visitor_id')
    .notNull()
    .references(() => visitors.id, { onDelete: 'cascade' }),

  // Booking classification
  bookingType: varchar('booking_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 })
    .notNull()
    .default('pending'),

  // Customer information
  name: varchar('name', { length: 120 }),
  email: varchar('email', { length: 254 }),

  // Project information for "Deliver My Project"
  projectTitle: varchar('project_title', { length: 160 }),
  projectType: varchar('project_type', { length: 80 }),
  projectDescription: text('project_description'),
  timeline: varchar('timeline', { length: 80 }),
  budget: varchar('budget', { length: 120 }),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
