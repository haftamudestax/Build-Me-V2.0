import { useState, type CSSProperties } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, ArrowRight, Check, Copy, Gift, X } from "lucide-react";

import { Modal } from "@build-me/ui";
import { getAnalyticsConfig } from "@build-me/utils";

type ReferralStep = "referrer" | "friend" | "review" | "confirmed";
type Relationship = "friend" | "family" | "colleague";

interface ReferralFormData {
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  relationship: Relationship | "";
  message: string;
}

interface ReferralResponse {
  data?: {
    id?: string;
    referralId?: string;
    reference?: string;
    status?: string;
    createdAt?: string;
  };
  error?: string;
  message?: string;
}

interface ReferralModalProps {
  open: boolean;
  onClose: () => void;
}

const TITLE_ID = "referral-modal-title";
const DESCRIPTION_ID = "referral-modal-description";

const INITIAL_FORM: ReferralFormData = {
  referrerName: "",
  referrerEmail: "",
  referredName: "",
  referredEmail: "",
  relationship: "",
  message: "",
};

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
};

function createIdempotencyKey(): string {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

interface ReferralFieldProps {
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

function ReferralField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  multiline = false,
  rows = 3,
  required = true,
}: ReferralFieldProps) {
  const fieldSx = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid",
    borderColor: error ? "error.main" : "divider",
    borderRadius: 2,
    px: 1.5,
    py: 0.5,
    font: "inherit",
    fontSize: "0.875rem",
    color: "text.primary",
    backgroundColor: "background.paper",
    outline: "none",
    transition: "border-color 160ms ease",
    "&:focus": {
      borderColor: "primary.main",
    },
  };

  return (
    <Stack spacing={0.4}>
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{ fontWeight: 600 }}
      >
        {label}
        {required && (
          <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
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
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          sx={{
            ...fieldSx,
            resize: "vertical",
            minHeight: 72,
          }}
        />
      ) : (
        <Box
          component="input"
          id={id}
          name={id}
          type={type}
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          sx={fieldSx}
        />
      )}

      {error && (
        <Typography
          id={`${id}-error`}
          role="alert"
          variant="caption"
          color="error"
        >
          {error}
        </Typography>
      )}
    </Stack>
  );
}

