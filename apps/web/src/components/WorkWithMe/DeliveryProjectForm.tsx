import { useState, type FormEvent } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { Card } from "@build-me/ui";
import { getAnalyticsConfig } from "@build-me/utils";

export interface DeliveryProjectRequest {
  name: string;
  email: string;
  projectTitle: string;
  projectType: string;
  description: string;
  timeline: string;
  budget: string;
}

interface DeliveryProjectFormProps {
  onBack: () => void;
  onSubmitted: (reference: string) => void;
}

interface CreateBookingResponse {
  data?: {
    id?: string;
    reference?: string;
    bookingType?: string;
    status?: string;
    createdAt?: string;
  };
  error?: string;
}

const initialForm: DeliveryProjectRequest = {
  name: "",
  email: "",
  projectTitle: "",
  projectType: "",
  description: "",
  timeline: "",
  budget: "",
};

const timelineLabels: Record<string, string> = {
  asap: "ASAP",
  "1_month": "Within a month",
  "1_to_3_months": "1-3 months",
  flexible: "Flexible",
};

export function DeliveryProjectForm({
  onBack,
  onSubmitted,
}: DeliveryProjectFormProps) {
  const [form, setForm] = useState<DeliveryProjectRequest>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DeliveryProjectRequest, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function updateField(field: keyof DeliveryProjectRequest, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof DeliveryProjectRequest, string>> =
      {};

    if (form.name.trim().length < 2) {
      nextErrors.name = "Enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.projectTitle.trim().length < 3) {
      nextErrors.projectTitle = "Enter a project title.";
    }

    if (!form.projectType) {
      nextErrors.projectType = "Choose a project type.";
    }

    if (form.description.trim().length < 20) {
      nextErrors.description =
        "Describe your project in at least 20 characters.";
    }

    if (!form.timeline || !timelineLabels[form.timeline]) {
      nextErrors.timeline = "Choose your preferred timeline.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!validate()) {
      window.dispatchEvent(
        new CustomEvent("build-me:analytics", {
          detail: {
            eventName: "delivery_project.validation_failed",
          },
        }),
      );
      return;
    }

    const analyticsConfig = getAnalyticsConfig();
    const visitorId = analyticsConfig?.visitorId;

    if (!visitorId) {
      setSubmitError(
        "Your visitor session could not be initialized. Please refresh the page and try again.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          projectTitle: form.projectTitle.trim(),
          projectType: form.projectType,
          description: form.description.trim(),
          timeline: timelineLabels[form.timeline],
          budget: form.budget || null,
          visitorId,
          type: "delivery_project",
        }),
      });

      const result: CreateBookingResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ?? "We couldn't submit your request. Please try again.",
        );
      }

      // The API returns the booking reference inside `data`.
      const reference = result.data?.reference ?? result.data?.id;

      if (!reference) {
        throw new Error(
          "Your request may have been created, but its reference could not be retrieved. Please contact support before submitting again.",
        );
      }

      window.dispatchEvent(
        new CustomEvent("build-me:analytics", {
          detail: {
            eventName: "delivery_project.submitted",
            metadata: {
              reference,
              bookingType: result.data?.bookingType ?? "delivery_project",
            },
          },
        }),
      );

      onSubmitted(reference);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please check your connection or contact support before retrying.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Card.Header>
        <Typography variant="h5" component="h3" sx={{ fontWeight: 800 }}>
          Deliver My Project
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Tell me about your project. Required fields are marked below.
        </Typography>
      </Card.Header>

      <Card.Body>
        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Full name"
            required
            fullWidth
            autoComplete="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
          />

          <TextField
            label="Email address"
            type="email"
            required
            fullWidth
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />

          <TextField
            label="Project title"
            required
            fullWidth
            value={form.projectTitle}
            onChange={(event) =>
              updateField("projectTitle", event.target.value)
            }
            error={Boolean(errors.projectTitle)}
            helperText={errors.projectTitle}
          />

          <TextField
            select
            label="Project type"
            required
            fullWidth
            value={form.projectType}
            onChange={(event) => updateField("projectType", event.target.value)}
            error={Boolean(errors.projectType)}
            helperText={errors.projectType}
          >
            <MenuItem value="website">Website</MenuItem>
            <MenuItem value="web_application">Web application</MenuItem>
            <MenuItem value="dashboard">Dashboard or admin portal</MenuItem>
            <MenuItem value="api_integration">API or integration</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>

          <TextField
            label="Project description"
            required
            fullWidth
            multiline
            minRows={4}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            error={Boolean(errors.description)}
            helperText={
              errors.description ??
              "At least 20 characters. Explain what you want to achieve."
            }
          />

          <TextField
            select
            label="Preferred timeline"
            required
            fullWidth
            value={form.timeline}
            onChange={(event) => updateField("timeline", event.target.value)}
            error={Boolean(errors.timeline)}
            helperText={errors.timeline}
          >
            <MenuItem value="asap">As soon as possible</MenuItem>
            <MenuItem value="1_month">Within one month</MenuItem>
            <MenuItem value="1_to_3_months">1–3 months</MenuItem>
            <MenuItem value="flexible">Flexible</MenuItem>
          </TextField>

          <TextField
            select
            label="Estimated budget (optional)"
            fullWidth
            value={form.budget}
            onChange={(event) => updateField("budget", event.target.value)}
          >
            <MenuItem value="not_sure">Not sure yet</MenuItem>
            <MenuItem value="under_1000">Under $1,000</MenuItem>
            <MenuItem value="1000_5000">$1,000–$5,000</MenuItem>
            <MenuItem value="5000_10000">$5,000–$10,000</MenuItem>
            <MenuItem value="over_10000">Over $10,000</MenuItem>
          </TextField>

          {submitError && (
            <Typography role="alert" color="error">
              {submitError}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            fullWidth
            sx={{ py: 1.4, fontWeight: 700 }}
          >
            {submitting ? "Submitting request…" : "Submit project request"}
          </Button>

          <Button
            type="button"
            variant="text"
            disabled={submitting}
            onClick={onBack}
          >
            Back to project paths
          </Button>
        </Box>
      </Card.Body>
    </Box>
  );
}
