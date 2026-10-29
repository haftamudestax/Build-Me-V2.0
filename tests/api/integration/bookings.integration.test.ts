
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
  budget: "$1,000-$5,000",
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
    preferredFormat: "online",
    timezone: "Africa/Addis_Ababa",
    additionalContext: "Discuss a potential web development project.",
  },
};

type BookingResponse = {
  data: {
    id: string;
    reference: string;
    bookingType: string;
    status: string;
    createdAt?: string;
  };
};

describe("Bookings API — PostgreSQL integration", () => {
  let app: Express;
  let pool: PgPool;
  let visitorId: string | undefined;

  const testBookingIds: string[] = [];

  beforeAll(async () => {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        "TEST_DATABASE_URL is required. Configure a dedicated test database before running integration tests.",
      );
    }

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

    const visitorResult = await pool.query<{ id: string }>(
      "INSERT INTO visitors DEFAULT VALUES RETURNING id",
    );

    const createdVisitorId = visitorResult.rows[0]?.id;

    if (!createdVisitorId) {
      throw new Error("Failed to create the integration test visitor.");
    }

    visitorId = createdVisitorId;
  }, 15_000);

  afterAll(async () => {
    if (!pool) return;

    try {
      if (testBookingIds.length > 0) {
        await pool.query(
          "DELETE FROM bookings WHERE id = ANY($1::uuid[])",
          [testBookingIds],
        );
      }

      if (visitorId) {
        await pool.query("DELETE FROM visitors WHERE id = $1", [visitorId]);
      }
    } finally {
      await pool.end();
    }
  }, 15_000);

  it("creates a Delivery Project booking and persists its details", async () => {
    const { default: request } = await import("supertest");

    const response = (await request(app)
      .post("/api/bookings")
      .send({ ...deliveryBooking, visitorId })) as {
      status: number;
      body: BookingResponse & { error?: string };
    };

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      bookingType: "delivery_project",
      status: "pending",
    });

    const bookingId = response.body.data.id;

    expect(bookingId).toEqual(expect.any(String));
    expect(response.body.data.reference).toBe(bookingId);

    testBookingIds.push(bookingId);

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
         budget
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
    });
  });

  it("creates a Coffee With Me booking and persists its meeting details", async () => {
    const { default: request } = await import("supertest");

    const response = (await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", `coffee-${randomUUID()}`)
      .send({ ...coffeeMeeting, visitorId })) as {
      status: number;
      body: BookingResponse & { error?: string };
    };

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      bookingType: "coffee_with_me",
      status: "pending",
    });

    const bookingId = response.body.data.id;

    expect(bookingId).toEqual(expect.any(String));
    expect(response.body.data.reference).toBe(bookingId);

    testBookingIds.push(bookingId);

    const result = await pool.query<{
      id: string;
      visitor_id: string;
      booking_type: string;
      status: string;
      name: string;
      email: string;
      request_details: {
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
      request_details: coffeeMeeting.requestDetails,
    });

    expect(new Date(saved.meeting_start_at).toISOString()).toBe(
      coffeeMeeting.meetingStartAt,
    );
  });

  it("returns the saved booking by ID without exposing personal details", async () => {
    const { default: request } = await import("supertest");

    const createResponse = await request(app)
      .post("/api/bookings")
      .send({ ...deliveryBooking, visitorId });

    expect(createResponse.status).toBe(201);

    const bookingId = createResponse.body.data.id as string;
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

  it("returns the same booking for an identical idempotent retry", async () => {
    const { default: request } = await import("supertest");
    const idempotencyKey = `coffee-${randomUUID()}`;
    const payload = { ...coffeeMeeting, visitorId };

    const firstResponse = await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    expect(firstResponse.status).toBe(201);

    const bookingId = firstResponse.body.data.id as string;
    testBookingIds.push(bookingId);

    const retryResponse = await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    expect(retryResponse.status).toBe(201);
    expect(retryResponse.body.data.id).toBe(bookingId);

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM bookings
       WHERE visitor_id = $1 AND idempotency_key = $2`,
      [visitorId, idempotencyKey],
    );

    expect(count.rows[0].count).toBe("1");
  });

  it("rejects reuse of an idempotency key for a different request", async () => {
    const { default: request } = await import("supertest");
    const idempotencyKey = `coffee-${randomUUID()}`;

    const firstResponse = await request(app)
      .post("/api/bookings")
      .set("Idempotency-Key", idempotencyKey)
      .send({ ...coffeeMeeting, visitorId });

    expect(firstResponse.status).toBe(201);
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
      .send({ ...deliveryBooking, visitorId, email: "not-an-email" });

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
      .send({ ...deliveryBooking, visitorId: randomUUID() });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("visitor does not exist");

    const after = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings",
    );

    expect(after.rows[0].count).toBe(before.rows[0].count);
  });

  it("returns 404 when a valid booking ID does not exist", async () => {
    const { default: request } = await import("supertest");

    const response = await request(app).get(`/api/bookings/${randomUUID()}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Booking not found.");
  });
});
