import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }), // 1:1 with users

  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
