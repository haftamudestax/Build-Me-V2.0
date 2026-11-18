import { useState, type CSSProperties } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  MessageSquareText,
  X,
} from "lucide-react";

import { Modal } from "@build-me/ui";
import { getAnalyticsConfig } from "@build-me/utils";

type FeedbackType = "rating" | "nps" | "issue" | "suggestion" | "complaint";
type FeedbackCategory = "business" | "platforms" | "partners";
type FeedbackStep = "type" | "details" | "confirmed";

interface FeedbackFormData {
  type: FeedbackType | "";
  category: FeedbackCategory | "";
  name: string;
  email: string;
  rating: number;
  npsScore: number | null;
  comments: string;
}

interface FeedbackResponse {
  data?: {
    id?: string;
    reference?: string;
    type?: string;
    status?: string;
    createdAt?: string;
  };
  error?: string;
  message?: string;
}

interface GiveFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

interface FeedbackFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}

interface ScoreSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  error?: string;
}

const TITLE_ID = "feedback-modal-title";

const INITIAL_FORM: FeedbackFormData = {
  type: "",
  category: "",
  name: "",
  email: "",
  rating: 0,
  npsScore: null,
  comments: "",
};

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
}[] = [
  { value: "rating", label: "Rate your experience" },
  { value: "nps", label: "Recommend Me" },
  { value: "issue", label: "Report an issue" },
  { value: "suggestion", label: "Share a suggestion" },
  { value: "complaint", label: "Make a complaint" },
];

const FEEDBACK_CATEGORIES: {
  value: FeedbackCategory;
  label: string;
}[] = [
  { value: "business", label: "Business" },
  { value: "platforms", label: "Platforms" },
  { value: "partners", label: "Partners" },
];

function createIdempotencyKey(): string {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function FeedbackField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  multiline = false,
  rows = 2,
  required = false,
}: FeedbackFieldProps) {
  const fieldSx = {
    width: "100%",
    boxSizing: "border-box",
    border: "1.5px solid",
    borderColor: error ? "error.main" : "var(--color-black)",
    borderRadius: 0,
    px: 1.25,
    py: 0.75,
    font: "inherit",
    fontSize: "0.875rem",
    color: "var(--color-black)",
    backgroundColor: "background.paper",
    outline: "none",
    transition: "border-color 160ms ease",
    "&:hover": {
      borderColor: "var(--color-black)",
    },
    "&:focus": {
      borderColor: "var(--color-black)",
    },
  };

  return (
    <Stack spacing={0.35}>
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{ fontWeight: 600, lineHeight: 1.3 }}
      >
        {label}
        {required && (
          <Box component="span" sx={{ color: "error.main", ml: 0.35 }}>
            *
          </Box>
        )}
      </Typography>

      {multiline ? (
        <Box
          component="textarea"
          id={id}
          name={id}
          value={value}
          rows={rows}
          required={required}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          sx={{
            ...fieldSx,
            resize: "vertical",
            minHeight: 52,
          }}
        />
      ) : (
        <Box
          component="input"
          id={id}
          name={id}
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          sx={{
            ...fieldSx,
            minHeight: 44,
          }}
        />
      )}

      {error && (
        <Typography
          id={`${id}-error`}
          role="alert"
          variant="caption"
          color="error"
          sx={{ lineHeight: 1.2 }}
        >
          {error}
        </Typography>
      )}
    </Stack>
  );
}

