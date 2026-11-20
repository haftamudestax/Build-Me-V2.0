export const FEEDBACK_TYPES = [
  "nps",
  "rating",
  "issue",
  "suggestion",
  "complaint",
] as const;

export type FeedbackType =
  (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_CATEGORIES = [
  "business",
  "platforms",
  "partners",
] as const;

export type FeedbackCategory =
  (typeof FEEDBACK_CATEGORIES)[number];

export interface CreateFeedbackInput {
  visitorId: string;
  type: FeedbackType;
  idempotencyKey?: string;

  name?: string;
  email?: string;

  category?: FeedbackCategory;

  rating?: number;
  npsScore?: number;

  comments?: string;
}

export type FeedbackValidationResult =
  | {
      valid: true;
      data: CreateFeedbackInput;
    }
  | {
      valid: false;
      error: string;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;

const MAX_COMMENTS_LENGTH = 5000;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isOneOf<T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return (
    typeof value === "string" &&
    (values as readonly string[]).includes(value)
  );
}

function readOptionalString(
  input: Record<string, unknown>,
  field: string,
  maxLength: number,
  minLength = 1,
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

  if (
    value.length < minLength ||
    value.length > maxLength
  ) {
    return {
      error: `${field} must be between ${minLength} and ${maxLength} characters.`,
    };
  }

  return { value };
}

function readOptionalInteger(
  input: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
): { value?: number } | { error: string } {
  const raw = input[field];

  if (raw === undefined || raw === null) {
    return {};
  }

  if (
    typeof raw !== "number" ||
    !Number.isInteger(raw) ||
    raw < min ||
    raw > max
  ) {
    return {
      error: `${field} must be an integer between ${min} and ${max}.`,
    };
  }

  return { value: raw };
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

export function validateCreateFeedback(
  body: unknown,
): FeedbackValidationResult {

  if (!isRecord(body)) {
    return {
      valid: false,
      error: "A JSON object is required.",
    };
  }


  const visitorId = body.visitorId;

  if (
    typeof visitorId !== "string" ||
    !UUID_PATTERN.test(visitorId)
  ) {
    return {
      valid: false,
      error: "visitorId must be a valid UUID.",
    };
  }


  if (!isOneOf(FEEDBACK_TYPES, body.type)) {
    return {
      valid: false,
      error: "Unsupported feedback type.",
    };
  }

  const type: FeedbackType = body.type;

  const nameResult = readOptionalString(
    body,
    "name",
    120,
    2,
  );

  if ("error" in nameResult) {
    return {
      valid: false,
      error: nameResult.error,
    };
  }


  const emailResult = readOptionalString(
    body,
    "email",
    254,
  );

  if ("error" in emailResult) {
    return {
      valid: false,
      error: emailResult.error,
    };
  }

  const name = nameResult.value;
  const email = emailResult.value;

  if (email && !EMAIL_PATTERN.test(email)) {
    return {
      valid: false,
      error: "A valid email address is required.",
    };
  }


  let category: FeedbackCategory | undefined;

  if (
    body.category !== undefined &&
    body.category !== null &&
    body.category !== ""
  ) {
    if (!isOneOf(FEEDBACK_CATEGORIES, body.category)) {
      return {
        valid: false,
        error: "Unsupported feedback category.",
      };
    }

    category = body.category;
  }


  const ratingResult = readOptionalInteger(
    body,
    "rating",
    1,
    5,
  );

  if ("error" in ratingResult) {
    return {
      valid: false,
      error: ratingResult.error,
    };
  }


  const npsResult = readOptionalInteger(
    body,
    "npsScore",
    0,
    10,
  );

  if ("error" in npsResult) {
    return {
      valid: false,
      error: npsResult.error,
    };
  }

  // 9. Validate optional comments.

  const commentsResult = readOptionalString(
    body,
    "comments",
    MAX_COMMENTS_LENGTH,
  );

  if ("error" in commentsResult) {
    return {
      valid: false,
      error: commentsResult.error,
    };
  }

  const comments = commentsResult.value;


  switch (type) {
    case "nps": {
      if (npsResult.value === undefined) {
        return {
          valid: false,
          error: "An NPS score between 0 and 10 is required.",
        };
      }

      if (ratingResult.value !== undefined) {
        return {
          valid: false,
          error: "NPS feedback cannot contain a service rating.",
        };
      }

      break;
    }

    case "rating": {
      if (ratingResult.value === undefined) {
        return {
          valid: false,
          error: "A service rating between 1 and 5 is required.",
        };
      }

      if (npsResult.value !== undefined) {
        return {
          valid: false,
          error: "Rating feedback cannot contain an NPS score.",
        };
      }

      break;
    }

    case "issue":
    case "suggestion":
    case "complaint": {
      if (!comments) {
        const labels: Record<
          "issue" | "suggestion" | "complaint",
          string
        > = {
          issue: "An issue description",
          suggestion: "A suggestion",
          complaint: "A complaint description",
        };

        return {
          valid: false,
          error: `${labels[type]} is required.`,
        };
      }

      if (
        ratingResult.value !== undefined ||
        npsResult.value !== undefined
      ) {
        return {
          valid: false,
          error: "Text feedback cannot contain rating scores.",
        };
      }

      break;
    }
  }

  const idempotencyResult = validateIdempotencyKey(
    body.idempotencyKey,
  );

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
      type,

      ...(idempotencyResult.value
        ? { idempotencyKey: idempotencyResult.value }
        : {}),

      ...(name ? { name } : {}),

      ...(email ? { email } : {}),

      ...(category ? { category } : {}),

      ...(ratingResult.value !== undefined
        ? { rating: ratingResult.value }
        : {}),

      ...(npsResult.value !== undefined
        ? { npsScore: npsResult.value }
        : {}),

      ...(comments ? { comments } : {}),
    },
  };
}
