
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { bookings } from "./bookings";

/**
 * Supported invoice statuses.
 */
export const INVOICE_STATUSES = [
  "pending",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/**
 * Email delivery status is separate from payment status.
 */
export const INVOICE_EMAIL_STATUSES = [
  "not_sent",
  "sent",
  "failed",
] as const;

export type InvoiceEmailStatus =
  (typeof INVOICE_EMAIL_STATUSES)[number];

/**
 * Supported payment statuses.
 */
export const PAYMENT_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];


export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    invoiceNumber: varchar("invoice_number", { length: 50 })
      .notNull(),

    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),

    customerName: varchar("customer_name", { length: 120 })
      .notNull(),

    customerEmail: varchar("customer_email", { length: 254 })
      .notNull(),

    currency: varchar("currency", { length: 3 })
      .notNull()
      .default("USD"),

    subtotalCents: integer("subtotal_cents")
      .notNull(),

    taxCents: integer("tax_cents")
      .notNull()
      .default(0),

    totalCents: integer("total_cents")
      .notNull(),

    status: varchar("status", { length: 20 })
      .$type<InvoiceStatus>()
      .notNull()
      .default("pending"),

    emailStatus: varchar("email_status", { length: 20 })
      .$type<InvoiceEmailStatus>()
      .notNull()
      .default("not_sent"),

    issuedAt: timestamp("issued_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    dueAt: timestamp("due_at", {
      withTimezone: true,
    }),

    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),

    emailSentAt: timestamp("email_sent_at", {
      withTimezone: true,
    }),

    emailError: text("email_error"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("invoices_invoice_number_uidx").on(
      table.invoiceNumber,
    ),

    uniqueIndex("invoices_booking_id_uidx").on(
      table.bookingId,
    ),

    index("invoices_status_idx").on(table.status),

    index("invoices_customer_email_idx").on(
      table.customerEmail,
    ),
  ],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    description: varchar("description", { length: 255 })
      .notNull(),

    packageTier: varchar("package_tier", { length: 30 }),

    quantity: integer("quantity")
      .notNull()
      .default(1),

    unitPriceCents: integer("unit_price_cents")
      .notNull(),

    lineTotalCents: integer("line_total_cents")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("invoice_items_invoice_id_idx").on(
      table.invoiceId,
    ),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),

    amountCents: integer("amount_cents")
      .notNull(),

    currency: varchar("currency", { length: 3 })
      .notNull()
      .default("USD"),

    method: varchar("method", { length: 50 }),

    provider: varchar("provider", { length: 50 }),

    providerReference: varchar("provider_reference", {
      length: 150,
    }),

    status: varchar("status", { length: 20 })
      .$type<PaymentStatus>()
      .notNull()
      .default("pending"),

    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_invoice_id_idx").on(table.invoiceId),

    index("payments_status_idx").on(table.status),

    uniqueIndex("payments_provider_reference_uidx").on(
      table.providerReference,
    ),
  ],
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