function ScoreSelector({
  value,
  onChange,
  min,
  max,
  minLabel,
  maxLabel,
  error,
}: ScoreSelectorProps) {
  const scores = Array.from(
    { length: max - min + 1 },
    (_, index) => min + index,
  );

  return (
    <Stack spacing={0.35}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {max === 5
          ? "How would you rate your experience?"
          : "How likely are you to recommend me?"}
        <Box component="span" sx={{ color: "error.main", ml: 0.35 }}>
          *
        </Box>
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          flexWrap: "wrap",
          gap: 0.25,
        }}
      >
        {scores.map((score) => (
          <Box
            key={score}
            component="button"
            type="button"
            onClick={() => onChange(score)}
            aria-pressed={value === score}
            aria-label={`Select score ${score}`}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 36px",
              width: 36,
              height: 32,
              border: "1.5px solid",
              borderColor:
                value === score
                  ? "var(--color-black)"
                  : "var(--color-border, #d1d5db)",
              borderRadius: 1.25,
              backgroundColor:
                value === score
                  ? "var(--color-dark-yellow)"
                  : "background.paper",
              color: "var(--color-black)",
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer",
              transition: "background-color 150ms ease",
              "&:hover": {
                backgroundColor: "var(--color-light-yellow)",
              },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 2,
              },
            }}
          >
            {score}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          maxWidth: max === 5 ? 190 : "100%",
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {minLabel}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {maxLabel}
        </Typography>
      </Box>

      {error && (
        <Typography role="alert" variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  );
}

