import { useRef, useState, type FormEvent } from "react";
import { Box, Stack, TextField } from "@mui/material";

import {
  validateRegistration,
  type Registration,
  type RegistrationErrors,
} from "../ownershipAudit/registration";

import { StepFooter, StepHeader } from "../ownershipAudit/StepParts";
import { trackLearningCircle } from "./learningCircleAnalytics";

interface LearningCircleRegistrationStepProps {
  values: Registration;
  onChange: (values: Registration) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function LearningCircleRegistrationStep({
  values,
  onChange,
  onBack,
  onSubmit,
}: LearningCircleRegistrationStepProps) {
  const [errors, setErrors] = useState<RegistrationErrors>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof Registration>(
    field: K,
    value: Registration[K],
  ): void {
    onChange({ ...values, [field]: value });

    if (field === "name" || field === "email") {
      setErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const found = validateRegistration(values);
    setErrors(found);

    const invalidFields = Object.keys(found);

    if (invalidFields.length > 0) {
      trackLearningCircle("ownership_learning_circle.validation_failed", {
        step: 2,
        fields: invalidFields,
      });

      if (found.name) {
        nameRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }

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
          eyebrow="Step 2 of 3"
          title="Join the Learning Circle"
          description="Tell us a little about yourself before joining the Technology Ownership Learning Circle."
        />

        <TextField
          label="Full name"
          name="name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={Boolean(errors.name)}
          helperText={errors.name}
          inputRef={nameRef}
          slotProps={{
            htmlInput: { autoComplete: "name" },
          }}
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
          slotProps={{
            htmlInput: { autoComplete: "email" },
          }}
          required
          fullWidth
        />

        <TextField
          label="Organisation (optional)"
          name="organisation"
          value={values.organisation}
          onChange={(event) => updateField("organisation", event.target.value)}
          slotProps={{
            htmlInput: { autoComplete: "organization" },
          }}
          fullWidth
        />

        <StepFooter
          previous={{
            label: "Previous",
            onClick: onBack,
          }}
          next={{
            label: "Continue to the Learning Circle",
            type: "submit",
          }}
        />
      </Stack>
    </Box>
  );
}
