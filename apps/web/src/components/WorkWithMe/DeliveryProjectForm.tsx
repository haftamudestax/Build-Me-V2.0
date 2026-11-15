import { useState, useRef, useEffect, type FormEvent } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@build-me/ui";
import { getAnalyticsConfig } from "@build-me/utils";

type BookingPackageTier = "beginner" | "intermediate" | "advanced";

const BOOKING_PACKAGE_PRICES: Record<BookingPackageTier, number> = {
  beginner: 499,
  intermediate: 999,
  advanced: 1499,
};

interface DeliveryProjectRequest {
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
  selectedPackage: BookingPackageTier;
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

const packageLabels: Record<BookingPackageTier, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

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
}

function CustomSelect({
  id,
  label,
  value,
  options,
  onChange,
  error,
  required = false,
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
        onClick={() => setIsOpen((prev) => !prev)}
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
          bgcolor: "#ffffff",
          cursor: "pointer",
          textAlign: "left",
          transition: "background-color 150ms ease",
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.03)",
          },
          "&:focus-visible": {
            outline: "2px solid var(--color-black, #000000)",
            outlineOffset: "2px",
          },
        }}
      >
        <span>{selectedOption ? selectedOption.label : label}</span>
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

export function DeliveryProjectForm({
  onBack,
  onSubmitted,
  selectedPackage,
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
          bookingType: "delivery_project",
          requestDetails: {
            package: {
              tier: selectedPackage,
            },
          },
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
              packageTier: selectedPackage,
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
        <Typography
          variant="h5"
          component="h3"
          sx={{ fontWeight: 800, color: "var(--color-dark-yellow)" }}
        >
          Deliver My Project
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Tell me about your project. Required fields are marked below.
        </Typography>

        <Typography
          variant="body2"
          sx={{ mt: 1.5, fontWeight: 700, color: "var(--color-light-yellow)" }}
        >
          Selected package: {packageLabels[selectedPackage]} — $
          {BOOKING_PACKAGE_PRICES[selectedPackage].toLocaleString("en-US")} USD
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

          <CustomSelect
            id="project-type"
            label="Project type"
            required
            value={form.projectType}
            onChange={(value) => updateField("projectType", value)}
            error={errors.projectType}
            options={[
              { label: "Website", value: "website" },
              { label: "Web application", value: "web_application" },
              { label: "Dashboard or admin portal", value: "dashboard" },
              { label: "API or integration", value: "api_integration" },
              { label: "Other", value: "other" },
            ]}
          />

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

          <CustomSelect
            id="preferred-timeline"
            label="Preferred timeline"
            required
            value={form.timeline}
            onChange={(value) => updateField("timeline", value)}
            error={errors.timeline}
            options={[
              { label: "As soon as possible", value: "asap" },
              { label: "Within one month", value: "1_month" },
              { label: "1–3 months", value: "1_to_3_months" },
              { label: "Flexible", value: "flexible" },
            ]}
          />

          <CustomSelect
            id="estimated-budget"
            label="Estimated budget (optional)"
            value={form.budget}
            onChange={(value) => updateField("budget", value)}
            options={[
              { label: "Not sure yet", value: "not_sure" },
              { label: "Under $1,000", value: "under_1000" },
              { label: "$1,000–$5,000", value: "1000_5000" },
              { label: "$5,000–$10,000", value: "5000_10000" },
              { label: "Over $10,000", value: "over_10000" },
            ]}
          />

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
            sx={{
              py: 1.4,
              fontWeight: 700,
              bgcolor: "var(--color-dark-yellow)",
            }}
          >
            {submitting ? "Submitting request…" : "Submit project request"}
          </Button>

          <Button
            type="button"
            variant="text"
            disabled={submitting}
            onClick={onBack}
            sx={{ color: "var(--color-light-yellow)" }}
          >
            Back to project paths
          </Button>
        </Box>
      </Card.Body>
    </Box>
  );
}
