import { useRef, useState, type FormEvent } from "react";
import { Box, Stack, TextField } from "@mui/material";

import { trackEvent } from "./analytics";
import type { Registration } from "./registration";
import { StepFooter, StepHeader } from "./StepParts";

interface RegistrationErrors {
  name?: string;
  email?: string;
}

interface OwnershipAuditRegistrationProps {
  values: Registration;
  onChange: (values: Registration) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: Registration): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Please enter your name using at least 2 characters.";
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
}

export function OwnershipAuditRegistration({
  values,
  onChange,
  onBack,
  onSubmit,
}: OwnershipAuditRegistrationProps) {
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof Registration>(
    field: K,
    value: Registration[K],
  ): void {
    onChange({ ...values, [field]: value });

    if (field === "name" || field === "email") {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const found = validate(values);
    setErrors(found);

    const invalidFields = Object.keys(found);

    if (invalidFields.length > 0) {
      trackEvent("ownership_audit.validation_failed", {
        step: 2,
        fields: invalidFields,
      });

      // Move focus to the first problem so keyboard and screen reader users
      // land on it.
      if (found.name) nameRef.current?.focus();
      else emailRef.current?.focus();

      return;
    }

    onSubmit();
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      sx={{ width: "100%", minWidth: 0 }}
    >
      <Stack spacing={2.5}>
        <StepHeader
          eyebrow="Step 2 of 5"
          title="Register for your audit"
          description="Tell us who you are so your results are prepared for you."
        />

        <TextField
          label="Full name"
          name="name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={Boolean(errors.name)}
          helperText={errors.name}
          inputRef={nameRef}
          slotProps={{ htmlInput: { autoComplete: "name" } }}
          required
          fullWidth
        />

        <TextField
          label="Email address"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={Boolean(errors.email)}
          helperText={errors.email}
          inputRef={emailRef}
          slotProps={{ htmlInput: { autoComplete: "email" } }}
          required
          fullWidth
        />

        <TextField
          label="Organisation (optional)"
          name="organisation"
          value={values.organisation}
          onChange={(event) => updateField("organisation", event.target.value)}
          slotProps={{ htmlInput: { autoComplete: "organization" } }}
          fullWidth
        />

        <StepFooter
          previous={{ label: "Previous", onClick: onBack }}
          next={{ label: "Next", type: "submit" }}
        />
      </Stack>
    </Box>
  );
}
