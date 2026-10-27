
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),

    email: varchar("email", { length: 255 })
      .notNull()
      .unique(),

    role: varchar("role", { length: 20 })
      .notNull()
      .default("user"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "users_role_allowed_values",
      sql`${table.role} IN ('user', 'moderator', 'admin', 'super_admin')`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
