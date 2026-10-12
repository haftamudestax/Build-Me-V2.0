import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { visitors } from './visitors';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),

  visitorId: uuid('visitor_id')
    .notNull()
    .references(() => visitors.id, { onDelete: 'cascade' }),

  leadType: varchar('lead_type', { length: 50 }).notNull(), // e.g. 'contact_form', 'demo_request'
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),

  status: varchar('status', { length: 20 }).notNull().default('new'), // 'new' | 'contacted' | 'qualified' | 'closed'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
