
import { Pool } from 'pg';
import type { CreateBookingInput } from '../validators/bookings.validator';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured for the API.');
}

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  max: 10,
  // Configure SSL according to your database provider's requirements.
});

export interface CreatedBooking {
  id: string;
  bookingType: string;
  status: string;
  createdAt: Date;
}

export async function createProjectBooking(
  input: CreateBookingInput,
): Promise<CreatedBooking> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const visitor = await client.query(
      'SELECT id FROM visitors WHERE id = $1 LIMIT 1',
      [input.visitorId],
    );

    if (visitor.rowCount === 0) {
      await client.query('ROLLBACK');
      throw new Error('VISITOR_NOT_FOUND');
    }

    const result = await client.query<{
      id: string;
      booking_type: string;
      status: string;
      created_at: Date;
    }>(
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
        budget
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, booking_type, status, created_at`,
      [
        input.visitorId,
        'delivery_project',
        'pending',
        input.name,
        input.email,
        input.projectTitle,
        input.projectType,
        input.description,
        input.timeline,
        input.budget,
      ],
    );

    await client.query('COMMIT');

    const booking = result.rows[0];

    return {
      id: booking.id,
      bookingType: booking.booking_type,
      status: booking.status,
      createdAt: booking.created_at,
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original error.
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function getProjectBookingById(id: string) {
  const result = await pool.query(
    `SELECT id, booking_type, status, created_at
     FROM bookings
     WHERE id = $1 AND booking_type = $2
     LIMIT 1`,
    [id, 'delivery_project'],
  );

  return result.rows[0] ?? null;
}
