import type { PoolClient } from "pg";

import { pool } from "./bookings.service";
import type { CreateFeedbackInput } from "../validators/feedback.validator";

export interface CreatedFeedback {
  id: string;
  type: string;
  status: string;
  createdAt: Date;
}

interface FeedbackRow {
  id: string;
  type: string;
  status: string;
  created_at: Date;
}

interface FeedbackDetailsRow {
  type: string;
  name: string | null;
  email: string | null;
  category: string | null;
  rating: number | null;
  nps_score: number | null;
  comments: string | null;
}

interface PostgreSQLError extends Error {
  code?: string;
  severity?: string;
  schema?: string;
  table?: string;
  column?: string;
  constraint?: string;
}

const FEEDBACK_COLUMNS = `
  id,
  type,
  status,
  created_at
`;

const FEEDBACK_DETAILS_COLUMNS = `
  type,
  name,
  email,
  category,
  rating,
  nps_score,
  comments
`;

const KNOWN_FEEDBACK_ERRORS = new Set([
  "VISITOR_NOT_FOUND",
  "IDEMPOTENCY_KEY_REUSED",
  "FEEDBACK_LOOKUP_FAILED",
  "FEEDBACK_CREATION_FAILED",
]);

function toCreatedFeedback(row: FeedbackRow): CreatedFeedback {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Logs database error metadata without logging submitted
 * feedback values or PostgreSQL error details.
 */
function logFeedbackDatabaseError(error: unknown): void {
  if (!(error instanceof Error)) {
    console.error("[Feedback] Database operation failed.", {
      errorType: typeof error,
    });
    return;
  }

  const databaseError = error as PostgreSQLError;

  console.error("[Feedback] Database operation failed.", {
    message: databaseError.message,
    code: databaseError.code,
    severity: databaseError.severity,
    schema: databaseError.schema,
    table: databaseError.table,
    column: databaseError.column,
    constraint: databaseError.constraint,
  });
}

async function getFeedbackDetails(
  client: PoolClient,
  feedbackId: string,
): Promise<FeedbackDetailsRow> {
  const result = await client.query<FeedbackDetailsRow>(
    `SELECT ${FEEDBACK_DETAILS_COLUMNS}
     FROM feedback
     WHERE id = $1
     LIMIT 1`,
    [feedbackId],
  );

  const feedback = result.rows[0];

  if (!feedback) {
    throw new Error("FEEDBACK_LOOKUP_FAILED");
  }

  return feedback;
}

function isSameFeedbackRequest(
  saved: FeedbackDetailsRow,
  input: CreateFeedbackInput,
): boolean {
  return (
    saved.type === input.type &&
    saved.name === (input.name ?? null) &&
    saved.email === (input.email ?? null) &&
    saved.category === (input.category ?? null) &&
    saved.rating === (input.rating ?? null) &&
    saved.nps_score === (input.npsScore ?? null) &&
    saved.comments === (input.comments ?? null)
  );
}

async function getExistingIdempotentFeedback(
  client: PoolClient,
  visitorId: string,
  idempotencyKey: string,
): Promise<FeedbackRow | null> {
  const result = await client.query<FeedbackRow>(
    `SELECT ${FEEDBACK_COLUMNS}
     FROM feedback
     WHERE visitor_id = $1
       AND idempotency_key = $2
     LIMIT 1
     FOR UPDATE`,
    [visitorId, idempotencyKey],
  );

  return result.rows[0] ?? null;
}

async function verifyIdempotentFeedback(
  client: PoolClient,
  feedback: FeedbackRow,
  input: CreateFeedbackInput,
): Promise<void> {
  const saved = await getFeedbackDetails(client, feedback.id);

  if (!isSameFeedbackRequest(saved, input)) {
    throw new Error("IDEMPOTENCY_KEY_REUSED");
  }
}

export async function createFeedback(
  input: CreateFeedbackInput,
): Promise<CreatedFeedback> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Step 1: Verify that the visitor exists.
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

    // Step 2: Check for an existing idempotent submission.
    if (input.idempotencyKey) {
      const existingFeedback =
        await getExistingIdempotentFeedback(
          client,
          input.visitorId,
          input.idempotencyKey,
        );

      if (existingFeedback) {
        await verifyIdempotentFeedback(
          client,
          existingFeedback,
          input,
        );

        await client.query("COMMIT");

        return toCreatedFeedback(existingFeedback);
      }
    }

    // Step 3: Insert the feedback.
    const result = await client.query<FeedbackRow>(
      `INSERT INTO feedback (
        visitor_id,
        type,
        name,
        email,
        category,
        rating,
        nps_score,
        comments,
        status,
        idempotency_key
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (visitor_id, idempotency_key)
      DO NOTHING
      RETURNING ${FEEDBACK_COLUMNS}`,
      [
        input.visitorId,
        input.type,
        input.name ?? null,
        input.email ?? null,
        input.category ?? null,
        input.rating ?? null,
        input.npsScore ?? null,
        input.comments ?? null,
        "submitted",
        input.idempotencyKey ?? null,
      ],
    );

    const feedback = result.rows[0];

    // Step 4: Handle a concurrent request using the same key.
    if (!feedback && input.idempotencyKey) {
      const existingFeedback =
        await getExistingIdempotentFeedback(
          client,
          input.visitorId,
          input.idempotencyKey,
        );

      if (!existingFeedback) {
        throw new Error("FEEDBACK_CREATION_FAILED");
      }

      await verifyIdempotentFeedback(
        client,
        existingFeedback,
        input,
      );

      await client.query("COMMIT");

      return toCreatedFeedback(existingFeedback);
    }

    if (!feedback) {
      throw new Error("FEEDBACK_CREATION_FAILED");
    }

    // Step 5: Commit the successful submission.
    await client.query("COMMIT");

    return toCreatedFeedback(feedback);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original error if rollback also fails.
    }

    if (
      error instanceof Error &&
      KNOWN_FEEDBACK_ERRORS.has(error.message)
    ) {
      throw error;
    }

    logFeedbackDatabaseError(error);

    // Keep internal database details out of the API response, preserving the caught error as cause.
    throw new Error("FEEDBACK_CREATION_FAILED", { cause: error });
  } finally {
    client.release();
  }
}