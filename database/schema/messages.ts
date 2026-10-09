import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { conversations } from './conversations';


export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),

  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),

  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'

  content: text('content').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
