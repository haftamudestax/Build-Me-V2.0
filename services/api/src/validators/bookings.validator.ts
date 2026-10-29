
export const BOOKING_TIMELINES = [
  "ASAP",
  "Within a month",
  "1-3 months",
  "Flexible",
] as const;

export const BOOKING_TYPES = [
  "delivery_project",
  "mentor_me",
  "coffee_with_me",
] as const;

export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "other",
] as const;

export const MEETING_FORMATS = ["online", "in_person"] as const;

export type BookingType = (typeof BOOKING_TYPES)[number];
export type BookingTimeline = (typeof BOOKING_TIMELINES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type MeetingFormat = (typeof MEETING_FORMATS)[number];

export interface DeliveryProjectRequestDetails {
  additionalContext?: string;
}

export interface MentorMeRequestDetails {
  mentoringTopic: string;
  goals: string;
  experienceLevel: ExperienceLevel;
  preferredFormat: MeetingFormat;
  additionalContext?: string;
}

export interface CoffeeWithMeRequestDetails {
  preferredFormat: MeetingFormat;
  timezone: string;
  additionalContext?: string;
}

export type BookingRequestDetails =
  | DeliveryProjectRequestDetails
  | MentorMeRequestDetails
  | CoffeeWithMeRequestDetails;

export interface CreateBookingInput {
  visitorId: string;
  bookingType: BookingType;
  idempotencyKey?: string;

  name: string;
  email: string;

  projectTitle?: string;
  projectType?: string;
  description?: string;
  timeline?: BookingTimeline;
  budget?: string | null;

  
  requestDetails: BookingRequestDetails;
  meetingStartAt?: string;
  meetingDurationMinutes?: number;
}

export const COFFEE_MEETING_DURATION_MINUTES = 30;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;

type ValidationResult =
  | { valid: true; data: CreateBookingInput }
  | { valid: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRequiredString(
  input: Record<string, unknown>,
  field: string,
  minLength = 1,
  maxLength = 10000,
): { value: string } | { error: string } {
  const raw = input[field];

  if (typeof raw !== "string" || !raw.trim()) {
    return { error: `${field} is required.` };
  }

  const value = raw.trim();

  if (value.length < minLength || value.length > maxLength) {
    return {
      error: `${field} must be between ${minLength} and ${maxLength} characters.`,
    };
  }

  return { value };
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

function getRequestDetails(
  input: Record<string, unknown>,
): Record<string, unknown> {
  // Accept either a nested requestDetails object or the existing
  // top-level form fields. Nested fields take precedence.
  const nested = isRecord(input.requestDetails)
    ? input.requestDetails
    : {};

  return { ...input, ...nested };
}

export function validateCreateBooking(body: unknown): ValidationResult {
  if (!isRecord(body)) {
    return {
      valid: false,
      error: "A JSON object is required.",
    };
  }

  const visitorIdResult = readRequiredString(body, "visitorId", 1, 36);
  if ("error" in visitorIdResult) {
    return { valid: false, error: visitorIdResult.error };
  }

  const visitorId = visitorIdResult.value;

  if (!UUID_PATTERN.test(visitorId)) {
    return {
      valid: false,
      error: "visitorId must be a valid UUID.",
    };
  }

  const nameResult = readRequiredString(body, "name", 2, 120);
  if ("error" in nameResult) {
    return { valid: false, error: nameResult.error };
  }

  const emailResult = readRequiredString(body, "email", 1, 254);
  if ("error" in emailResult) {
    return { valid: false, error: emailResult.error };
  }

  const name = nameResult.value;
  const email = emailResult.value;

  if (!EMAIL_PATTERN.test(email)) {
    return {
      valid: false,
      error: "A valid email address is required.",
    };
  }

  // Keep compatibility with the existing delivery form, which sends
  // `type: "delivery_project"`. Older requests without a type remain
  // delivery-project requests.
  const rawBookingType = body.bookingType ?? body.type ?? "delivery_project";

  if (!isOneOf(BOOKING_TYPES, rawBookingType)) {
    return {
      valid: false,
      error: "Unsupported booking type.",
    };
  }

  const bookingType = rawBookingType;
  const details = getRequestDetails(body);

  let requestDetails: BookingRequestDetails;
  let projectTitle: string | undefined;
  let projectType: string | undefined;
  let description: string | undefined;
  let timeline: BookingTimeline | undefined;
  let budget: string | null | undefined;
  let meetingStartAt: string | undefined;
  let meetingDurationMinutes: number | undefined;

  if (bookingType === "delivery_project") {
    const projectTitleResult = readRequiredString(
      body,
      "projectTitle",
      3,
      160,
    );
    if ("error" in projectTitleResult) {
      return { valid: false, error: projectTitleResult.error };
    }

    const projectTypeResult = readRequiredString(
      body,
      "projectType",
      2,
      80,
    );
    if ("error" in projectTypeResult) {
      return { valid: false, error: projectTypeResult.error };
    }

    const descriptionResult = readRequiredString(
      body,
      "description",
      20,
      10000,
    );
    if ("error" in descriptionResult) {
      return { valid: false, error: descriptionResult.error };
    }

    const timelineResult = readRequiredString(body, "timeline", 1, 80);
    if ("error" in timelineResult) {
      return { valid: false, error: timelineResult.error };
    }

    if (!isOneOf(BOOKING_TIMELINES, timelineResult.value)) {
      return {
        valid: false,
        error: "Unsupported project timeline.",
      };
    }

    const rawBudget = body.budget;

    if (
      rawBudget !== undefined &&
      rawBudget !== null &&
      (typeof rawBudget !== "string" || rawBudget.trim().length > 120)
    ) {
      return {
        valid: false,
        error: "Budget must be a string of at most 120 characters.",
      };
    }

    projectTitle = projectTitleResult.value;
    projectType = projectTypeResult.value;
    description = descriptionResult.value;
    timeline = timelineResult.value;
    budget =
      typeof rawBudget === "string" && rawBudget.trim()
        ? rawBudget.trim()
        : null;

    const additionalContext = details.additionalContext;
    if (
      additionalContext !== undefined &&
      (typeof additionalContext !== "string" ||
        additionalContext.trim().length > 5000)
    ) {
      return {
        valid: false,
        error: "Additional context must be at most 5000 characters.",
      };
    }

    requestDetails = {
      ...(typeof additionalContext === "string" &&
      additionalContext.trim()
        ? { additionalContext: additionalContext.trim() }
        : {}),
    };
  } else if (bookingType === "mentor_me") {
    const topicResult = readRequiredString(
      details,
      "mentoringTopic",
      3,
      160,
    );
    if ("error" in topicResult) {
      return { valid: false, error: topicResult.error };
    }

    const goalsResult = readRequiredString(details, "goals", 10, 5000);
    if ("error" in goalsResult) {
      return { valid: false, error: goalsResult.error };
    }

    if (!isOneOf(EXPERIENCE_LEVELS, details.experienceLevel)) {
      return {
        valid: false,
        error: "A supported experience level is required.",
      };
    }

    if (!isOneOf(MEETING_FORMATS, details.preferredFormat)) {
      return {
        valid: false,
        error: "A supported preferred format is required.",
      };
    }

    const additionalContext = details.additionalContext;
    if (
      additionalContext !== undefined &&
      (typeof additionalContext !== "string" ||
        additionalContext.trim().length > 5000)
    ) {
      return {
        valid: false,
        error: "Additional context must be at most 5000 characters.",
      };
    }

    requestDetails = {
      mentoringTopic: topicResult.value,
      goals: goalsResult.value,
      experienceLevel: details.experienceLevel,
      preferredFormat: details.preferredFormat,
      ...(typeof additionalContext === "string" &&
      additionalContext.trim()
        ? { additionalContext: additionalContext.trim() }
        : {}),
    };
  } else {
    if (!isOneOf(MEETING_FORMATS, details.preferredFormat)) {
      return {
        valid: false,
        error: "A supported preferred format is required.",
      };
    }

    const timezoneResult = readRequiredString(details, "timezone", 1, 100);
    if ("error" in timezoneResult) {
      return { valid: false, error: timezoneResult.error };
    }

    const meetingStartResult = readRequiredString(
      body,
      "meetingStartAt",
      1,
      80,
    );
    if ("error" in meetingStartResult) {
      return { valid: false, error: meetingStartResult.error };
    }

    const parsedMeetingStart = new Date(meetingStartResult.value);
    if (
      Number.isNaN(parsedMeetingStart.getTime()) ||
      !/[zZ]|[+-]\d{2}:\d{2}$/.test(meetingStartResult.value)
    ) {
      return {
        valid: false,
        error:
          "meetingStartAt must be a valid ISO 8601 datetime with a timezone offset.",
      };
    }

    // Do not accept arbitrary durations from the client.
    if (
      body.meetingDurationMinutes !== undefined &&
      body.meetingDurationMinutes !== COFFEE_MEETING_DURATION_MINUTES
    ) {
      return {
        valid: false,
        error: `Coffee With Me meetings must be ${COFFEE_MEETING_DURATION_MINUTES} minutes.`,
      };
    }

    const additionalContext = details.additionalContext;
    if (
      additionalContext !== undefined &&
      (typeof additionalContext !== "string" ||
        additionalContext.trim().length > 5000)
    ) {
      return {
        valid: false,
        error: "Additional context must be at most 5000 characters.",
      };
    }

    meetingStartAt = parsedMeetingStart.toISOString();
    meetingDurationMinutes = COFFEE_MEETING_DURATION_MINUTES;

    requestDetails = {
      preferredFormat: details.preferredFormat,
      timezone: timezoneResult.value,
      ...(typeof additionalContext === "string" &&
      additionalContext.trim()
        ? { additionalContext: additionalContext.trim() }
        : {}),
    };
  }

  let idempotencyKey: string | undefined;

  if (body.idempotencyKey !== undefined) {
    if (
      typeof body.idempotencyKey !== "string" ||
      body.idempotencyKey.length < 8 ||
      body.idempotencyKey.length > 128 ||
      !IDEMPOTENCY_KEY_PATTERN.test(body.idempotencyKey)
    ) {
      return {
        valid: false,
        error:
          "idempotencyKey must be 8-128 characters and contain only letters, numbers, dots, underscores, colons, or hyphens.",
      };
    }

    idempotencyKey = body.idempotencyKey;
  }

  return {
    valid: true,
    data: {
      visitorId,
      bookingType,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      name,
      email,
      ...(projectTitle ? { projectTitle } : {}),
      ...(projectType ? { projectType } : {}),
      ...(description ? { description } : {}),
      ...(timeline ? { timeline } : {}),
      ...(budget !== undefined ? { budget } : {}),
      requestDetails,
      ...(meetingStartAt ? { meetingStartAt } : {}),
      ...(meetingDurationMinutes !== undefined
        ? { meetingDurationMinutes }
        : {}),
    },
  };
}