export function ReferralModal({ open, onClose }: ReferralModalProps) {
  const [step, setStep] = useState<ReferralStep>("referrer");
  const [form, setForm] = useState<ReferralFormData>(INITIAL_FORM);

  const [referrerError, setReferrerError] = useState("");
  const [friendError, setFriendError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState("");

  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  function updateForm<K extends keyof ReferralFormData>(
    field: K,
    value: ReferralFormData[K],
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "referrerName" || field === "referrerEmail") {
      setReferrerError("");
    }

    if (
      field === "referredName" ||
      field === "referredEmail" ||
      field === "relationship"
    ) {
      setFriendError("");
    }

    setSubmitError("");
  }

  function validateReferrer(): boolean {
    if (form.referrerName.trim().length < 2) {
      setReferrerError("Please enter your full name.");
      return false;
    }

    if (!isValidEmail(form.referrerEmail)) {
      setReferrerError("Please enter a valid email address.");
      return false;
    }

    setReferrerError("");
    return true;
  }

  function validateFriend(): boolean {
    if (form.referredName.trim().length < 2) {
      setFriendError("Please enter the person's name.");
      return false;
    }

    if (!isValidEmail(form.referredEmail)) {
      setFriendError("Please enter a valid email address.");
      return false;
    }

    if (!form.relationship) {
      setFriendError("Please select your relationship.");
      return false;
    }

    if (
      form.referrerEmail.trim().toLowerCase() ===
      form.referredEmail.trim().toLowerCase()
    ) {
      setFriendError("You cannot refer yourself.");
      return false;
    }

    setFriendError("");
    return true;
  }

  function handleNext(): void {
    if (step === "referrer") {
      if (!validateReferrer()) return;

      setStep("friend");
      return;
    }

    if (step === "friend") {
      if (!validateFriend()) return;

      setStep("review");
    }
  }

  function handleBack(): void {
    if (step === "friend") {
      setStep("referrer");
    } else if (step === "review") {
      setStep("friend");
    }

    setSubmitError("");
  }

  async function handleSubmit(): Promise<void> {
    if (!validateReferrer()) {
      setStep("referrer");
      return;
    }

    if (!validateFriend()) {
      setStep("friend");
      return;
    }

    const visitorId = getAnalyticsConfig()?.visitorId;

    if (!visitorId) {
      setSubmitError(
        "We couldn't verify your visitor session. Please refresh the page and try again.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          visitorId,
          referrerName: form.referrerName.trim(),
          referrerEmail: form.referrerEmail.trim(),
          referredName: form.referredName.trim(),
          referredEmail: form.referredEmail.trim(),
          relationship: form.relationship,
          message: form.message.trim() || undefined,
        }),
      });

      const result = (await response
        .json()
        .catch(() => ({}))) as ReferralResponse;

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "We couldn't submit your referral. Please try again.",
        );
      }

      const referralReference =
        result.data?.reference || result.data?.referralId || result.data?.id;

      if (!referralReference) {
        throw new Error("The referral response did not include a reference.");
      }

      setReference(referralReference);
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

    setStep("referrer");
    setForm(INITIAL_FORM);
    setReferrerError("");
    setFriendError("");
    setSubmitError("");
    setReference("");
    setIdempotencyKey(createIdempotencyKey());
  }

  async function handleCopyReference(): Promise<void> {
    if (!reference || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(reference);
    } catch {
      setSubmitError("Unable to copy the referral reference.");
    }
  }

  const stepNumber =
    step === "referrer" ? 1 : step === "friend" ? 2 : step === "review" ? 3 : 4;

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      labelledBy={TITLE_ID}
      describedBy={DESCRIPTION_ID}
      closeOnEscape
      closeOnOverlayClick
    >
      <div
        style={{
          ...pageStyle,
          position: "relative",
          maxWidth: 560,
          maxHeight: "min(680px, calc(100dvh - 32px))",
          marginInline: "auto",
          paddingTop: 10,
          overflow: "hidden",
        }}
      >
        <IconButton
          type="button"
          onClick={handleClose}
          aria-label="Close referral modal"
          title="Close"
          size="small"
          disabled={isSubmitting}
          sx={{
            position: "absolute",
            top: 2,
            right: 2,
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
          <X size={20} aria-hidden="true" />
        </IconButton>

        <div
          style={{
            ...pageStyle,
            flex: "1 1 auto",
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehaviorY: "contain",
            WebkitOverflowScrolling: "touch",
            padding: "2px 4px 8px",
          }}
        >
          <Stack spacing={0.25}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                color: "primary.main",
              }}
            >
              <Gift size={18} aria-hidden="true" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Share the opportunity
              </Typography>
            </Box>

            <Typography
              id={TITLE_ID}
              variant="h5"
              component="h2"
              sx={{ fontWeight: 700 }}
            >
              Refer Someone
            </Typography>

            <Typography
              id={DESCRIPTION_ID}
              variant="body2"
              color="text.secondary"
            >
              Know someone who could benefit from working together? Send a
              referral.
            </Typography>
          </Stack>

          {step !== "confirmed" && (
            <Stack spacing={0.6} sx={{ mt: 0.5 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Step {stepNumber} of 3
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {Math.round((stepNumber / 3) * 100)}%
                </Typography>
              </Box>

              <Box
                sx={{
                  height: 5,
                  overflow: "hidden",
                  borderRadius: 10,
                  bgcolor: "action.hover",
                }}
              >
                <Box
                  sx={{
                    width: `${(stepNumber / 3) * 100}%`,
                    height: "100%",
                    bgcolor: "primary.main",
                    borderRadius: 10,
                    transition: "width 160ms ease",
                  }}
                />
              </Box>
            </Stack>
          )}

          {step === "referrer" && (
            <Box
              component="form"
              id="referral-step-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                handleNext();
              }}
              sx={{ ...pageStyle, mt: 1 }}
            >
              <Stack spacing={0.15}>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 700 }}
                >
                  Your information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  First, tell us who is making the referral.
                </Typography>
              </Stack>

              {referrerError && <Alert severity="error">{referrerError}</Alert>}

              <ReferralField
                id="referrer-name"
                label="Your name"
                value={form.referrerName}
                placeholder="Enter your full name"
                onChange={(value) => updateForm("referrerName", value)}
              />

              <ReferralField
                id="referrer-email"
                label="Your email"
                type="email"
                value={form.referrerEmail}
                placeholder="you@example.com"
                onChange={(value) => updateForm("referrerEmail", value)}
              />

              <Box
                sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  endIcon={<ArrowRight size={16} />}
                >
                  Continue
                </Button>
              </Box>
            </Box>
          )}

          {step === "friend" && (
            <Box
              component="form"
              id="referral-step-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                handleNext();
              }}
              sx={{ ...pageStyle, mt: 1 }}
            >
              <Stack spacing={0.25}>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 700 }}
                >
                  Who are you referring?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share the person's contact details and how you know them.
                </Typography>
              </Stack>

              {friendError && <Alert severity="error">{friendError}</Alert>}

              <ReferralField
                id="referred-name"
                label="Their name"
                value={form.referredName}
                placeholder="Enter their full name"
                onChange={(value) => updateForm("referredName", value)}
              />

              <ReferralField
                id="referred-email"
                label="Their email"
                type="email"
                value={form.referredEmail}
                placeholder="friend@example.com"
                onChange={(value) => updateForm("referredEmail", value)}
              />

              <Stack spacing={0.4}>
                <Typography
                  component="label"
                  htmlFor="relationship"
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                >
                  Your relationship
                  <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                    *
                  </Box>
                </Typography>

                <Box
                  component="select"
                  id="relationship"
                  name="relationship"
                  value={form.relationship}
                  onChange={(event) =>
                    updateForm(
                      "relationship",
                      event.target.value as Relationship | "",
                    )
                  }
                  aria-invalid={Boolean(friendError && !form.relationship)}
                  sx={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    px: 1.5,
                    py: 1.1,
                    font: "inherit",
                    fontSize: "0.875rem",
                    color: "text.primary",
                    bgcolor: "background.paper",
                  }}
                >
                  <option value="">Select relationship</option>
                  <option value="friend">Friend</option>
                  <option value="family">Family</option>
                  <option value="colleague">Colleague</option>
                </Box>
              </Stack>

              <ReferralField
                id="referral-message"
                label="Personal message (optional)"
                value={form.message}
                required={false}
                multiline
                rows={2}
                placeholder="Add a short message..."
                onChange={(value) => updateForm("message", value)}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1.5,
                  mt: 0.5,
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  size="medium"
                  onClick={handleBack}
                  startIcon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  endIcon={<ArrowRight size={16} />}
                >
                  Review referral
                </Button>
              </Box>
            </Box>
          )}

          {step === "review" && (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Stack spacing={0.25}>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 700 }}
                >
                  Review your referral
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check the details before submitting.
                </Typography>
              </Stack>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    YOUR INFORMATION
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {form.referrerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {form.referrerEmail}
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    borderTop: "1px solid",
                    borderColor: "divider",
                    my: 1.25,
                  }}
                />

                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    PERSON YOU ARE REFERRING
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {form.referredName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {form.referredEmail}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {form.relationship}
                  </Typography>
                </Stack>

                {form.message.trim() && (
                  <>
                    <Box
                      sx={{
                        borderTop: "1px solid",
                        borderColor: "divider",
                        my: 1.25,
                      }}
                    />
                    <Stack spacing={0.25}>
                      <Typography variant="caption" color="text.secondary">
                        PERSONAL MESSAGE
                      </Typography>
                      <Typography variant="body2">{form.message}</Typography>
                    </Stack>
                  </>
                )}
              </Box>

              {submitError && <Alert severity="error">{submitError}</Alert>}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  size="medium"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  startIcon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  size="medium"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit referral"}
                </Button>
              </Box>
            </Stack>
          )}

          {step === "confirmed" && (
            <Stack spacing={0.75}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: "success.light",
                  color: "success.dark",
                }}
              >
                <Check size={28} aria-hidden="true" />
              </Box>

              <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                Referral submitted!
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 360 }}
              >
                Thank you for making a referral. Your submission has been
                received.
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  REFERRAL REFERENCE
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.75,
                    mt: 0.5,
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
                    aria-label="Copy referral reference"
                    size="small"
                    onClick={handleCopyReference}
                  >
                    <Copy size={16} />
                  </IconButton>
                </Box>
              </Box>

              {submitError && <Alert severity="error">{submitError}</Alert>}

              <Button variant="contained" onClick={handleClose}>
                Done
              </Button>
            </Stack>
          )}
        </div>
      </div>
    </Modal>
  );
}
