import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { visitors } from './visitors';
import { sessions } from './sessions';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),

  visitorId: uuid('visitor_id')
    .notNull()
    .references(() => visitors.id, { onDelete: 'cascade' }),

  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),

  eventName: varchar('event_name', { length: 100 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // e.g. 'page_view', 'click', 'feature_use'
  feature: varchar('feature', { length: 100 }), // which product feature this relates to, if any
  journey: varchar('journey', { length: 100 }), // which user journey/funnel step, if any

  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata').notNull().default({}),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
