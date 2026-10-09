import { pgTable, uuid, numeric, varchar, timestamp } from 'drizzle-orm/pg-core';
import { visitors } from './visitors';

export const auditResults = pgTable('audit_results', {
  id: uuid('id').primaryKey().defaultRandom(),

  visitorId: uuid('visitor_id')
    .notNull()
    .references(() => visitors.id, { onDelete: 'cascade' }),

  score: numeric('score', { precision: 10, scale: 4 }).notNull(),
  result: varchar('result', { length: 100 }).notNull(), // e.g. 'pass', 'fail', 'needs_review'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AuditResult = typeof auditResults.$inferSelect;
export type NewAuditResult = typeof auditResults.$inferInsert;
