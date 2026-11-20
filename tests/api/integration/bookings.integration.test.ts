
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import type { Pool as PgPool } from "pg";

const deliveryBooking = {
  visitorId: "",
  bookingType: "delivery_project",
  name: "Integration Test User",
  email: "integration-test@example.com",
  projectTitle: "Integration Test Project",
  projectType: "Web Application",
  description:
    "This is a dedicated integration test booking for the Build Me API.",
  timeline: "1-3 months",
  budget: "1000_5000",
  requestDetails: {
    package: {
      tier: "beginner",
    },
  },
};

const coffeeMeeting = {
  visitorId: "",
  bookingType: "coffee_with_me",
  name: "Coffee Integration User",
  email: "coffee-integration@example.com",
  meetingStartAt: new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString(),
  meetingDurationMinutes: 30,
  requestDetails: {
    package: {
      tier: "beginner",
    },
    preferredFormat: "online",
    timezone: "Africa/Addis_Ababa",
    additionalContext: "Discuss a potential web development project.",
  },
};

type InvoiceEmailStatus = "not_sent" | "sent" | "failed";

type InvoiceSummary = {
  invoiceNumber: string;
  totalCents: number;
  currency: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  emailStatus: InvoiceEmailStatus;
};

type BookingResponse = {
  data: {
    id: string;
    reference: string;
    bookingType: string;
    status: string;
    createdAt?: string;
    invoice: InvoiceSummary | null;
    invoiceEmailStatus: InvoiceEmailStatus;
  };
  error?: string;
};

type InvoiceExpectation = {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  description: string;
  packageTier: string;
  amountCents: number;
};

