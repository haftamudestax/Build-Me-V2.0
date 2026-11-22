import { randomInt } from "node:crypto";

import type { PoolClient } from "pg";

import { pool } from "./bookings.service";
import { sendTalkToUsNotification } from "./talk-to-us-email.service";
import type { CreateTalkToUsMessageInput } from "../validators/talk-to-us.validator";

export interface CreatedTalkToUsMessage {
  id: string;
  reference: string;
  status: string;
  createdAt: Date;
}

interface TalkToUsRow {
  id: string;
  reference: string;
  status: string;
  created_at: Date;
}

interface TalkToUsDetailsRow {
  name: string;
  email: string;
  message: string;
  source: string;
}

interface SavedTalkToUsMessage {
  row: TalkToUsRow;
  /** False when this was a retry of a message that was already saved. */
  isNew: boolean;
}

interface PostgreSQLError extends Error {
  code?: string;
  severity?: string;
  schema?: string;
  table?: string;
  column?: string;
  constraint?: string;
}

const RATE_LIMIT_PER_HOUR = 5;

const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const TALK_TO_US_COLUMNS = `
  id,
  reference,
  status,
  created_at
`;

const TALK_TO_US_DETAILS_COLUMNS = `
  name,
  email,
  message,
  source
`;

const KNOWN_TALK_TO_US_ERRORS = new Set([
  "VISITOR_NOT_FOUND",
  "IDEMPOTENCY_KEY_REUSED",
  "TALK_TO_US_RATE_LIMITED",
  "TALK_TO_US_LOOKUP_FAILED",
  "TALK_TO_US_CREATION_FAILED",
]);

function toCreatedTalkToUsMessage(row: TalkToUsRow): CreatedTalkToUsMessage {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** A short code the visitor can quote when they follow up, for example TTU-K7M2PX4Q. */
function createReference(): string {
  return (
    "TTU-" +
    Array.from(
      { length: 8 },
      () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)],
    ).join("")
  );
}

/**
 * Logs database error metadata without logging submitted
 * message values or PostgreSQL error details.
 */
function logTalkToUsDatabaseError(error: unknown): void {
  if (!(error instanceof Error)) {
    console.error("[TalkToUs] Database operation failed.", {
      errorType: typeof error,
    });
    return;
  }

  const databaseError = error as PostgreSQLError;

  console.error("[TalkToUs] Database operation failed.", {
    message: databaseError.message,
    code: databaseError.code,
    severity: databaseError.severity,
    schema: databaseError.schema,
    table: databaseError.table,
    column: databaseError.column,
    constraint: databaseError.constraint,
  });
}

async function getTalkToUsDetails(
  client: PoolClient,
  messageId: string,
): Promise<TalkToUsDetailsRow> {
  const result = await client.query<TalkToUsDetailsRow>(
    `SELECT ${TALK_TO_US_DETAILS_COLUMNS}
     FROM talk_to_us_messages
     WHERE id = $1
     LIMIT 1`,
    [messageId],
  );

  const saved = result.rows[0];

  if (!saved) {
    throw new Error("TALK_TO_US_LOOKUP_FAILED");
  }

  return saved;
}

function isSameTalkToUsRequest(
  saved: TalkToUsDetailsRow,
  input: CreateTalkToUsMessageInput,
): boolean {
  return (
    saved.name === input.name &&
    saved.email === input.email &&
    saved.message === input.message &&
    saved.source === input.source
  );
}

async function getExistingIdempotentMessage(
  client: PoolClient,
  visitorId: string,
  idempotencyKey: string,
): Promise<TalkToUsRow | null> {
  const result = await client.query<TalkToUsRow>(
    `SELECT ${TALK_TO_US_COLUMNS}
     FROM talk_to_us_messages
     WHERE visitor_id = $1
       AND idempotency_key = $2
     LIMIT 1
     FOR UPDATE`,
    [visitorId, idempotencyKey],
  );

  return result.rows[0] ?? null;
}

async function verifyIdempotentMessage(
  client: PoolClient,
  message: TalkToUsRow,
  input: CreateTalkToUsMessageInput,
): Promise<void> {
  const saved = await getTalkToUsDetails(client, message.id);

  if (!isSameTalkToUsRequest(saved, input)) {
    throw new Error("IDEMPOTENCY_KEY_REUSED");
  }
}

