import { pgTable, uuid, varchar, numeric } from 'drizzle-orm/pg-core';

export const productKpis = pgTable('product_kpis', {
  id: uuid('id').primaryKey().defaultRandom(),

  metric: varchar('metric', { length: 100 }).notNull(),
  value: numeric('value', { precision: 14, scale: 4 }).notNull(),
  period: varchar('period', { length: 50 }).notNull(),
});

export type ProductKpi = typeof productKpis.$inferSelect;
export type NewProductKpi = typeof productKpis.$inferInsert;
