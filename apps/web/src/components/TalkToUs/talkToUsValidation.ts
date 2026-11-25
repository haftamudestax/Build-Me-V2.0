import {
  emptyRegistration,
  validateRegistration,
} from "../GetQuickWins/ownershipAudit/registration";

export const MESSAGE_MIN_LENGTH = 10;
export const MESSAGE_MAX_LENGTH = 1000;

export interface TalkToUsValues {
  name: string;
  email: string;
  message: string;
  /** Honeypot: real visitors never see or fill this. */
  website: string;
}

export interface TalkToUsErrors {
  name?: string;
  email?: string;
  message?: string;
}

export const emptyTalkToUs: TalkToUsValues = {
  name: "",
  email: "",
  message: "",
  website: "",
};

export function validateTalkToUs(values: TalkToUsValues): TalkToUsErrors {
  // Name and email use the same rules and wording as the other forms.
  const registration = validateRegistration({
    ...emptyRegistration,
    name: values.name,
    email: values.email,
  });

  const errors: TalkToUsErrors = {};

  if (registration.name) errors.name = registration.name;
  if (registration.email) errors.email = registration.email;

  const length = values.message.trim().length;

  if (length < MESSAGE_MIN_LENGTH) {
    errors.message = `Please write at least ${MESSAGE_MIN_LENGTH} characters so we know how to help.`;
  } else if (length > MESSAGE_MAX_LENGTH) {
    errors.message = `Please keep your message under ${MESSAGE_MAX_LENGTH} characters.`;
  }

  return errors;
}