export function GiveFeedbackModal({ open, onClose }: GiveFeedbackModalProps) {
  const [step, setStep] = useState<FeedbackStep>("type");
  const [form, setForm] = useState<FeedbackFormData>(INITIAL_FORM);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [detailsError, setDetailsError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  function updateForm<K extends keyof FeedbackFormData>(
    field: K,
    value: FeedbackFormData[K],
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setDetailsError("");
    setSubmitError("");
  }

  function handleSelectType(type: FeedbackType): void {
    setForm((current) => ({
      ...current,
      type,
    }));

    setDetailsError("");
    setSubmitError("");
    setIsCategoryOpen(false);
    setStep("details");
  }

  function validateDetails(): boolean {
    if (!form.type) {
      setDetailsError("Please select a feedback type.");
      return false;
    }

    if (!form.name.trim()) {
      setDetailsError("Please enter your name.");
      return false;
    }

    if (!form.email.trim()) {
      setDetailsError("Please enter your email address.");
      return false;
    }

    if (!isValidEmail(form.email)) {
      setDetailsError("Please enter a valid email address.");
      return false;
    }

    if (form.type === "rating" && (form.rating < 1 || form.rating > 5)) {
      setDetailsError("Please select a rating from 1 to 5.");
      return false;
    }

    if (
      form.type === "nps" &&
      (form.npsScore === null || form.npsScore < 0 || form.npsScore > 10)
    ) {
      setDetailsError("Please select an NPS score from 0 to 10.");
      return false;
    }

    if (
      (form.type === "issue" ||
        form.type === "suggestion" ||
        form.type === "complaint") &&
      !form.comments.trim()
    ) {
      setDetailsError("Please provide some details before continuing.");
      return false;
    }

    setDetailsError("");
    return true;
  }

  function handleBack(): void {
    if (step === "details") {
      setStep("type");
    }

    setIsCategoryOpen(false);
    setSubmitError("");
    setDetailsError("");
  }

  async function handleSubmit(): Promise<void> {
    if (!validateDetails()) return;

    const visitorId = getAnalyticsConfig()?.visitorId;

    if (!visitorId) {
      setSubmitError(
        "Your visitor session could not be initialized. Please refresh the page and try again.",
      );
      return;
    }

    const payload = {
      visitorId,
      type: form.type,
      ...(form.category ? { category: form.category } : {}),
      name: form.name.trim(),
      email: form.email.trim(),
      ...(form.type === "rating" ? { rating: form.rating } : {}),
      ...(form.type === "nps" ? { npsScore: form.npsScore } : {}),
      ...(form.comments.trim() ? { comments: form.comments.trim() } : {}),
    };

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response
        .json()
        .catch(() => ({}))) as FeedbackResponse;

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "We couldn't submit your feedback. Please try again.",
        );
      }

      const feedbackReference = result.data?.reference || result.data?.id;

      if (!feedbackReference) {
        throw new Error("The feedback response did not include a reference.");
      }

      setReference(feedbackReference);
      setStep("confirmed");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose(): void {
    if (isSubmitting) return;

    onClose();

    setStep("type");
    setForm(INITIAL_FORM);
    setIsCategoryOpen(false);
    setDetailsError("");
    setSubmitError("");
    setReference("");
    setIdempotencyKey(createIdempotencyKey());
  }

  async function handleCopyReference(): Promise<void> {
    if (!reference || !navigator.clipboard?.writeText) {
      setSubmitError("Clipboard access is unavailable in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(reference);
      setSubmitError("");
    } catch {
      setSubmitError("Unable to copy the feedback reference.");
    }
  }

  const selectedType = FEEDBACK_TYPES.find((item) => item.value === form.type);

  const selectedCategoryLabel =
    FEEDBACK_CATEGORIES.find((item) => item.value === form.category)?.label ??
    "Select a category";

  const isTextFeedback =
    form.type === "issue" ||
    form.type === "suggestion" ||
    form.type === "complaint";

  const isDetailsStepValid = (() => {
    if (!form.type) return false;
    if (!form.name.trim()) return false;
    if (!form.email.trim() || !isValidEmail(form.email)) return false;

    if (form.type === "rating" && (form.rating < 1 || form.rating > 5)) {
      return false;
    }

    if (
      form.type === "nps" &&
      (form.npsScore === null || form.npsScore < 0 || form.npsScore > 10)
    ) {
      return false;
    }

    if (isTextFeedback && !form.comments.trim()) {
      return false;
    }

    return true;
  })();

  const stepNumber = step === "type" ? 1 : 2;

  const nameError =
    detailsError === "Please enter your name." ? detailsError : "";

  const emailError =
    detailsError === "Please enter your email address." ||
    detailsError === "Please enter a valid email address."
      ? detailsError
      : "";

  const primaryActionSx = {
    color: "var(--color-black)",
    bgcolor: "var(--color-dark-yellow)",
    border: "2px solid var(--color-black)",
    "&:hover": {
      bgcolor: "var(--color-light-yellow)",
      borderColor: "var(--color-black)",
    },
    "&.Mui-disabled": {
      bgcolor: "action.disabledBackground",
      color: "text.disabled",
      borderColor: "divider",
    },
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      labelledBy={TITLE_ID}
      closeOnEscape
      size="lg"
      closeOnOverlayClick
    >
      <Box
        sx={{
          ...pageStyle,
          position: "relative",
          width: "100%",
          maxWidth: 960,
          maxHeight: "calc(100dvh - 32px)",
          marginInline: "auto",
          p: { xs: 1, sm: 0.5 },
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <IconButton
          type="button"
          onClick={handleClose}
          aria-label="Close feedback modal"
          title="Close"
          size="small"
          disabled={isSubmitting}
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 2,
            color: "text.secondary",
            backgroundColor: "background.paper",
            "&:hover": {
              backgroundColor: "action.hover",
              color: "text.primary",
            },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          }}
        >
          <X size={19} aria-hidden="true" />
        </IconButton>

        <Stack spacing={0.65}>
          <Stack spacing={0.1} sx={{ pr: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.4,
                color: "var(--color-dark-yellow)",
              }}
            >
              <MessageSquareText size={16} aria-hidden="true" />
              <Typography
                id={TITLE_ID}
                variant="subtitle2"
                sx={{ fontWeight: 700 }}
              >
                Give Feedback
              </Typography>
            </Box>
          </Stack>

          {step !== "confirmed" && (
            <Stack spacing={0.25}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Step {stepNumber} of 2
                </Typography>

                <Typography variant="caption" color="var(--color-dark-yellow)">
                  {Math.round((stepNumber / 2) * 100)}%
                </Typography>
              </Box>

              <Box
                sx={{
                  height: 3,
                  overflow: "hidden",
                  borderRadius: 10,
                  bgcolor: "action.hover",
                }}
              >
                <Box
                  sx={{
                    width: `${(stepNumber / 2) * 100}%`,
                    height: "100%",
                    bgcolor: "var(--color-light-yellow)",
                    borderRadius: 10,
                    transition: "width 160ms ease",
                  }}
                />
              </Box>
            </Stack>
          )}

          {step === "type" && (
            <Box sx={{ ...pageStyle, gap: 2 }}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                What would you like to share?
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 0.75,
                }}
              >
                {FEEDBACK_TYPES.map((item) => (
                  <Box
                    key={item.value}
                    component="button"
                    type="button"
                    onClick={() => handleSelectType(item.value)}
                    aria-label={item.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      width: "100%",
                      minHeight: 54,
                      px: 1.5,
                      py: 1,
                      border: "1.5px solid var(--color-black)",
                      borderRadius: 0,
                      backgroundColor: "background.paper",
                      color: "var(--color-black)",
                      cursor: "pointer",
                      textAlign: "left",
                      font: "inherit",
                      transition: "background-color 150ms ease",
                      "&:hover": {
                        borderColor: "var(--color-black)",
                        backgroundColor: "rgba(250, 204, 21, 0.12)",
                      },
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.label}
                    </Typography>

                    <ArrowRight
                      size={18}
                      strokeWidth={2}
                      aria-hidden="true"
                      style={{ flexShrink: 0 }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {step === "details" && (
            <Box
              component="form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              sx={{ ...pageStyle, gap: 3 }}
            >
              <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                {selectedType?.label ?? "Feedback details"}
              </Typography>

              {detailsError && !nameError && !emailError && (
                <Alert severity="error">{detailsError}</Alert>
              )}

              {submitError && <Alert severity="error">{submitError}</Alert>}

              {form.type === "rating" && (
                <ScoreSelector
                  value={form.rating || null}
                  onChange={(value) => updateForm("rating", value)}
                  min={1}
                  max={5}
                  minLabel="Poor"
                  maxLabel="Excellent"
                  error={
                    detailsError.includes("rating") && form.rating === 0
                      ? detailsError
                      : ""
                  }
                />
              )}

              {form.type === "nps" && (
                <ScoreSelector
                  value={form.npsScore}
                  onChange={(value) => updateForm("npsScore", value)}
                  min={0}
                  max={10}
                  minLabel="Not at all likely"
                  maxLabel="Extremely likely"
                  error={
                    detailsError.includes("NPS") && form.npsScore === null
                      ? detailsError
                      : ""
                  }
                />
              )}

              <Box
                sx={{
                  borderTop: "1px solid",
                  borderColor: "divider",
                  pt: 0.75,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 0.75,
                  }}
                >
                  <FeedbackField
                    id="feedback-email"
                    label="Your email"
                    type="email"
                    value={form.email}
                    onChange={(value) => updateForm("email", value)}
                    placeholder="you@example.com"
                    required
                    error={emailError}
                  />

                  <FeedbackField
                    id="feedback-name"
                    label="Your name"
                    value={form.name}
                    onChange={(value) => updateForm("name", value)}
                    placeholder="Enter your name"
                    required
                    error={nameError}
                  />
                </Box>
              </Box>

              <Stack spacing={0.35}>
                <Typography
                  id="feedback-category-label"
                  variant="body2"
                  sx={{ fontWeight: 600, lineHeight: 1.3 }}
                >
                  What is your feedback about?
                  <Box
                    component="span"
                    color="text.secondary"
                    sx={{ ml: 0.5, fontWeight: 400 }}
                  >
                    Optional
                  </Box>
                </Typography>

                <Box sx={{ width: "100%" }}>
                  <Box
                    component="button"
                    type="button"
                    aria-labelledby="feedback-category-label"
                    aria-expanded={isCategoryOpen}
                    onClick={() => setIsCategoryOpen((prev) => !prev)}
                    sx={{
                      width: "100%",
                      minHeight: 46,
                      px: 1.5,
                      py: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid",
                      borderColor: "var(--color-black)",
                      borderRadius: 0,
                      backgroundColor: "background.paper",
                      color: "var(--color-black)",
                      font: "inherit",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.02)",
                      },
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <span>{selectedCategoryLabel}</span>
                    <ArrowUp
                      size={16}
                      aria-hidden="true"
                      style={{
                        transform: isCategoryOpen
                          ? "rotate(0deg)"
                          : "rotate(180deg)",
                        transition: "transform 160ms ease",
                      }}
                    />
                  </Box>

                  {isCategoryOpen && (
                    <Box
                      sx={{
                        mt: 0.75,
                        pl: 1.25,
                        borderLeft: "1.5px solid var(--color-black)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.75,
                      }}
                    >
                      {FEEDBACK_CATEGORIES.map((category) => {
                        const isSelected = form.category === category.value;

                        return (
                          <Box
                            key={category.value}
                            component="button"
                            type="button"
                            onClick={() => {
                              updateForm("category", category.value);
                              setIsCategoryOpen(false);
                            }}
                            sx={{
                              width: "100%",
                              minHeight: 44,
                              px: 1.5,
                              py: 0.85,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              border: "1px solid",
                              borderColor: "var(--color-black)",
                              borderRadius: 0,
                              backgroundColor: isSelected
                                ? "rgba(250, 204, 21, 0.2)"
                                : "background.paper",
                              color: "var(--color-black)",
                              font: "inherit",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "background-color 140ms ease",
                              "&:hover": {
                                backgroundColor: "rgba(250, 204, 21, 0.14)",
                              },
                              "&:focus-visible": {
                                outline: "2px solid",
                                outlineColor: "primary.main",
                                outlineOffset: 2,
                              },
                            }}
                          >
                            <span>{category.label}</span>
                            <ArrowRight size={15} aria-hidden="true" />
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Stack>

              {isTextFeedback ? (
                <FeedbackField
                  id="feedback-comments"
                  label={
                    form.type === "issue"
                      ? "Describe the issue"
                      : form.type === "suggestion"
                        ? "Your suggestion"
                        : "Tell us about your experience"
                  }
                  value={form.comments}
                  onChange={(value) => updateForm("comments", value)}
                  placeholder={
                    form.type === "issue"
                      ? "What happened? What did you expect to happen?"
                      : form.type === "suggestion"
                        ? "What would you like us to improve?"
                        : "Please describe your concern..."
                  }
                  multiline
                  rows={2}
                  required
                />
              ) : (
                <FeedbackField
                  id="feedback-comments"
                  label="Additional"
                  value={form.comments}
                  onChange={(value) => updateForm("comments", value)}
                  placeholder="Your review"
                  multiline
                  rows={2}
                />
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  size="medium"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  startIcon={<ArrowLeft size={16} />}
                  sx={{
                    color: "var(--color-black)",
                    borderColor: "var(--color-black)",
                  }}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  disabled={isSubmitting || !isDetailsStepValid}
                  sx={primaryActionSx}
                >
                  {isSubmitting ? "Submitting..." : "Submit feedback"}
                </Button>
              </Box>
            </Box>
          )}

          {step === "confirmed" && (
            <Stack spacing={0.75}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "success.light",
                  color: "success.dark",
                }}
              >
                <Check size={22} aria-hidden="true" />
              </Box>

              <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                Thank you for your feedback!
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 500 }}
              >
                Your feedback has been successfully submitted. We appreciate you
                taking the time to help us improve Build Me.
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  p: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  bgcolor: "action.hover",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  FEEDBACK REFERENCE
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    mt: 0.15,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {reference}
                  </Typography>

                  <IconButton
                    aria-label="Copy feedback reference"
                    size="small"
                    onClick={() => void handleCopyReference()}
                  >
                    <Copy size={15} aria-hidden="true" />
                  </IconButton>
                </Box>
              </Box>

              {submitError && <Alert severity="error">{submitError}</Alert>}

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleClose}
                  sx={primaryActionSx}
                >
                  Done
                </Button>
              </Box>
            </Stack>
          )}
        </Stack>
      </Box>
    </Modal>
  );
}
