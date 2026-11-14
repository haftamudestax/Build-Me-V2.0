export interface Registration {
  name: string;
  email: string;
  organisation: string;
}

export const emptyRegistration: Registration = {
  name: "",
  email: "",
  organisation: "",
};

export interface RegistrationErrors {
  name?: string;
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(
  values: Registration,
): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Please enter your name using at least 2 characters.";
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
}