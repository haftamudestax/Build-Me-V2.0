import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Express } from "express";
import type { Pool as PgPool } from "pg";

const validBooking = {
  visitorId: "",
  name: "Integration Test User",
  email: "integration-test@example.com",
  projectTitle: "Integration Test Project",
  projectType: "Web Application",
  description:
    "This is a dedicated integration test booking for the Build Me API.",
  timeline: "1-3 months",
  budget: "$1,000-$5,000",
};

describe("Bookings API — PostgreSQL integration", () => {
  let app: Express;
  let pool: PgPool;
  let visitorId: string | undefined;

  // Track every booking created by this test suite.
  const testBookingIds: string[] = [];

  beforeAll(async () => {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        "TEST_DATABASE_URL is required. Configure a dedicated test database before running integration tests.",
      );
    }

    // The booking service creates its pool when the module is imported.
    // Set DATABASE_URL before importing the service.
    process.env.DATABASE_URL = testDatabaseUrl;

    const [{ default: expressApp }, bookingService] = await Promise.all([
      import("../../../services/api/src/app"),
      import("../../../services/api/src/services/bookings.service"),
    ]);

    app = expressApp;
    pool = bookingService.pool;

    // Fail early if the test database is unavailable or migrations are missing.
    await pool.query("SELECT 1");
    await pool.query("SELECT id FROM visitors LIMIT 0");
    await pool.query("SELECT id FROM bookings LIMIT 0");

    // Create a visitor to satisfy the bookings foreign-key constraint.
    const visitorResult = await pool.query<{ id: string }>(
      "INSERT INTO visitors DEFAULT VALUES RETURNING id",
    );

    visitorId = visitorResult.rows[0]?.id;

    if (!visitorId) {
      throw new Error("Failed to create the integration test visitor.");
    }
  }, 15_000);

  afterAll(async () => {
    if (!pool) {
      return;
    }

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

  it("creates a booking and persists its details in PostgreSQL", async () => {
    const { default: request } = await import("supertest");

    const response = await request(app)
      .post("/api/bookings")
      .send({ ...validBooking, visitorId });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      bookingType: "delivery_project",
      status: "pending",
    });

    const bookingId: string = response.body.data.id;

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
      name: validBooking.name,
      email: validBooking.email,
      project_title: validBooking.projectTitle,
      project_type: validBooking.projectType,
      project_description: validBooking.description,
      timeline: validBooking.timeline,
      budget: validBooking.budget,
    });
  });

  it("retrieves the persisted booking by its ID", async () => {
    const { default: request } = await import("supertest");

    // Create a booking through the public API before retrieving it.
    const createResponse = await request(app)
      .post("/api/bookings")
      .send({ ...validBooking, visitorId });

    expect(createResponse.status).toBe(201);

    const bookingId: string = createResponse.body.data.id;

    // Track it immediately, even if the subsequent GET request fails.
    testBookingIds.push(bookingId);

    const response = await request(app).get(`/api/bookings/${bookingId}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: bookingId,
      bookingType: "delivery_project",
      status: "pending",
    });

    // The lookup endpoint must not expose personal project details.
    expect(response.body.data).not.toHaveProperty("email");
    expect(response.body.data).not.toHaveProperty("name");
    expect(response.body.data).not.toHaveProperty("projectDescription");
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
        ...validBooking,
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

  it("does not insert a booking for a nonexistent visitor", async () => {
    const { default: request } = await import("supertest");

    const nonexistentVisitorId = randomUUID();

    const before = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings",
    );

    const response = await request(app)
      .post("/api/bookings")
      .send({ ...validBooking, visitorId: nonexistentVisitorId });

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