describe("Bookings API — PostgreSQL integration", () => {
  let app: Express;
  let pool: PgPool;
  let visitorId: string | undefined;

  const testBookingIds: string[] = [];

  let originalResendEnvironment: {
    apiKey: string | undefined;
    fromEmail: string | undefined;
    replyTo: string | undefined;
  };

  beforeAll(async () => {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        "TEST_DATABASE_URL is required. Configure a dedicated test database before running integration tests.",
      );
    }

    // Preserve the original email configuration.
    originalResendEnvironment = {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
      replyTo: process.env.RESEND_REPLY_TO,
    };

    // Integration tests must not send real invoice emails.
    // Empty strings ensure isInvoiceEmailConfigured() returns false.
    process.env.RESEND_API_KEY = "";
    process.env.RESEND_FROM_EMAIL = "";
    process.env.RESEND_REPLY_TO = "";

    // Set the dedicated test database before importing the booking service.
    process.env.DATABASE_URL = testDatabaseUrl;

    const [{ default: expressApp }, bookingService] = await Promise.all([
      import("../../../services/api/src/app"),
      import("../../../services/api/src/services/bookings.service"),
    ]);

    app = expressApp;
    pool = bookingService.pool;

    await pool.query("SELECT 1");
    await pool.query("SELECT id FROM visitors LIMIT 0");
    await pool.query("SELECT id FROM bookings LIMIT 0");
    await pool.query("SELECT id FROM invoices LIMIT 0");
    await pool.query("SELECT id FROM invoice_items LIMIT 0");
    await pool.query("SELECT id FROM payments LIMIT 0");

    const visitorResult = await pool.query<{ id: string }>(
      "INSERT INTO visitors DEFAULT VALUES RETURNING id",
    );

    const createdVisitorId = visitorResult.rows[0]?.id;

    if (!createdVisitorId) {
      throw new Error("Failed to create the integration test visitor.");
    }

    visitorId = createdVisitorId;
  }, 15_000);

  /**
   * Verifies the invoice summary returned by the booking API.
   */
  function expectInvoiceResponse(
    data: BookingResponse["data"],
    amountCents: number,
  ): void {
    expect(data.invoice).not.toBeNull();

    expect(data.invoice).toMatchObject({
      totalCents: amountCents,
      currency: "USD",
      status: "pending",
      emailStatus: "not_sent",
    });

    expect(data.invoice?.invoiceNumber).toMatch(/^INV-\d{8}-/);
    expect(data.invoiceEmailStatus).toBe("not_sent");
  }

  /**
   * Verifies that a booking has exactly one pending invoice,
   * exactly one invoice item, and no payment records.
   */
  async function expectPendingInvoice(
    expectation: InvoiceExpectation,
  ): Promise<void> {
    const invoiceResult = await pool.query<{
      id: string;
      invoice_number: string;
      booking_id: string;
      customer_name: string;
      customer_email: string;
      currency: string;
      subtotal_cents: number;
      tax_cents: number;
      total_cents: number;
      status: string;
      email_status: string;
    }>(
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
         email_status
       FROM invoices
       WHERE booking_id = $1`,
      [expectation.bookingId],
    );

    // One booking must produce exactly one invoice.
    expect(invoiceResult.rowCount).toBe(1);

    const invoice = invoiceResult.rows[0];

    expect(invoice).toMatchObject({
      booking_id: expectation.bookingId,
      customer_name: expectation.customerName,
      customer_email: expectation.customerEmail,
      currency: "USD",
      subtotal_cents: expectation.amountCents,
      tax_cents: 0,
      total_cents: expectation.amountCents,
      status: "pending",
      email_status: "not_sent",
    });

    expect(invoice.id).toEqual(expect.any(String));
    expect(invoice.invoice_number).toMatch(/^INV-\d{8}-/);

    const itemResult = await pool.query<{
      id: string;
      invoice_id: string;
      description: string;
      package_tier: string;
      quantity: number;
      unit_price_cents: number;
      line_total_cents: number;
    }>(
      `SELECT
         id,
         invoice_id,
         description,
         package_tier,
         quantity,
         unit_price_cents,
         line_total_cents
       FROM invoice_items
       WHERE invoice_id = $1`,
      [invoice.id],
    );

    // Each selected package currently produces one invoice line.
    expect(itemResult.rowCount).toBe(1);

    expect(itemResult.rows[0]).toMatchObject({
      invoice_id: invoice.id,
      description: expectation.description,
      package_tier: expectation.packageTier,
      quantity: 1,
      unit_price_cents: expectation.amountCents,
      line_total_cents: expectation.amountCents,
    });

    // Creating an invoice must not imply that payment was received.
    const paymentResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM payments
       WHERE invoice_id = $1`,
      [invoice.id],
    );

    expect(paymentResult.rows[0].count).toBe("0");
  }

  afterAll(async () => {
    try {
      if (pool) {
        if (testBookingIds.length > 0) {
          // Payments reference invoices, so delete them first.
          await pool.query(
            `DELETE FROM payments
             WHERE invoice_id IN (
               SELECT id
               FROM invoices
               WHERE booking_id = ANY($1::uuid[])
             )`,
            [testBookingIds],
          );

          // Invoice items reference invoices.
          await pool.query(
            `DELETE FROM invoice_items
             WHERE invoice_id IN (
               SELECT id
               FROM invoices
               WHERE booking_id = ANY($1::uuid[])
             )`,
            [testBookingIds],
          );

          // Invoices reference bookings with ON DELETE RESTRICT.
          await pool.query(
            `DELETE FROM invoices
             WHERE booking_id = ANY($1::uuid[])`,
            [testBookingIds],
          );

          // Bookings can now be deleted safely.
          await pool.query(
            `DELETE FROM bookings
             WHERE id = ANY($1::uuid[])`,
            [testBookingIds],
          );
        }

        if (visitorId) {
          await pool.query("DELETE FROM visitors WHERE id = $1", [
            visitorId,
          ]);
        }

        await pool.end();
      }
    } finally {
      // Restore the original Resend configuration.
      if (originalResendEnvironment) {
        if (originalResendEnvironment.apiKey === undefined) {
          delete process.env.RESEND_API_KEY;
        } else {
          process.env.RESEND_API_KEY =
            originalResendEnvironment.apiKey;
        }

        if (originalResendEnvironment.fromEmail === undefined) {
          delete process.env.RESEND_FROM_EMAIL;
        } else {
          process.env.RESEND_FROM_EMAIL =
            originalResendEnvironment.fromEmail;
        }

        if (originalResendEnvironment.replyTo === undefined) {
          delete process.env.RESEND_REPLY_TO;
        } else {
          process.env.RESEND_REPLY_TO =
            originalResendEnvironment.replyTo;
        }
      }
    }
  }, 15_000);

  it("creates a Delivery Project booking and persists its details", async () => {
    const { default: request } = await import("supertest");

    const response = (await request(app)
      .post("/api/bookings")
      .send({ ...deliveryBooking, visitorId })) as {
      status: number;
      body: BookingResponse;
    };

    expect(response.status, response.body.error).toBe(201);

    expect(response.body.data).toMatchObject({
      bookingType: "delivery_project",
      status: "pending",
    });

    const bookingId = response.body.data.id;

    expect(bookingId).toEqual(expect.any(String));
    expect(response.body.data.reference).toBe(bookingId);

    testBookingIds.push(bookingId);

    expectInvoiceResponse(response.body.data, 149900);

    const result = await pool.query<{
      id: string;
      visitor_id: string;
      booking_type: string;
      status: string;
      name: string;
      email: string;
      project_title: string;
      project_type: string;
      project_description: string;
      timeline: string;
      budget: string | null;
      request_details: {
        package: {
          tier: string;
          name: string;
          price: number;
          currency: string;
        };
      };
    }>(
      `SELECT
         id,
         visitor_id,
         booking_type,
         status,
         name,
         email,
         project_title,
         project_type,
         project_description,
         timeline,
         budget,
         request_details
       FROM bookings
       WHERE id = $1`,
      [bookingId],
    );

    expect(result.rowCount).toBe(1);

    expect(result.rows[0]).toMatchObject({
      id: bookingId,
      visitor_id: visitorId,
      booking_type: "delivery_project",
      status: "pending",
      name: deliveryBooking.name,
      email: deliveryBooking.email,
      project_title: deliveryBooking.projectTitle,
      project_type: deliveryBooking.projectType,
      project_description: deliveryBooking.description,
      timeline: deliveryBooking.timeline,
      budget: deliveryBooking.budget,
      request_details: {
        package: {
          tier: "beginner",
          name: "Starter MVP",
          price: 1499,
          currency: "USD",
        },
      },
    });

    // Verify invoice creation and its financial state.
    await expectPendingInvoice({
      bookingId,
      customerName: deliveryBooking.name,
      customerEmail: deliveryBooking.email,
      description: "Starter MVP",
      packageTier: "beginner",
      amountCents: 149900,
    });
  });

  it("creates a Coffee With Me booking and persists its meeting details", async () => {
    const { default: request } = await import("supertest");

    const response = (await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", `coffee-${randomUUID()}`)
      .send({ ...coffeeMeeting, visitorId })) as {
      status: number;
      body: BookingResponse;
    };

    expect(response.status, response.body.error).toBe(201);

    expect(response.body.data).toMatchObject({
      bookingType: "coffee_with_me",
      status: "pending",
    });

    const bookingId = response.body.data.id;

    expect(bookingId).toEqual(expect.any(String));
    expect(response.body.data.reference).toBe(bookingId);

    testBookingIds.push(bookingId);

    expectInvoiceResponse(response.body.data, 5000);

    const result = await pool.query<{
      id: string;
      visitor_id: string;
      booking_type: string;
      status: string;
      name: string;
      email: string;
      request_details: {
        package: {
          tier: string;
          name: string;
          price: number;
          currency: string;
        };
        preferredFormat: string;
        timezone: string;
        additionalContext?: string;
      };
      meeting_start_at: Date;
      meeting_duration_minutes: number;
    }>(
      `SELECT
         id,
         visitor_id,
         booking_type,
         status,
         name,
         email,
         request_details,
         meeting_start_at,
         meeting_duration_minutes
       FROM bookings
       WHERE id = $1`,
      [bookingId],
    );

    expect(result.rowCount).toBe(1);

    const saved = result.rows[0];

    expect(saved).toMatchObject({
      id: bookingId,
      visitor_id: visitorId,
      booking_type: "coffee_with_me",
      status: "pending",
      name: coffeeMeeting.name,
      email: coffeeMeeting.email,
      meeting_duration_minutes: 30,
      request_details: {
        package: {
          tier: "beginner",
          name: "Quick Catch-up",
          price: 50,
          currency: "USD",
        },
        preferredFormat: "online",
        timezone: "Africa/Addis_Ababa",
        additionalContext:
          "Discuss a potential web development project.",
      },
    });

    expect(new Date(saved.meeting_start_at).toISOString()).toBe(
      coffeeMeeting.meetingStartAt,
    );

    await expectPendingInvoice({
      bookingId,
      customerName: coffeeMeeting.name,
      customerEmail: coffeeMeeting.email,
      description: "Quick Catch-up",
      packageTier: "beginner",
      amountCents: 5000,
    });
  });

  it("returns the saved booking by ID without exposing personal details", async () => {
    const { default: request } = await import("supertest");

    const createResponse = (await request(app)
      .post("/api/bookings")
      .send({ ...deliveryBooking, visitorId })) as {
      status: number;
      body: BookingResponse;
    };

    expect(createResponse.status, createResponse.body.error).toBe(201);

    const bookingId = createResponse.body.data.id;
    testBookingIds.push(bookingId);

    const response = await request(app).get(`/api/bookings/${bookingId}`);

    expect(response.status).toBe(200);

    expect(response.body.data).toMatchObject({
      id: bookingId,
      bookingType: "delivery_project",
      status: "pending",
    });

    expect(response.body.data).not.toHaveProperty("email");
    expect(response.body.data).not.toHaveProperty("name");
    expect(response.body.data).not.toHaveProperty("projectDescription");
  });

  it("returns the same booking for an identical idempotent retry without duplicating its invoice", async () => {
    const { default: request } = await import("supertest");

    const idempotencyKey = `coffee-${randomUUID()}`;
    const payload = { ...coffeeMeeting, visitorId };

    const firstResponse = (await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", idempotencyKey)
      .send(payload)) as {
      status: number;
      body: BookingResponse;
    };

    expect(firstResponse.status, firstResponse.body.error).toBe(201);

    const bookingId = firstResponse.body.data.id;
    testBookingIds.push(bookingId);

    expectInvoiceResponse(firstResponse.body.data, 5000);

    const retryResponse = (await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", idempotencyKey)
      .send(payload)) as {
      status: number;
      body: BookingResponse;
    };

    expect(retryResponse.status, retryResponse.body.error).toBe(201);
    expect(retryResponse.body.data.id).toBe(bookingId);

    // The retry must return the same invoice details.
    expect(retryResponse.body.data.invoice).toEqual(
      firstResponse.body.data.invoice,
    );
    expect(retryResponse.body.data.invoiceEmailStatus).toBe("not_sent");

    const bookingCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM bookings
       WHERE visitor_id = $1 AND idempotency_key = $2`,
      [visitorId, idempotencyKey],
    );

    expect(bookingCount.rows[0].count).toBe("1");

    // An identical retry must reuse the original invoice.
    await expectPendingInvoice({
      bookingId,
      customerName: coffeeMeeting.name,
      customerEmail: coffeeMeeting.email,
      description: "Quick Catch-up",
      packageTier: "beginner",
      amountCents: 5000,
    });
  });

  it("rejects reuse of an idempotency key for a different request", async () => {
    const { default: request } = await import("supertest");

    const idempotencyKey = `coffee-${randomUUID()}`;

    const firstResponse = await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", idempotencyKey)
      .send({ ...coffeeMeeting, visitorId });

    expect(firstResponse.status, firstResponse.body.error).toBe(201);

    testBookingIds.push(firstResponse.body.data.id);

    const conflictingResponse = await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", idempotencyKey)
      .send({
        ...coffeeMeeting,
        visitorId,
        requestDetails: {
          ...coffeeMeeting.requestDetails,
          preferredFormat: "in_person",
        },
      });

    expect(conflictingResponse.status).toBe(409);
    expect(conflictingResponse.body.error).toContain("idempotency key");
  });

  it("does not insert a booking when request validation fails", async () => {
    const { default: request } = await import("supertest");

    const before = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings WHERE visitor_id = $1",
      [visitorId],
    );

    const response = await request(app)
      .post("/api/bookings")
      .send({
        ...deliveryBooking,
        visitorId,
        email: "not-an-email",
      });

    expect(response.status).toBe(400);

    const after = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings WHERE visitor_id = $1",
      [visitorId],
    );

    expect(after.rows[0].count).toBe(before.rows[0].count);
  });

  it("rejects invalid Coffee With Me meeting data without inserting", async () => {
    const { default: request } = await import("supertest");

    const before = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings WHERE visitor_id = $1",
      [visitorId],
    );

    const response = await request(app)
      .post("/api/bookings")
      .send({
        ...coffeeMeeting,
        visitorId,
        meetingDurationMinutes: 60,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("30 minutes");

    const after = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings WHERE visitor_id = $1",
      [visitorId],
    );

    expect(after.rows[0].count).toBe(before.rows[0].count);
  });

  it("rejects a booking for a nonexistent visitor", async () => {
    const { default: request } = await import("supertest");

    const before = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings",
    );

    const response = await request(app)
      .post("/api/bookings")
      .send({
        ...deliveryBooking,
        visitorId: randomUUID(),
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("visitor does not exist");

    const after = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings",
    );

    expect(after.rows[0].count).toBe(before.rows[0].count);
  });

  it("returns 404 when a valid booking ID does not exist", async () => {
    const { default: request } = await import("supertest");

    const response = await request(app).get(
      `/api/bookings/${randomUUID()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Booking not found.");
  });
});
