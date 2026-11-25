import { useRef, useState, type FormEvent } from "react";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";

import { trackTalkToUs } from "./talkToUsAnalytics";
import {
  createIdempotencyKey,
  submitTalkToUsMessage,
  TalkToUsSubmitError,
  type TalkToUsReceipt,
} from "./talkToUsSubmit";
import {
  MESSAGE_MAX_LENGTH,
  validateTalkToUs,
  type TalkToUsErrors,
  type TalkToUsValues,
} from "./talkToUsValidation";

interface TalkToUsMessageFormProps {
  values: TalkToUsValues;
  onChange: (values: TalkToUsValues) => void;
  onSent: (receipt: TalkToUsReceipt) => void;
}

export function TalkToUsMessageForm({
  values,
  onChange,
  onSent,
}: TalkToUsMessageFormProps) {
  const [errors, setErrors] = useState<TalkToUsErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  // One key per form, so a retry after a network error is not sent twice.
  const idempotencyKey = useRef(createIdempotencyKey());

  function updateField<K extends keyof TalkToUsValues>(
    field: K,
    value: TalkToUsValues[K],
  ): void {
    onChange({ ...values, [field]: value });

    if (field === "name" || field === "email" || field === "message") {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isSubmitting) return;

    const found = validateTalkToUs(values);
    setErrors(found);

    const invalidFields = Object.keys(found);

    if (invalidFields.length > 0) {
      trackTalkToUs("talk_to_us.validation_failed", { fields: invalidFields });

      if (found.name) nameRef.current?.focus();
      else if (found.email) emailRef.current?.focus();
      else messageRef.current?.focus();

      return;
    }

    // Honeypot: a bot filled the hidden field. Look successful, send nothing.
    if (values.website.trim() !== "") {
      trackTalkToUs("talk_to_us.message_blocked");
      onSent({ reference: "RECEIVED" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const message = values.message.trim();

    try {
      const receipt = await submitTalkToUsMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        message,
        idempotencyKey: idempotencyKey.current,
      });

      trackTalkToUs("talk_to_us.message_sent", {
        messageLength: message.length,
      });
      onSent(receipt);
    } catch (error) {
      const known = error instanceof TalkToUsSubmitError ? error : null;

      setSubmitError(
        known?.message ?? "Something went wrong. Please try again.",
      );
      trackTalkToUs("talk_to_us.message_failed", {
        reason: known?.code ?? "unknown",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      sx={{ width: "100%", minWidth: 0, position: "relative" }}
    >
      <Stack spacing={2.5}>
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
          label="Message"
          name="message"
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
          error={Boolean(errors.message)}
          helperText={
            errors.message ??
            `${values.message.trim().length}/${MESSAGE_MAX_LENGTH}`
          }
          inputRef={messageRef}
          multiline
          minRows={4}
          required
          fullWidth
        />

        {/* Honeypot: hidden from people and screen readers. */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: "-10000px",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          <TextField
            label="Website"
            name="website"
            value={values.website}
            onChange={(event) => updateField("website", event.target.value)}
            slotProps={{ htmlInput: { tabIndex: -1, autoComplete: "off" } }}
          />
        </Box>

        {submitError && <Alert severity="error">{submitError}</Alert>}

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          className="rounded-lg bg-dark-yellow! px-6 py-3 font-bold normal-case text-black! hover:bg-light-yellow!"
          sx={{ alignSelf: { sm: "flex-start" } }}
        >
          {isSubmitting ? "Sending..." : "Send message"}
        </Button>
      </Stack>
    </Box>
  );
}
