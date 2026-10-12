import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

export const visitors = pgTable('visitors', {
  id: uuid('id').primaryKey().defaultRandom(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Visitor = typeof visitors.$inferSelect;
export type NewVisitor = typeof visitors.$inferInsert;
