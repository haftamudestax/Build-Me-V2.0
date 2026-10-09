import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { visitors } from './visitors';

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),

  visitorId: uuid('visitor_id')
    .notNull()
    .references(() => visitors.id, { onDelete: 'cascade' }),

  bookingType: varchar('booking_type', { length: 50 }).notNull(), // e.g. 'demo', 'consultation'
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'confirmed' | 'cancelled' | 'completed'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
