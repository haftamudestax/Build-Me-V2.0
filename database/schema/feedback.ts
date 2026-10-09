import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { visitors } from './visitors';

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),

  visitorId: uuid('visitor_id')
    .notNull()
    .references(() => visitors.id, { onDelete: 'cascade' }),

  rating: integer('rating'), // e.g. 1-5 star rating, nullable if only NPS given
  npsScore: integer('nps_score'), // 0-10, nullable if only star rating given
  complaint: text('complaint'),
  suggestion: text('suggestion'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
