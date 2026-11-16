
import { pool } from "./bookings.service";

/**
 * Invoice item returned from the database.
 */
export interface InvoiceItemRecord {
  id: string;
  invoice_id: string;
  description: string;
  package_tier: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  created_at: Date;
}

/**
 * Invoice record returned from the database.
 */
export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  booking_id: string;
  customer_name: string;
  customer_email: string;
  currency: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  email_status: "not_sent" | "sent" | "failed";
  issued_at: Date;
  due_at: Date | null;
  paid_at: Date | null;
  email_sent_at: Date | null;
  email_error: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Complete invoice information, including its line items.
 *
 * Intended for internal invoice processing and email generation.

 */
export interface InvoiceWithItems {
  invoice: InvoiceRecord;
  items: InvoiceItemRecord[];
}

/**
 * Retrieves an invoice and its line items using the associated
 * booking ID.
 *
 * Returns null when no invoice exists for the booking.
 */
export async function getInvoiceByBookingId(
  bookingId: string,
): Promise<InvoiceWithItems | null> {
  const invoiceResult = await pool.query<InvoiceRecord>(
    `SELECT
       id,
       invoice_number,
       booking_id,
       customer_name,
       customer_email,
       currency,
       subtotal_cents,
       tax_cents,
       total_cents,
       status,
       email_status,
       issued_at,
       due_at,
       paid_at,
       email_sent_at,
       email_error,
       created_at,
       updated_at
     FROM invoices
     WHERE booking_id = $1
     LIMIT 1`,
    [bookingId],
  );

  const invoice = invoiceResult.rows[0];

  if (!invoice) {
    return null;
  }

  const itemsResult = await pool.query<InvoiceItemRecord>(
    `SELECT
       id,
       invoice_id,
       description,
       package_tier,
       quantity,
       unit_price_cents,
       line_total_cents,
       created_at
     FROM invoice_items
     WHERE invoice_id = $1
     ORDER BY created_at ASC, id ASC`,
    [invoice.id],
  );

  return {
    invoice,
    items: itemsResult.rows,
  };
}

/**
 * Marks an invoice email as successfully sent.
 *
 */
export async function markInvoiceEmailSent(
  invoiceId: string,
): Promise<InvoiceRecord> {
  const result = await pool.query<InvoiceRecord>(
    `UPDATE invoices
     SET
       email_status = 'sent',
       email_sent_at = NOW(),
       email_error = NULL,
       updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       invoice_number,
       booking_id,
       customer_name,
       customer_email,
       currency,
       subtotal_cents,
       tax_cents,
       total_cents,
       status,
       email_status,
       issued_at,
       due_at,
       paid_at,
       email_sent_at,
       email_error,
       created_at,
       updated_at`,
    [invoiceId],
  );

  const invoice = result.rows[0];

  if (!invoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  return invoice;
}

/**
 * Records an invoice email delivery failure.
 *
 * The error is truncated to avoid storing excessively large
 * provider responses in the database.
 *
 * An invoice already marked as sent is never downgraded to failed.
 * The invoice payment status remains unchanged.
 */
export async function markInvoiceEmailFailed(
  invoiceId: string,
  error: unknown,
): Promise<InvoiceRecord> {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown invoice email delivery error.";

  const safeErrorMessage = errorMessage.slice(0, 2000);

  const result = await pool.query<InvoiceRecord>(
    `UPDATE invoices
     SET
       email_status = 'failed',
       email_error = $2,
       updated_at = NOW()
     WHERE id = $1
       AND email_status <> 'sent'
     RETURNING
       id,
       invoice_number,
       booking_id,
       customer_name,
       customer_email,
       currency,
       subtotal_cents,
       tax_cents,
       total_cents,
       status,
       email_status,
       issued_at,
       due_at,
       paid_at,
       email_sent_at,
       email_error,
       created_at,
       updated_at`,
    [invoiceId, safeErrorMessage],
  );

  const invoice = result.rows[0];

  if (invoice) {
    return invoice;
  }

  // Distinguish an already-sent invoice from a nonexistent invoice.
  const existingResult = await pool.query<InvoiceRecord>(
    `SELECT
       id,
       invoice_number,
       booking_id,
       customer_name,
       customer_email,
       currency,
       subtotal_cents,
       tax_cents,
       total_cents,
       status,
       email_status,
       issued_at,
       due_at,
       paid_at,
       email_sent_at,
       email_error,
       created_at,
       updated_at
     FROM invoices
     WHERE id = $1
     LIMIT 1`,
    [invoiceId],
  );

  const existingInvoice = existingResult.rows[0];

  if (!existingInvoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  return existingInvoice;
}
