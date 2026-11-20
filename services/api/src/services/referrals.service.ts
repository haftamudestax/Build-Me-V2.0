import { isDeepStrictEqual } from "node:util";
import type { CreateReferralInput } from "../validators/referrals.validator";
import { pool } from "./bookings.service";

export interface CreatedReferral {
  id: string;
  status: string;
  createdAt: Date;
}

interface ReferralRow {
  id: string;
  status: string;
  created_at: Date;
}

const REFERRAL_COLUMNS = `
  id,
  status,
  created_at
`;

function toCreatedReferral(row: ReferralRow): CreatedReferral {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
  };
}

function getReferralValues(input: CreateReferralInput) {
  return {
    referrerName: input.referrerName,
    referrerEmail: input.referrerEmail,
    referredName: input.referredName,
    referredEmail: input.referredEmail,
    relationship: input.relationship,
    message: input.message ?? null,
  };
}

export async function createReferral(
  input: CreateReferralInput,
): Promise<CreatedReferral> {
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

    const values = getReferralValues(input);

    if (input.idempotencyKey) {
      const existing = await client.query<ReferralRow>(
        `SELECT ${REFERRAL_COLUMNS}
         FROM referrals
         WHERE visitor_id = $1
           AND idempotency_key = $2
         LIMIT 1
         FOR UPDATE`,
        [input.visitorId, input.idempotencyKey],
      );

      const existingReferral = existing.rows[0];

      if (existingReferral) {
        const savedResult = await client.query(
          `SELECT
             referrer_name,
             referrer_email,
             referred_name,
             referred_email,
             relationship,
             message
           FROM referrals
           WHERE id = $1`,
          [existingReferral.id],
        );

        const saved = savedResult.rows[0];

        if (!saved) {
          throw new Error("REFERRAL_LOOKUP_FAILED");
        }

        const sameRequest = isDeepStrictEqual(
          {
            referrerName: saved.referrer_name,
            referrerEmail: saved.referrer_email,
            referredName: saved.referred_name,
            referredEmail: saved.referred_email,
            relationship: saved.relationship,
            message: saved.message,
          },
          values,
        );

        if (!sameRequest) {
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        }

        await client.query("COMMIT");
        return toCreatedReferral(existingReferral);
      }
    }

    const result = await client.query<ReferralRow>(
      `INSERT INTO referrals (
         visitor_id,
         referrer_name,
         referrer_email,
         referred_name,
         referred_email,
         relationship,
         message,
         status,
         idempotency_key
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (visitor_id, idempotency_key)
       DO NOTHING
       RETURNING ${REFERRAL_COLUMNS}`,
      [
        input.visitorId,
        values.referrerName,
        values.referrerEmail,
        values.referredName,
        values.referredEmail,
        values.relationship,
        values.message,
        "pending",
        input.idempotencyKey ?? null,
      ],
    );

    let referral = result.rows[0];

    // Resolve a concurrent retry using the same idempotency key.
    if (!referral && input.idempotencyKey) {
      const existing = await client.query<ReferralRow>(
        `SELECT ${REFERRAL_COLUMNS}
         FROM referrals
         WHERE visitor_id = $1
           AND idempotency_key = $2
         LIMIT 1
         FOR UPDATE`,
        [input.visitorId, input.idempotencyKey],
      );

      referral = existing.rows[0];

      if (!referral) {
        throw new Error("REFERRAL_CREATION_FAILED");
      }

      const savedResult = await client.query(
        `SELECT
           referrer_name,
           referrer_email,
           referred_name,
           referred_email,
           relationship,
           message
         FROM referrals
         WHERE id = $1`,
        [referral.id],
      );

      const saved = savedResult.rows[0];

      if (!saved) {
        throw new Error("REFERRAL_LOOKUP_FAILED");
      }

      const sameRequest = isDeepStrictEqual(
        {
          referrerName: saved.referrer_name,
          referrerEmail: saved.referrer_email,
          referredName: saved.referred_name,
          referredEmail: saved.referred_email,
          relationship: saved.relationship,
          message: saved.message,
        },
        values,
      );

      if (!sameRequest) {
        throw new Error("IDEMPOTENCY_KEY_REUSED");
      }
    }

    if (!referral) {
      throw new Error("REFERRAL_CREATION_FAILED");
    }

    await client.query("COMMIT");

    return toCreatedReferral(referral);
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

export async function getReferralById(id: string) {
  const result = await pool.query<ReferralRow>(
    `SELECT ${REFERRAL_COLUMNS}
     FROM referrals
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return result.rows[0] ?? null;
}