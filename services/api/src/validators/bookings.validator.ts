
export const BOOKING_TIMELINES = [
 'ASAP',
  'Within a month',
  '1-3 months',
  'Flexible',
] as const;

export interface CreateBookingInput {
  visitorId: string;
  name: string;
  email: string;
  projectTitle: string;
  projectType: string;
  description: string;
  timeline: (typeof BOOKING_TIMELINES)[number];
  budget?: string | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateBooking(
  body: unknown,
):
  | { valid: true; data: CreateBookingInput }
  | { valid: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'A JSON object is required.' };
  }

  const input = body as Record<string, unknown>;

  const requiredFields = [
    'visitorId',
    'name',
    'email',
    'projectTitle',
    'projectType',
    'description',
    'timeline',
  ];

  for (const field of requiredFields) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      return {
        valid: false,
        error: `${field} is required.`,
      };
    }
  }

  const visitorId = (input.visitorId as string).trim();
  const name = (input.name as string).trim();
  const email = (input.email as string).trim();
  const projectTitle = (input.projectTitle as string).trim();
  const projectType = (input.projectType as string).trim();
  const description = (input.description as string).trim();
  const timeline = input.timeline as string;
  const budget = input.budget;

  if (!UUID_PATTERN.test(visitorId)) {
    return { valid: false, error: 'visitorId must be a valid UUID.' };
  }

  if (name.length < 2 || name.length > 120) {
    return {
      valid: false,
      error: 'Name must be between 2 and 120 characters.',
    };
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { valid: false, error: 'A valid email address is required.' };
  }

  if (projectTitle.length < 3 || projectTitle.length > 160) {
    return {
      valid: false,
      error: 'Project title must be between 3 and 160 characters.',
    };
  }

  if (projectType.length < 2 || projectType.length > 80) {
    return { valid: false, error: 'A valid project type is required.' };
  }

  if (description.length < 20 || description.length > 10000) {
    return {
      valid: false,
      error: 'Description must be between 20 and 10000 characters.',
    };
  }

  if (
    !BOOKING_TIMELINES.includes(
      timeline as (typeof BOOKING_TIMELINES)[number],
    )
  ) {
    return { valid: false, error: 'Unsupported project timeline.' };
  }

  if (
    budget !== undefined &&
    budget !== null &&
    (typeof budget !== 'string' || budget.length > 120)
  ) {
    return {
      valid: false,
      error: 'Budget must be a string of at most 120 characters.',
    };
  }

  return {
    valid: true,
    data: {
      visitorId,
      name,
      email,
      projectTitle,
      projectType,
      description,
      timeline: timeline as CreateBookingInput['timeline'],
      budget:
        typeof budget === 'string' && budget.trim()
          ? budget.trim()
          : null,
    },
  };
}
