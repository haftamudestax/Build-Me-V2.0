import { createResendClient } from "./resendClient";

import {
  getInvoiceByBookingId,
  markInvoiceEmailFailed,
  markInvoiceEmailSent,
  type InvoiceWithItems,
} from "./invoices.service";

export type InvoiceEmailResult =
  | {
      status: "sent";
      invoiceId: string;
      invoiceNumber: string;
      emailId: string;
    }
  | {
      status: "already_sent";
      invoiceId: string;
      invoiceNumber: string;
    };

/**
 * Reads a required environment variable.
 */
function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name}_NOT_CONFIGURED`);
  }

  return value;
}

/**
 * Escapes dynamic values before inserting them into HTML.
 */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] ?? character;
  });
}

/**
 * Formats integer cents using the invoice currency.
 */
function formatMoney(
  amountCents: number,
  currency: string,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

/**
 * Formats an invoice date.
 */
function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

/**
 * Extracts a readable error message from an unknown error.
 */
function getProviderErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Resend could not send the invoice email.";
}

/**
 * Builds the HTML invoice email.
 */
function buildInvoiceEmailHtml(
  data: InvoiceWithItems,
): string {
  const { invoice, items } = data;

  const customerName = escapeHtml(invoice.customer_name);
  const invoiceNumber = escapeHtml(invoice.invoice_number);
  const issuedDate = formatDate(invoice.issued_at);

  const itemRows = items
    .map((item) => {
      const description = escapeHtml(item.description);

      const unitPrice = formatMoney(
        item.unit_price_cents,
        invoice.currency,
      );

      const lineTotal = formatMoney(
        item.line_total_cents,
        invoice.currency,
      );

      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
            ${description}
          </td>

          <td style="padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;">
            ${item.quantity}
          </td>

          <td style="padding:12px;text-align:right;border-bottom:1px solid #e5e7eb;">
            ${unitPrice}
          </td>

          <td style="padding:12px;text-align:right;border-bottom:1px solid #e5e7eb;">
            ${lineTotal}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>Invoice ${invoiceNumber}</title>
      </head>

      <body
        style="
          margin:0;
          padding:24px;
          background-color:#f3f4f6;
          font-family:Arial,Helvetica,sans-serif;
          color:#111827;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            max-width:680px;
            margin:0 auto;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
          "
        >
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:26px;">
                Invoice
              </h1>

              <p style="margin:0;color:#6b7280;">
                Invoice ${invoiceNumber}
              </p>

              <hr
                style="
                  margin:24px 0;
                  border:0;
                  border-top:1px solid #e5e7eb;
                "
              />

              <p style="margin:0 0 12px;">
                Hello ${customerName},
              </p>

              <p
                style="
                  margin:0 0 24px;
                  line-height:1.6;
                  color:#4b5563;
                "
              >
                Thank you for choosing Build Me.
                Your invoice is ready. Please review the details below
                and keep this email for your records.
              </p>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="margin-bottom:24px;"
              >
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">
                    Invoice number
                  </td>

                  <td
                    style="
                      padding:6px 0;
                      text-align:right;
                      font-weight:600;
                    "
                  >
                    ${invoiceNumber}
                  </td>
                </tr>

                <tr>
                  <td style="padding:6px 0;color:#6b7280;">
                    Issue date
                  </td>

                  <td style="padding:6px 0;text-align:right;">
                    ${issuedDate}
                  </td>
                </tr>

                <tr>
                  <td style="padding:6px 0;color:#6b7280;">
                    Payment status
                  </td>

                  <td style="padding:6px 0;text-align:right;">
                    Pending
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 12px;font-size:18px;">
                Invoice details
              </h2>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  border-collapse:collapse;
                  font-size:14px;
                  width:100%;
                "
              >
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:12px;text-align:left;">
                      Description
                    </th>

                    <th style="padding:12px;text-align:center;">
                      Qty
                    </th>

                    <th style="padding:12px;text-align:right;">
                      Unit price
                    </th>

                    <th style="padding:12px;text-align:right;">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="margin-top:20px;"
              >
                <tr>
                  <td style="padding:8px 0;color:#6b7280;">
                    Subtotal
                  </td>

                  <td style="padding:8px 0;text-align:right;">
                    ${formatMoney(
                      invoice.subtotal_cents,
                      invoice.currency,
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 0;color:#6b7280;">
                    Tax
                  </td>

                  <td style="padding:8px 0;text-align:right;">
                    ${formatMoney(
                      invoice.tax_cents,
                      invoice.currency,
                    )}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:16px 0;
                      border-top:1px solid #e5e7eb;
                      font-size:18px;
                      font-weight:700;
                    "
                  >
                    Total due
                  </td>

                  <td
                    style="
                      padding:16px 0;
                      border-top:1px solid #e5e7eb;
                      text-align:right;
                      font-size:18px;
                      font-weight:700;
                    "
                  >
                    ${formatMoney(
                      invoice.total_cents,
                      invoice.currency,
                    )}
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin:24px 0 0;
                  line-height:1.6;
                  color:#4b5563;
                "
              >
                Your invoice is currently pending payment.
                Please contact us if you have questions about this invoice
                or need assistance with payment.
              </p>

              <hr
                style="
                  margin:28px 0;
                  border:0;
                  border-top:1px solid #e5e7eb;
                "
              />

              <p
                style="
                  margin:0;
                  color:#6b7280;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                Thank you for working with Build Me.
                <br />
                This is an automatically generated invoice notification.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Builds the plain-text version of the invoice email.
 */
function buildInvoiceEmailText(
  data: InvoiceWithItems,
): string {
  const { invoice, items } = data;

  const itemLines = items.map((item) =>
    [
      item.description,
      `Quantity: ${item.quantity}`,
      `Unit price: ${formatMoney(
        item.unit_price_cents,
        invoice.currency,
      )}`,
      `Line total: ${formatMoney(
        item.line_total_cents,
        invoice.currency,
      )}`,
    ].join("\n"),
  );

  return [
    `Hello ${invoice.customer_name},`,
    "",
    "Thank you for choosing Build Me.",
    "Your invoice is ready.",
    "",
    `Invoice number: ${invoice.invoice_number}`,
    `Issue date: ${formatDate(invoice.issued_at)}`,
    "Payment status: Pending",
    "",
    "INVOICE DETAILS",
    "",
    ...itemLines,
    "",
    `Subtotal: ${formatMoney(
      invoice.subtotal_cents,
      invoice.currency,
    )}`,
    `Tax: ${formatMoney(
      invoice.tax_cents,
      invoice.currency,
    )}`,
    `Total due: ${formatMoney(
      invoice.total_cents,
      invoice.currency,
    )}`,
    "",
    "Please contact us if you have questions about this invoice.",
    "",
    "Thank you for working with Build Me.",
  ].join("\n");
}

/**
 * Records a failed email attempt and throws a useful error.
 */

async function recordEmailFailure(
  invoiceId: string,
  error: unknown,
): Promise<never> {
  try {
    await markInvoiceEmailFailed(invoiceId, error);
  } catch (statusError) {
    throw new AggregateError(
      [error, statusError],
      "Invoice email failed and its failure status could not be saved.",
      { cause: statusError },
    );
  }

  throw new Error(
    `INVOICE_EMAIL_FAILED: ${getProviderErrorMessage(error)}`,
    { cause: error },
  );
}


/**
 * Sends an invoice email for a booking.
 *
 * Requirements:
 * - Call only after the booking and invoice transaction commits.
 * - Does not resend an invoice already marked as sent.
 * - Allows retrying invoices marked as failed.
 * - Uses a stable Resend idempotency key.
 * - Records email delivery status independently of payment status.
 */
export async function sendInvoiceEmailByBookingId(
  bookingId: string,
): Promise<InvoiceEmailResult> {
  const invoiceData = await getInvoiceByBookingId(bookingId);

  if (!invoiceData) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  const { invoice, items } = invoiceData;

  if (invoice.email_status === "sent") {
    return {
      status: "already_sent",
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
    };
  }

  if (invoice.status !== "pending") {
    throw new Error("INVOICE_NOT_PENDING");
  }

  if (items.length === 0) {
    throw new Error("INVOICE_ITEMS_NOT_FOUND");
  }

  let emailId: string;

  try {
    const apiKey = getRequiredEnv("RESEND_API_KEY");
    const from = getRequiredEnv("RESEND_FROM_EMAIL");
    const replyTo = process.env.RESEND_REPLY_TO?.trim();

    const resend = createResendClient(apiKey);

    const subject = `Invoice ${invoice.invoice_number} - Build Me`;

    const { data, error } = await resend.emails.send(
      {
        from,
        to: [invoice.customer_email],
        ...(replyTo ? { replyTo } : {}),
        subject,
        html: buildInvoiceEmailHtml(invoiceData),
        text: buildInvoiceEmailText(invoiceData),
        tags: [
          {
            name: "type",
            value: "invoice",
          },
        ],
      },
      {
        idempotencyKey: `invoice-email/${invoice.id}`,
      },
    );

    if (error) {
      throw new Error(getProviderErrorMessage(error));
    }

    if (!data?.id) {
      throw new Error("RESEND_EMAIL_ID_MISSING");
    }

    emailId = data.id;
  } catch (error) {
    return recordEmailFailure(invoice.id, error);
  }

  /*
   * Keep the database success update outside the Resend send catch block.
   *
   * Resend may have accepted the email even if this database update fails.
   * In that situation, do not mark the email as failed.
   *
   * A retry uses the same Resend idempotency key.
   */
  let updatedInvoice;

  try {
    updatedInvoice = await markInvoiceEmailSent(invoice.id);
  } catch (error) {
    throw new Error(
      "INVOICE_EMAIL_STATUS_UPDATE_FAILED",
      { cause: error },
    );
  }

  return {
    status: "sent",
    invoiceId: updatedInvoice.id,
    invoiceNumber: updatedInvoice.invoice_number,
    emailId,
  };
}
