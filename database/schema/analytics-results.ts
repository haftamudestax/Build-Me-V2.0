import { pgTable, uuid, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';

export const analyticsResults = pgTable('analytics_results', {
  id: uuid('id').primaryKey().defaultRandom(),

  metric: varchar('metric', { length: 100 }).notNull(), // e.g. 'conversion_rate', 'avg_session_duration'
  value: numeric('value', { precision: 14, scale: 4 }).notNull(),
  period: varchar('period', { length: 50 }).notNull(), // e.g. '2026-09', '2026-W38'

  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AnalyticsResult = typeof analyticsResults.$inferSelect;
export type NewAnalyticsResult = typeof analyticsResults.$inferInsert;
