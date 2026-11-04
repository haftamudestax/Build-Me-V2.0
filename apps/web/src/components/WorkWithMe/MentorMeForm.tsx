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

type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "other";
type MeetingFormat = "online" | "in_person";

interface MentorMeFormProps {
  onBack: () => void;
  onSubmitted: (reference: string) => void;
}

interface MentorMeFormData {
  name: string;
  email: string;
  mentoringTopic: string;
  goals: string;
  experienceLevel: ExperienceLevel;
  preferredFormat: MeetingFormat;
  additionalContext: string;
}

interface BookingResponse {
  data?: {
    id?: string;
    reference?: string;
    bookingType?: string;
    status?: string;
    createdAt?: string;
  };
  error?: string | { message?: string };
  message?: string;
}

type MentorMeAnalyticsEvent =
  | "mentor_me.selected"
  | "mentor_me.started"
  | "mentor_me.validation_failed"
  | "mentor_me.booking_submitted"
  | "mentor_me.confirmation_viewed"
  | "mentor_me.submission_failed";

const initialFormData: MentorMeFormData = {
  name: "",
  email: "",
  mentoringTopic: "",
  goals: "",
  experienceLevel: "beginner",
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

  return `mentor-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function trackBookingEvent(
  eventName: MentorMeAnalyticsEvent,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

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
  if (typeof response.error === "string") return response.error;
  if (response.error?.message) return response.error.message;

  return (
    response.message ??
    "Unable to submit your mentoring request. Please try again."
  );
}

export function MentorMeForm({ onBack, onSubmitted }: MentorMeFormProps) {
  const [formData, setFormData] = useState<MentorMeFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof MentorMeFormData>(
    field: K,
    value: MentorMeFormData[K],
  ): void {
    setFormData((previous) => ({ ...previous, [field]: value }));

    if (error) setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setError(null);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const mentoringTopic = formData.mentoringTopic.trim();
    const goals = formData.goals.trim();
    const additionalContext = formData.additionalContext.trim();

    let validationMessage: string | null = null;

    if (name.length < 2) {
      validationMessage = "Please enter your name using at least 2 characters.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationMessage = "Please enter a valid email address.";
    } else if (mentoringTopic.length < 3) {
      validationMessage =
        "Please describe your mentoring topic using at least 3 characters.";
    } else if (goals.length < 10) {
      validationMessage =
        "Please describe your goals using at least 10 characters.";
    }

    if (validationMessage) {
      setError(validationMessage);
      trackBookingEvent("mentor_me.validation_failed", {
        reason: "client_validation",
      });
      return;
    }

    const analyticsConfig = getAnalyticsConfig();
    const visitorId = analyticsConfig?.visitorId;

    if (!visitorId) {
      setError(
        "Your visitor session is not ready yet. Please refresh the page and try again.",
      );

      trackBookingEvent("mentor_me.validation_failed", {
        reason: "visitor_session_unavailable",
      });

      return;
    }

    setIsSubmitting(true);

    trackBookingEvent("mentor_me.started", {
      experienceLevel: formData.experienceLevel,
      preferredFormat: formData.preferredFormat,
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
          bookingType: "mentor_me",
          name,
          email,
          requestDetails: {
            mentoringTopic,
            goals,
            experienceLevel: formData.experienceLevel,
            preferredFormat: formData.preferredFormat,
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
      console.log("result:", result);
      trackBookingEvent("mentor_me.booking_submitted", {
        reference,
        bookingType: result.data?.bookingType ?? "mentor_me",
        status: result.data?.status,
      });

      onSubmitted(reference);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while submitting your mentoring request.";

      setError(message);

      trackBookingEvent("mentor_me.submission_failed", {
        reason: "booking_request_failed",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            Mentor Me
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Tell me what you want to learn, the challenges you are facing, and
            how you would prefer to work together.
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
          slotProps={{ htmlInput: { minLength: 2, autoComplete: "name" } }}
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
          slotProps={{ htmlInput: { autoComplete: "email" } }}
          required
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="What would you like mentoring on?"
          name="mentoringTopic"
          value={formData.mentoringTopic}
          onChange={(event) =>
            updateField("mentoringTopic", event.target.value)
          }
          slotProps={{ htmlInput: { minLength: 3 } }}
          helperText="For example, frontend development, backend architecture, or career growth."
          required
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="Your goals"
          name="goals"
          value={formData.goals}
          onChange={(event) => updateField("goals", event.target.value)}
          slotProps={{ htmlInput: { minLength: 10 } }}
          helperText="Describe what you want to achieve."
          required
          fullWidth
          multiline
          minRows={3}
          disabled={isSubmitting}
        />

        <TextField
          select
          label="Experience level"
          name="experienceLevel"
          value={formData.experienceLevel}
          onChange={(event) =>
            updateField(
              "experienceLevel",
              event.target.value as ExperienceLevel,
            )
          }
          required
          fullWidth
          disabled={isSubmitting}
        >
          <MenuItem value="beginner">Beginner</MenuItem>
          <MenuItem value="intermediate">Intermediate</MenuItem>
          <MenuItem value="advanced">Advanced</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>

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
          label="Additional context (optional)"
          name="additionalContext"
          value={formData.additionalContext}
          onChange={(event) =>
            updateField("additionalContext", event.target.value)
          }
          fullWidth
          multiline
          minRows={2}
          disabled={isSubmitting}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 1.5,
            pt: 1,
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
