import {
  REFERRAL_RELATIONSHIPS,
  type ReferralRelationship,
} from "../types/referrals.types";

export interface CreateReferralInput {
  visitorId: string;
  idempotencyKey?: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  relationship: ReferralRelationship;
  message?: string;
}

type ValidationResult =
  | { valid: true; data: CreateReferralInput }
  | { valid: false; error: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  if (normalized.length > maxLength) {
    throw new Error(`${field} must not exceed ${maxLength} characters.`);
  }

  return normalized;
}

function validateEmail(value: string, field: string): string {
  const email = value.toLowerCase();

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error(`${field} must be a valid email address.`);
  }

  return email;
}

export function validateCreateReferral(
  body: unknown,
): ValidationResult {
  if (!isRecord(body)) {
    return {
      valid: false,
      error: "A valid referral request body is required.",
    };
  }

  try {
    const visitorId = requiredString(body.visitorId, "Visitor ID", 36);

    if (!UUID_PATTERN.test(visitorId)) {
      throw new Error("Visitor ID must be a valid UUID.");
    }

    const referrerName = requiredString(
      body.referrerName,
      "Referrer name",
      120,
    );

    const referrerEmail = validateEmail(
      requiredString(body.referrerEmail, "Referrer email", 254),
      "Referrer email",
    );

    const referredName = requiredString(
      body.referredName,
      "Referred person's name",
      120,
    );

    const referredEmail = validateEmail(
      requiredString(body.referredEmail, "Referred person's email", 254),
      "Referred person's email",
    );

    if (referrerEmail === referredEmail) {
      throw new Error("You cannot refer yourself.");
    }

    if (
      typeof body.relationship !== "string" ||
      !REFERRAL_RELATIONSHIPS.includes(
        body.relationship as ReferralRelationship,
      )
    ) {
      throw new Error(
        "Relationship must be friend, family, or colleague.",
      );
    }

    let message: string | undefined;

    if (body.message !== undefined && body.message !== null) {
      if (typeof body.message !== "string") {
        throw new Error("Message must be text.");
      }

      message = body.message.trim();

      if (message.length > 1000) {
        throw new Error("Message must not exceed 1000 characters.");
      }

      if (!message) {
        message = undefined;
      }
    }

    let idempotencyKey: string | undefined;

    if (body.idempotencyKey !== undefined) {
      idempotencyKey = requiredString(
        body.idempotencyKey,
        "Idempotency key",
        128,
      );
    }

    return {
      valid: true,
      data: {
        visitorId,
        idempotencyKey,
        referrerName,
        referrerEmail,
        referredName,
        referredEmail,
        relationship: body.relationship as ReferralRelationship,
        message,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid referral information.",
    };
  }
}