import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { getAnalyticsConfig } from "@build-me/utils";

type BookingPackageTier = "beginner" | "intermediate" | "advanced";
type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "other";
type MeetingFormat = "online" | "in_person";

const BOOKING_PACKAGE_PRICES: Record<BookingPackageTier, number> = {
  beginner: 499,
  intermediate: 999,
  advanced: 1499,
};

const packageLabels: Record<BookingPackageTier, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface MentorMeFormProps {
  onBack: () => void;
  onSubmitted: (reference: string) => void;
  selectedPackage: BookingPackageTier;
}

interface MentorMeFormData {
  name: string;
  email: string;
  mentoringTopic: string;
  goals: string;
  experienceLevel: ExperienceLevel | "";
  preferredFormat: MeetingFormat | "";
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

interface CustomSelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  id: string;
  label: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

function CustomSelect({
  id,
  label,
  value,
  options,
  onChange,
  error,
  required = false,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{ position: "relative", width: "100%", boxSizing: "border-box" }}
    >
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{ fontWeight: 600, display: "block", mb: 0.4 }}
      >
        {label}
        {required && (
          <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
            *
          </Box>
        )}
      </Typography>

      <Box
        component="button"
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          boxSizing: "border-box",
          border: "1.5px solid",
          borderColor: error ? "error.main" : "var(--color-black, #000000)",
          borderRadius: 0,
          px: 2,
          py: 1.5,
          font: "inherit",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "var(--color-black, #000000)",
          bgcolor: disabled ? "action.disabledBackground" : "#ffffff",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          transition: "background-color 150ms ease",
          "&:hover": {
            bgcolor: disabled ? undefined : "rgba(0, 0, 0, 0.03)",
          },
          "&:focus-visible": {
            outline: "2px solid var(--color-black, #000000)",
            outlineOffset: "2px",
          },
        }}
      >
        <span>
          {selectedOption
            ? selectedOption.label
            : `Select ${label.toLowerCase()}`}
        </span>
        {isOpen ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
      </Box>

      {isOpen && (
        <Box
          sx={{
            position: "relative",
            mt: "8px",
            pl: 2.5,
            borderLeft: "2px solid",
            borderColor: "var(--color-black, #000000)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxSizing: "border-box",
            zIndex: 99,
          }}
        >
          {options.map((opt) => (
            <Box
              key={opt.value}
              component="button"
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                boxSizing: "border-box",
                border: "1.5px solid",
                borderColor: "var(--color-black, #000000)",
                borderRadius: 0,
                px: 2,
                py: 1.5,
                font: "inherit",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "var(--color-black, #000000)",
                bgcolor: "#ffffff",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 150ms ease, transform 150ms ease",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.05)",
                  transform: "translateX(2px)",
                },
              }}
            >
              <span>{opt.label}</span>
              <ArrowRight size={18} />
            </Box>
          ))}
        </Box>
      )}

      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 0.5, display: "block" }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}

export function MentorMeForm({
  onBack,
  onSubmitted,
  selectedPackage,
}: MentorMeFormProps) {
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
    } else if (!formData.experienceLevel) {
      validationMessage = "Please select your experience level.";
    } else if (!formData.preferredFormat) {
      validationMessage = "Please select your preferred meeting format.";
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
      packageTier: selectedPackage,
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
            package: {
              tier: selectedPackage,
            },
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

      trackBookingEvent("mentor_me.booking_submitted", {
        reference,
        bookingType: result.data?.bookingType ?? "mentor_me",
        status: result.data?.status,
        packageTier: selectedPackage,
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
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ color: "var(--color-dark-yellow)", fontWeight: 700 }}
          >
            Mentor Me
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Tell me what you want to learn, the challenges you are facing, and
            how you would prefer to work together.
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 1.5,
              fontWeight: 700,
              color: "var(--color-light-yellow)",
            }}
          >
            Selected package: {packageLabels[selectedPackage]} — $
            {BOOKING_PACKAGE_PRICES[selectedPackage].toLocaleString("en-US")}{" "}
            USD
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

        <CustomSelect
          id="experience-level"
          label="Experience level"
          required
          disabled={isSubmitting}
          value={formData.experienceLevel}
          onChange={(value) =>
            updateField("experienceLevel", value as ExperienceLevel)
          }
          options={[
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
            { label: "Other", value: "other" },
          ]}
        />

        <CustomSelect
          id="preferred-format"
          label="Preferred meeting format"
          required
          disabled={isSubmitting}
          value={formData.preferredFormat}
          onChange={(value) =>
            updateField("preferredFormat", value as MeetingFormat)
          }
          options={[
            { label: "Online", value: "online" },
            { label: "In person", value: "in_person" },
          ]}
        />

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
            sx={{
              width: { xs: "100%", sm: "auto" },
              borderColor: "var(--color-dark-yellow)",
              color: "var(--color-black)",
              bgcolor: "var(--color-dark-yellow)",
              py: 1.25,
              px: 3,
              borderRadius: "8px",
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "none",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "var(--color-light-yellow)",
                bgcolor: "var(--color-light-yellow)",
                boxShadow: "0 4px 12px rgba(247, 183, 51, 0.25)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Back
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            fullWidth
            sx={{
              width: { xs: "100%", sm: "auto" },
              borderColor: "var(--color-dark-yellow)",
              color: "var(--color-black)",
              bgcolor: "var(--color-dark-yellow)",
              py: 1.25,
              px: 3,
              borderRadius: "8px",
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "none",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "var(--color-light-yellow)",
                bgcolor: "var(--color-light-yellow)",
                boxShadow: "0 4px 12px rgba(247, 183, 51, 0.25)",
                transform: "translateY(-1px)",
              },
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit request"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
