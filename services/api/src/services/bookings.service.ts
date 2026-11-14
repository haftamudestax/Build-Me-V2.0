
import { isDeepStrictEqual } from "node:util";
import { Pool, type PoolClient } from "pg";

import type { CreateBookingInput } from "../validators/bookings.validator";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be configured for the API.");
}

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  max: 10,
});

export interface CreatedBooking {
  id: string;
  bookingType: string;
  status: string;
  createdAt: Date;
}

interface BookingRow {
  id: string;
  booking_type: string;
  status: string;
  created_at: Date;
}

interface BookingDetailsRow {
  booking_type: string;
  name: string | null;
  email: string | null;
  project_title: string | null;
  project_type: string | null;
  project_description: string | null;
  timeline: string | null;
  budget: string | null;
  request_details: unknown;
  meeting_start_at: Date | null;
  meeting_duration_minutes: number | null;
}

const BOOKING_COLUMNS = `
  id,
  booking_type,
  status,
  created_at
`;

const BOOKING_DETAILS_COLUMNS = `
  booking_type,
  name,
  email,
  project_title,
  project_type,
  project_description,
  timeline,
  budget,
  request_details,
  meeting_start_at,
  meeting_duration_minutes
`;

function toCreatedBooking(row: BookingRow): CreatedBooking {
  return {
    id: row.id,
    bookingType: row.booking_type,
    status: row.status,
    createdAt: row.created_at,
  };
}

function normalizeMeetingTime(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

/**
 * Loads the complete booking details needed to verify an idempotent retry.
 */
async function getBookingDetails(
  client: PoolClient,
  bookingId: string,
): Promise<BookingDetailsRow> {
  const result = await client.query<BookingDetailsRow>(
    `SELECT ${BOOKING_DETAILS_COLUMNS}
     FROM bookings
     WHERE id = $1
     LIMIT 1`,
    [bookingId],
  );

  const booking = result.rows[0];

  if (!booking) {
    throw new Error("BOOKING_LOOKUP_FAILED");
  }

  return booking;
}

/**
 * Checks whether a saved booking represents the same request.
 *
 * request_details includes the selected package. Comparing the complete
 * object ensures that a retry with a different package is rejected.
 */
function isSameBookingRequest(
  saved: BookingDetailsRow,
  input: CreateBookingInput,
): boolean {
  return (
    saved.booking_type === input.bookingType &&
    saved.name === input.name &&
    saved.email === input.email &&
    saved.project_title === (input.projectTitle ?? null) &&
    saved.project_type === (input.projectType ?? null) &&
    saved.project_description === (input.description ?? null) &&
    saved.timeline === (input.timeline ?? null) &&
    saved.budget === (input.budget ?? null) &&
    isDeepStrictEqual(
      saved.request_details ?? {},
      input.requestDetails ?? {},
    ) &&
    normalizeMeetingTime(saved.meeting_start_at) ===
      normalizeMeetingTime(input.meetingStartAt) &&
    saved.meeting_duration_minutes ===
      (input.meetingDurationMinutes ?? null)
  );
}

/**
 * Retrieves an existing booking for an idempotency key and verifies
 * that the incoming request is identical to the original request.
 */
async function getExistingIdempotentBooking(
  client: PoolClient,
  visitorId: string,
  idempotencyKey: string,
): Promise<BookingRow | null> {
  const result = await client.query<BookingRow>(
    `SELECT ${BOOKING_COLUMNS}
     FROM bookings
     WHERE visitor_id = $1
       AND idempotency_key = $2
     LIMIT 1
     FOR UPDATE`,
    [visitorId, idempotencyKey],
  );

  return result.rows[0] ?? null;
}

async function verifyIdempotentBooking(
  client: PoolClient,
  booking: BookingRow,
  input: CreateBookingInput,
): Promise<void> {
  const saved = await getBookingDetails(client, booking.id);

  if (!isSameBookingRequest(saved, input)) {
    throw new Error("IDEMPOTENCY_KEY_REUSED");
  }
}

export async function createProjectBooking(
  input: CreateBookingInput,
): Promise<CreatedBooking> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Ensure the visitor exists before creating a booking.
    const visitor = await client.query(
      `SELECT id
       FROM visitors
       WHERE id = $1
       LIMIT 1`,
      [input.visitorId],
    );

    if (visitor.rowCount === 0) {
      throw new Error("VISITOR_NOT_FOUND");
    }

    // Handle an identical retry before attempting a new insert.
    if (input.idempotencyKey) {
      const existingBooking = await getExistingIdempotentBooking(
        client,
        input.visitorId,
        input.idempotencyKey,
      );

      if (existingBooking) {
        await verifyIdempotentBooking(client, existingBooking, input);

        await client.query("COMMIT");

        return toCreatedBooking(existingBooking);
      }
    }

    // Create the booking. Package information is stored inside
    // request_details as part of the validated requestDetails object.
    const result = await client.query<BookingRow>(
      `INSERT INTO bookings (
         visitor_id,
         booking_type,
         status,
         idempotency_key,
         name,
         email,
         project_title,
         project_type,
         project_description,
         timeline,
         budget,
         request_details,
         meeting_start_at,
         meeting_duration_minutes
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12, $13, $14
       )
       ON CONFLICT (visitor_id, idempotency_key)
       DO NOTHING
       RETURNING ${BOOKING_COLUMNS}`,
      [
        input.visitorId,
        input.bookingType,
        "pending",
        input.idempotencyKey ?? null,
        input.name,
        input.email,
        input.projectTitle ?? null,
        input.projectType ?? null,
        input.description ?? null,
        input.timeline ?? null,
        input.budget ?? null,
        JSON.stringify(input.requestDetails ?? {}),
        input.meetingStartAt ?? null,
        input.meetingDurationMinutes ?? null,
      ],
    );

    let booking = result.rows[0];

    // Another request may have inserted the same idempotency key
    // while this transaction was attempting its insert.
    if (!booking && input.idempotencyKey) {
      const existingBooking = await getExistingIdempotentBooking(
      client,
      input.visitorId,
      input.idempotencyKey,
    );

    if (!existingBooking) {
      throw new Error("BOOKING_CREATION_FAILED");
    }
    booking = existingBooking;

      // A concurrent retry is only valid when every submitted field,
      // including the selected package, matches the original booking.
      await verifyIdempotentBooking(client, booking, input);
    }

    if (!booking) {
      throw new Error("BOOKING_CREATION_FAILED");
    }

    await client.query("COMMIT");

    return toCreatedBooking(booking);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original error if rollback also fails.
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function getProjectBookingById(
  id: string,
): Promise<BookingRow | null> {
  const result = await pool.query<BookingRow>(
    `SELECT ${BOOKING_COLUMNS}
     FROM bookings
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return result.rows[0] ?? null;
}
