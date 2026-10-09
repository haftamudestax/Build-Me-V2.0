import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),

  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active' | 'archived'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
