import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getAnalyticsConfig } from "@build-me/utils";

type MeetingFormat = "online" | "in_person";

interface CoffeeWithMeFormProps {
  onBack: () => void;
  onSubmitted: (reference: string) => void;
}

interface CoffeeWithMeFormData {
  name: string;
  email: string;
  meetingStartAt: string;
  preferredFormat: MeetingFormat;
  additionalContext: string;
}

interface BookingResponse {
  data?: {
    id?: string;
    reference?: string;
    bookingType?: string;
    status?: string;
  };
  error?: string | { message?: string };
  message?: string;
}

type CoffeeWithMeAnalyticsEvent =
  | "coffee_with_me.started"
  | "coffee_with_me.validation_failed"
  | "coffee_with_me.booking_submitted"
  | "coffee_with_me.submission_failed";

const COFFEE_MEETING_DURATION_MINUTES = 30;

const initialFormData: CoffeeWithMeFormData = {
  name: "",
  email: "",
  meetingStartAt: "",
  preferredFormat: "online",
  additionalContext: "",
};

function createIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `coffee-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function getLocalDateTimeMinimum(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function trackBookingEvent(
  eventName: CoffeeWithMeAnalyticsEvent,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("build-me:analytics", {
      detail: {
        eventName,
        metadata,
      },
    }),
  );
}

function getErrorMessage(response: BookingResponse): string {
  if (typeof response.error === "string") {
    return response.error;
  }

  if (response.error?.message) {
    return response.error.message;
  }

  return (
    response.message ??
    "Unable to submit your coffee meeting request. Please try again."
  );
}

export function CoffeeWithMeForm({
  onBack,
  onSubmitted,
}: CoffeeWithMeFormProps) {
  const [formData, setFormData] =
    useState<CoffeeWithMeFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minimumDateTime, setMinimumDateTime] = useState(
    getLocalDateTimeMinimum,
  );

  function updateField<K extends keyof CoffeeWithMeFormData>(
    field: K,
    value: CoffeeWithMeFormData[K],
  ): void {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const additionalContext = formData.additionalContext.trim();

    let validationMessage: string | null = null;

    if (name.length < 2) {
      validationMessage = "Please enter your name using at least 2 characters.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationMessage = "Please enter a valid email address.";
    } else if (!formData.meetingStartAt) {
      validationMessage = "Please select your preferred meeting date and time.";
    }

    const selectedDate = formData.meetingStartAt
      ? new Date(formData.meetingStartAt)
      : null;

    if (
      !validationMessage &&
      (!selectedDate || Number.isNaN(selectedDate.getTime()))
    ) {
      validationMessage = "Please select a valid meeting date and time.";
    } else if (
      !validationMessage &&
      selectedDate &&
      selectedDate.getTime() <= Date.now()
    ) {
      validationMessage = "Please select a meeting time in the future.";
    }

    if (validationMessage) {
      setError(validationMessage);
      trackBookingEvent("coffee_with_me.validation_failed", {
        reason: "client_validation",
      });
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!timezone) {
      setError("Unable to determine your timezone. Please try again.");
      trackBookingEvent("coffee_with_me.validation_failed", {
        reason: "timezone_unavailable",
      });
      return;
    }

    const analyticsConfig = getAnalyticsConfig();
    const visitorId = analyticsConfig?.visitorId;

    if (!visitorId) {
      setError(
        "Your visitor session is not ready yet. Please refresh the page and try again.",
      );
      trackBookingEvent("coffee_with_me.validation_failed", {
        reason: "visitor_session_unavailable",
      });
      return;
    }

    // Capture the validated date before starting the asynchronous request.
    const meetingStartAt = selectedDate!.toISOString();

    setIsSubmitting(true);

    trackBookingEvent("coffee_with_me.started", {
      preferredFormat: formData.preferredFormat,
      meetingDurationMinutes: COFFEE_MEETING_DURATION_MINUTES,
    });

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": createIdempotencyKey(),
        },
        body: JSON.stringify({
          visitorId,
          bookingType: "coffee_with_me",
          name,
          email,
          meetingStartAt,
          meetingDurationMinutes: COFFEE_MEETING_DURATION_MINUTES,
          requestDetails: {
            preferredFormat: formData.preferredFormat,
            timezone,
            ...(additionalContext ? { additionalContext } : {}),
          },
        }),
      });

      const result = (await response
        .json()
        .catch(() => ({}))) as BookingResponse;

      if (!response.ok) {
        throw new Error(getErrorMessage(result));
      }

      const reference = result.data?.reference ?? result.data?.id;

      if (!reference) {
        throw new Error(
          "Your request may have been received, but no booking reference was returned. Please contact us before submitting again.",
        );
      }

      trackBookingEvent("coffee_with_me.booking_submitted", {
        reference,
        bookingType: result.data?.bookingType ?? "coffee_with_me",
        status: result.data?.status,
      });

      onSubmitted(reference);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while submitting your coffee meeting request.";

      setError(message);

      trackBookingEvent("coffee_with_me.submission_failed", {
        reason: "booking_request_failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function refreshMinimumDateTime(): void {
    setMinimumDateTime(getLocalDateTimeMinimum());
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ width: "100%", minWidth: 0 }}
    >
      <Stack spacing={2.5} sx={{ minWidth: 0 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Coffee With Me
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Request a 30-minute conversation. Your preferred time is subject to
            availability and confirmation.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}

        <TextField
          label="Full name"
          name="name"
          value={formData.name}
          onChange={(event) => updateField("name", event.target.value)}
          slotProps={{
            htmlInput: { minLength: 2, autoComplete: "name" },
          }}
          required
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="Email address"
          name="email"
          type="email"
          value={formData.email}
          onChange={(event) => updateField("email", event.target.value)}
          slotProps={{
            htmlInput: { autoComplete: "email" },
          }}
          required
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="Preferred meeting date and time"
          name="meetingStartAt"
          type="datetime-local"
          value={formData.meetingStartAt}
          onFocus={refreshMinimumDateTime}
          onChange={(event) =>
            updateField("meetingStartAt", event.target.value)
          }
          slotProps={{
            htmlInput: { min: minimumDateTime },
            inputLabel: { shrink: true },
          }}
          helperText="Choose a future time in your local timezone. Availability must still be confirmed."
          required
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          select
          label="Preferred meeting format"
          name="preferredFormat"
          value={formData.preferredFormat}
          onChange={(event) =>
            updateField("preferredFormat", event.target.value as MeetingFormat)
          }
          required
          fullWidth
          disabled={isSubmitting}
        >
          <MenuItem value="online">Online</MenuItem>
          <MenuItem value="in_person">In person</MenuItem>
        </TextField>

        <TextField
          label="What would you like to discuss? (optional)"
          name="additionalContext"
          value={formData.additionalContext}
          onChange={(event) =>
            updateField("additionalContext", event.target.value)
          }
          fullWidth
          multiline
          minRows={3}
          disabled={isSubmitting}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 1.5,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={onBack}
            disabled={isSubmitting}
            fullWidth
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Back
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            fullWidth
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {isSubmitting ? "Submitting..." : "Submit request"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