async function assertWithinRateLimit(
  client: PoolClient,
  visitorId: string,
): Promise<void> {
  const result = await client.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM talk_to_us_messages
     WHERE visitor_id = $1
       AND created_at >= NOW() - INTERVAL '1 hour'`,
    [visitorId],
  );

  if ((result.rows[0]?.total ?? 0) >= RATE_LIMIT_PER_HOUR) {
    throw new Error("TALK_TO_US_RATE_LIMITED");
  }
}

async function saveTalkToUsMessage(
  input: CreateTalkToUsMessageInput,
): Promise<SavedTalkToUsMessage> {
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
    // A retry is answered before the rate limit, so it is never blocked.
    if (input.idempotencyKey) {
      const existingMessage = await getExistingIdempotentMessage(
        client,
        input.visitorId,
        input.idempotencyKey,
      );

      if (existingMessage) {
        await verifyIdempotentMessage(client, existingMessage, input);

        await client.query("COMMIT");

        return { row: existingMessage, isNew: false };
      }
    }

    // Step 3: Limit how many messages one visitor can send per hour.
    await assertWithinRateLimit(client, input.visitorId);

    // Step 4: Insert the message.
    const result = await client.query<TalkToUsRow>(
      `INSERT INTO talk_to_us_messages (
        visitor_id,
        reference,
        name,
        email,
        message,
        source,
        status,
        email_status,
        idempotency_key
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (visitor_id, idempotency_key)
      DO NOTHING
      RETURNING ${TALK_TO_US_COLUMNS}`,
      [
        input.visitorId,
        createReference(),
        input.name,
        input.email,
        input.message,
        input.source,
        "submitted",
        "pending",
        input.idempotencyKey ?? null,
      ],
    );

    const message = result.rows[0];

    // Step 5: Handle a concurrent request using the same key.
    if (!message && input.idempotencyKey) {
      const existingMessage = await getExistingIdempotentMessage(
        client,
        input.visitorId,
        input.idempotencyKey,
      );

      if (!existingMessage) {
        throw new Error("TALK_TO_US_CREATION_FAILED");
      }

      await verifyIdempotentMessage(client, existingMessage, input);

      await client.query("COMMIT");

      return { row: existingMessage, isNew: false };
    }

    if (!message) {
      throw new Error("TALK_TO_US_CREATION_FAILED");
    }

    // Step 6: Commit the successful submission.
    await client.query("COMMIT");

    return { row: message, isNew: true };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original error if rollback also fails.
    }

    if (
      error instanceof Error &&
      KNOWN_TALK_TO_US_ERRORS.has(error.message)
    ) {
      throw error;
    }

    logTalkToUsDatabaseError(error);

    // Keep internal database details out of the API response, preserving the caught error as cause.
    throw new Error("TALK_TO_US_CREATION_FAILED", { cause: error });
  } finally {
    client.release();
  }
}

/**
 * Emails the owner, then records whether it worked. This runs after the
 * message is committed, so a failed email can never lose the message.
 */
async function notifyOwner(
  message: TalkToUsRow,
  input: CreateTalkToUsMessageInput,
): Promise<void> {
  let emailStatus: "sent" | "failed" = "sent";
  let emailError: string | null = null;

  try {
    await sendTalkToUsNotification({
      reference: message.reference,
      name: input.name,
      email: input.email,
      message: input.message,
    });
  } catch (error) {
    emailStatus = "failed";
    emailError =
      error instanceof Error
        ? error.message.slice(0, 300)
        : "Unknown email error";

    console.error("[TalkToUs] Notification email failed.", {
      reference: message.reference,
      reason: emailError,
    });
  }

  try {
    await pool.query(
      `UPDATE talk_to_us_messages
       SET email_status = $2,
           email_error = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [message.id, emailStatus, emailError],
    );
  } catch (error) {
    logTalkToUsDatabaseError(error);
  }
}

export async function createTalkToUsMessage(
  input: CreateTalkToUsMessageInput,
): Promise<CreatedTalkToUsMessage> {
  const { row, isNew } = await saveTalkToUsMessage(input);

  // A retry of a saved message must not email the owner a second time.
  if (isNew) {
    await notifyOwner(row, input);
  }

  return toCreatedTalkToUsMessage(row);
}