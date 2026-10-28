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

    const result = await client.query<BookingRow>(
      `INSERT INTO bookings (
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
        request_details,
        meeting_start_at,
        meeting_duration_minutes
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING id, booking_type, status, created_at`,
      [
        input.visitorId,
        input.bookingType,
        "pending",
        input.name,
        input.email,
        input.projectTitle ?? null,
        input.projectType ?? null,
        input.description ?? null,
        input.timeline ?? null,
        input.budget ?? null,
        JSON.stringify(input.requestDetails),
        input.meetingStartAt ?? null,
        input.meetingDurationMinutes ?? null,
      ],
    );

    const booking = result.rows[0];

    if (!booking) {
      throw new Error("BOOKING_CREATION_FAILED");
    }

    await client.query("COMMIT");

    return {
      id: booking.id,
      bookingType: booking.booking_type,
      status: booking.status,
      createdAt: booking.created_at,
    };
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
    `SELECT id, booking_type, status, created_at
     FROM bookings
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return result.rows[0] ?? null;
}
