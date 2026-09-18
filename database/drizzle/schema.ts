import { pgTable, serial, text, timestamp,integer } from "drizzle-orm/pg-core";

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const funFacts = pgTable("fun_facts", {
  id: serial("id").primaryKey(),
  icon: text("icon").notNull(),
  text: text("text").notNull(),
  position: integer("position").notNull(),
});
