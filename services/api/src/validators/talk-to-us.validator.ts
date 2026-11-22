export const TALK_TO_US_NAME_MIN_LENGTH = 2;
export const TALK_TO_US_NAME_MAX_LENGTH = 120;
export const TALK_TO_US_EMAIL_MAX_LENGTH = 254;
export const TALK_TO_US_MESSAGE_MIN_LENGTH = 10;
export const TALK_TO_US_MESSAGE_MAX_LENGTH = 1000;
export const TALK_TO_US_SOURCE_MAX_LENGTH = 50;

export interface CreateTalkToUsMessageInput {
  visitorId: string;
  idempotencyKey?: string;

  name: string;
  email: string;
  message: string;
  source: string;
}

export type TalkToUsValidationResult =
  | {
      valid: true;
      data: CreateTalkToUsMessageInput;
    }
  | {
      valid: false;
      error: string;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRequiredString(
  input: Record<string, unknown>,
  field: string,
  label: string,
  minLength: number,
  maxLength: number,
): { value: string } | { error: string } {
  const raw = input[field];

  if (typeof raw !== "string" || raw.trim().length === 0) {
    return {
      error: `${label} is required.`,
    };
  }

  const value = raw.trim();

  if (value.length < minLength || value.length > maxLength) {
    return {
      error: `${label} must be between ${minLength} and ${maxLength} characters.`,
    };
  }

  return { value };
}

function readOptionalString(
  input: Record<string, unknown>,
  field: string,
  maxLength: number,
): { value?: string } | { error: string } {
  const raw = input[field];

  if (raw === undefined || raw === null || raw === "") {
    return {};
  }

  if (typeof raw !== "string") {
    return {
      error: `${field} must be a string.`,
    };
  }

  const value = raw.trim();

  if (!value) {
    return {};
  }

  if (value.length > maxLength) {
    return {
      error: `${field} must be at most ${maxLength} characters.`,
    };
  }

  return { value };
}

function validateIdempotencyKey(
  value: unknown,
): { value?: string } | { error: string } {
  if (value === undefined || value === null) {
    return {};
  }

  if (
    typeof value !== "string" ||
    value.length < 8 ||
    value.length > 128 ||
    !IDEMPOTENCY_KEY_PATTERN.test(value)
  ) {
    return {
      error:
        "idempotencyKey must be 8-128 characters and contain only letters, numbers, dots, underscores, colons, or hyphens.",
    };
  }

  return { value };
}

export function validateCreateTalkToUsMessage(
  body: unknown,
): TalkToUsValidationResult {
  if (!isRecord(body)) {
    return {
      valid: false,
      error: "A JSON object is required.",
    };
  }

  const visitorId = body.visitorId;

  if (typeof visitorId !== "string" || !UUID_PATTERN.test(visitorId)) {
    return {
      valid: false,
      error: "visitorId must be a valid UUID.",
    };
  }

  const nameResult = readRequiredString(
    body,
    "name",
    "Name",
    TALK_TO_US_NAME_MIN_LENGTH,
    TALK_TO_US_NAME_MAX_LENGTH,
  );

  if ("error" in nameResult) {
    return {
      valid: false,
      error: nameResult.error,
    };
  }

  const emailResult = readRequiredString(
    body,
    "email",
    "Email address",
    1,
    TALK_TO_US_EMAIL_MAX_LENGTH,
  );

  if ("error" in emailResult) {
    return {
      valid: false,
      error: emailResult.error,
    };
  }

  if (!EMAIL_PATTERN.test(emailResult.value)) {
    return {
      valid: false,
      error: "A valid email address is required.",
    };
  }

  const messageResult = readRequiredString(
    body,
    "message",
    "Message",
    TALK_TO_US_MESSAGE_MIN_LENGTH,
    TALK_TO_US_MESSAGE_MAX_LENGTH,
  );

  if ("error" in messageResult) {
    return {
      valid: false,
      error: messageResult.error,
    };
  }

  const sourceResult = readOptionalString(
    body,
    "source",
    TALK_TO_US_SOURCE_MAX_LENGTH,
  );

  if ("error" in sourceResult) {
    return {
      valid: false,
      error: sourceResult.error,
    };
  }

  const idempotencyResult = validateIdempotencyKey(body.idempotencyKey);

  if ("error" in idempotencyResult) {
    return {
      valid: false,
      error: idempotencyResult.error,
    };
  }

  return {
    valid: true,
    data: {
      visitorId,

      ...(idempotencyResult.value
        ? { idempotencyKey: idempotencyResult.value }
        : {}),

      name: nameResult.value,
      email: emailResult.value,
      message: messageResult.value,
      source: sourceResult.value ?? "website",
    },
  };
}