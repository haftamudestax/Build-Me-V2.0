
import { isDeepStrictEqual } from "node:util";
import { Pool } from "pg";
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

const BOOKING_COLUMNS = `
  id,
  booking_type,
  status,
  created_at
`;

function toCreatedBooking(row: BookingRow): CreatedBooking {
  return {
    id: row.id,
    bookingType: row.booking_type,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createProjectBooking(
  input: CreateBookingInput,
): Promise<CreatedBooking> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const visitor = await client.query(
      "SELECT id FROM visitors WHERE id = $1 LIMIT 1",
      [input.visitorId],
    );

    if (visitor.rowCount === 0) {
      throw new Error("VISITOR_NOT_FOUND");
    }

    // Return the original booking for an identical retry.
    if (input.idempotencyKey) {
      const existing = await client.query<BookingRow>(
        `SELECT ${BOOKING_COLUMNS}
         FROM bookings
         WHERE visitor_id = $1
           AND idempotency_key = $2
         LIMIT 1
         FOR UPDATE`,
        [input.visitorId, input.idempotencyKey],
      );

      const existingBooking = existing.rows[0];

      if (existingBooking) {
        const existingDetails = await client.query<{
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
        }>(
          `SELECT
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
           FROM bookings
           WHERE id = $1`,
          [existingBooking.id],
        );

        const saved = existingDetails.rows[0];

        if (!saved) {
          throw new Error("BOOKING_LOOKUP_FAILED");
        }

        const savedMeetingTime = saved.meeting_start_at
          ? new Date(saved.meeting_start_at).toISOString()
          : null;

        const inputMeetingTime = input.meetingStartAt
          ? new Date(input.meetingStartAt).toISOString()
          : null;

        const sameRequest =
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
          savedMeetingTime === inputMeetingTime &&
          saved.meeting_duration_minutes ===
            (input.meetingDurationMinutes ?? null);

        if (!sameRequest) {
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        }

        await client.query("COMMIT");
        return toCreatedBooking(existingBooking);
      }
    }

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

    // Handle concurrent requests using the same idempotency key.
    if (!booking && input.idempotencyKey) {
      const existing = await client.query<BookingRow>(
        `SELECT ${BOOKING_COLUMNS}
         FROM bookings
         WHERE visitor_id = $1
           AND idempotency_key = $2
         LIMIT 1`,
        [input.visitorId, input.idempotencyKey],
      );

      booking = existing.rows[0];

      if (!booking) {
        throw new Error("BOOKING_CREATION_FAILED");
      }

      const saved = await client.query<{
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
      }>(
        `SELECT
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
         FROM bookings
         WHERE id = $1`,
        [booking.id],
      );

      const row = saved.rows[0];

      if (!row) {
        throw new Error("BOOKING_LOOKUP_FAILED");
      }

      const savedMeetingTime = row.meeting_start_at
        ? new Date(row.meeting_start_at).toISOString()
        : null;

      const inputMeetingTime = input.meetingStartAt
        ? new Date(input.meetingStartAt).toISOString()
        : null;

      const sameRequest =
        row.booking_type === input.bookingType &&
        row.name === input.name &&
        row.email === input.email &&
        row.project_title === (input.projectTitle ?? null) &&
        row.project_type === (input.projectType ?? null) &&
        row.project_description === (input.description ?? null) &&
        row.timeline === (input.timeline ?? null) &&
        row.budget === (input.budget ?? null) &&
        isDeepStrictEqual(
          row.request_details ?? {},
          input.requestDetails ?? {},
        ) &&
        savedMeetingTime === inputMeetingTime &&
        row.meeting_duration_minutes ===
          (input.meetingDurationMinutes ?? null);

      if (!sameRequest) {
        throw new Error("IDEMPOTENCY_KEY_REUSED");
      }
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
      // Preserve the original error.
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function getProjectBookingById(id: string) {
  const result = await pool.query<BookingRow>(
    `SELECT ${BOOKING_COLUMNS}
     FROM bookings
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return result.rows[0] ?? null;
}
