import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Alert, Button, IconButton, Typography } from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coffee,
  Copy,
  FolderKanban,
  GraduationCap,
  ShieldCheck,
  X,
} from "lucide-react";

import { Modal } from "@build-me/ui";
import { CoffeeWithMeForm } from "./CoffeeWithMeForm";
import { DeliveryProjectForm } from "./DeliveryProjectForm";
import { MentorMeForm } from "./MentorMeForm";
import { OwnershipAudit } from "./OwnershipAudit";

type JourneyStep =
  | "paths"
  | "delivery"
  | "mentor"
  | "coffee"
  | "ownership_audit"
  | "confirmed";

type BookingPath = "delivery_project" | "mentor_me" | "coffee_with_me";

interface Confirmation {
  reference: string;
  bookingType: BookingPath;
}

interface PathDetails {
  title: string;
  description: string;
  confirmationMessage: string;
  icon: ReactNode;
}

const bookingPathDetails: Record<BookingPath, PathDetails> = {
  delivery_project: {
    title: "Deliver My Project",
    description:
      "Plan and build a digital project with a focus on quality, maintainability, and delivery.",
    confirmationMessage:
      "Your project request has been submitted. I'll review the details and follow up.",
    icon: <FolderKanban size={28} aria-hidden="true" />,
  },
  mentor_me: {
    title: "Mentor Me",
    description:
      "Get guidance on technology, software development, problem-solving, and professional growth.",
    confirmationMessage:
      "Your mentoring request has been submitted. I'll review your goals and follow up.",
    icon: <GraduationCap size={28} aria-hidden="true" />,
  },
  coffee_with_me: {
    title: "Coffee With Me",
    description:
      "Schedule a 30-minute conversation to discuss ideas, technology, collaboration, or career opportunities.",
    confirmationMessage:
      "Your Coffee With Me request has been submitted. I'll review your preferred meeting time and follow up to confirm availability.",
    icon: <Coffee size={28} aria-hidden="true" />,
  },
};

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
};

const pathGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 16,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const pathButtonStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 12,
  width: "100%",
  minWidth: 0,
  minHeight: 180,
  boxSizing: "border-box",
  padding: 20,
  border: "1px solid var(--mui-palette-divider, #d9dfe8)",
  borderRadius: 12,
  background: "transparent",
  color: "inherit",
  textAlign: "left",
  font: "inherit",
  cursor: "pointer",
  transition: "border-color 160ms ease, background-color 160ms ease",
  overflowWrap: "anywhere",
};

const footerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
};

function trackJourneyEvent(eventName: string): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("build-me:analytics", {
      detail: { eventName },
    }),
  );
}

interface PathCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onSelect: () => void;
}

function PathCard({ title, description, icon, onSelect }: PathCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    // Native buttons already support Enter and Space.
    // Leave activation to the browser to avoid duplicate click events.
    if (event.key === "Enter" || event.key === " ") {
      return;
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...pathButtonStyle,
        borderColor:
          isFocused || isHovered
            ? "var(--mui-palette-primary-main, #1976d2)"
            : pathButtonStyle.borderColor,
        backgroundColor: isHovered
          ? "var(--mui-palette-action-hover, rgba(0, 0, 0, 0.04))"
          : "transparent",
        outline: isFocused
          ? "2px solid var(--mui-palette-primary-main, #1976d2)"
          : "none",
        outlineOffset: 2,
      }}
      aria-label={`${title}: ${description}`}
    >
      <span
        style={{
          display: "inline-flex",
          color: "var(--mui-palette-primary-main, #1976d2)",
        }}
      >
        {icon}
      </span>

      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          width: "100%",
          minWidth: 0,
          fontWeight: 600,
          fontSize: "1rem",
        }}
      >
        <span>{title}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </span>

      <span
        style={{
          fontSize: "0.875rem",
          lineHeight: 1.6,
          color: "var(--mui-palette-text-secondary, #666)",
          overflowWrap: "anywhere",
        }}
      >
        {description}
      </span>
    </button>
  );
}

export function WorkWithMeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<JourneyStep>("paths");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  function openModal(): void {
    setStep("paths");
    setConfirmation(null);
    setCopyError(null);
    setIsOpen(true);
    trackJourneyEvent("work_with_me.opened");
  }

  function closeModal(): void {
    setIsOpen(false);
    trackJourneyEvent("work_with_me.closed");
  }

  function selectPath(
    nextStep: Exclude<JourneyStep, "paths" | "confirmed" | "ownership_audit">,
  ): void {
    const bookingType: BookingPath =
      nextStep === "delivery"
        ? "delivery_project"
        : nextStep === "mentor"
          ? "mentor_me"
          : "coffee_with_me";

    setStep(nextStep);
    setCopyError(null);
    trackJourneyEvent(`${bookingType}.selected`);
  }

  function selectOwnershipAudit(): void {
    setStep("ownership_audit");
    setCopyError(null);

    trackJourneyEvent("ownership_audit.selected");
    trackJourneyEvent("ownership_audit.started");
  }

  function handleBackToPaths(): void {
    const currentBookingType: BookingPath | null =
      step === "delivery"
        ? "delivery_project"
        : step === "mentor"
          ? "mentor_me"
          : step === "coffee"
            ? "coffee_with_me"
            : null;

    if (currentBookingType) {
      trackJourneyEvent(`${currentBookingType}.back_to_paths`);
    } else if (step === "ownership_audit") {
      trackJourneyEvent("ownership_audit.back_to_paths");
    }

    setStep("paths");
    setCopyError(null);
  }

  function handleSubmitted(bookingType: BookingPath, reference: string): void {
    setConfirmation({ bookingType, reference });
    setStep("confirmed");
    setCopyError(null);
    trackJourneyEvent(`${bookingType}.confirmation_viewed`);
  }

  async function copyReference(): Promise<void> {
    if (!confirmation) return;

    setCopyError(null);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable in this browser.");
      }

      await navigator.clipboard.writeText(confirmation.reference);
      trackJourneyEvent("work_with_me.reference_copied");
    } catch {
      setCopyError(
        "Unable to copy the reference automatically. Please select and copy it manually.",
      );
    }
  }

  const currentPath = confirmation
    ? bookingPathDetails[confirmation.bookingType]
    : null;

  return (
    <>
      <Button
        type="button"
        variant="contained"
        onClick={openModal}
        aria-haspopup="dialog"
      >
        Work With Me
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        labelledBy="work-with-me-title"
        describedBy="work-with-me-description"
        closeOnEscape
        closeOnOverlayClick
      >
        <div
          style={{
            ...pageStyle,
            position: "relative",
            maxWidth: 600,
            maxHeight: "min(720px, calc(100dvh - 32px))",
            marginInline: "auto",
            paddingTop: 44,
            overflow: "hidden",
          }}
        >
          <IconButton
            type="button"
            onClick={closeModal}
            aria-label="Close Work With Me modal"
            title="Close"
            size="small"
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
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
            <X size={22} aria-hidden="true" />
          </IconButton>

          {step === "paths" && (
            <>
              <header style={{ flexShrink: 0, padding: "4px 2px 0" }}>
                <Typography
                  id="work-with-me-title"
                  variant="h4"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontSize: { xs: "1.8rem", sm: "2.125rem" },
                    overflowWrap: "anywhere",
                  }}
                >
                  Work With Me
                </Typography>

                <Typography
                  id="work-with-me-description"
                  variant="body1"
                  color="text.secondary"
                >
                  Choose how you'd like to work together.
                </Typography>
              </header>

              <div
                style={{
                  ...pathGridStyle,
                  flex: "1 1 auto",
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  overscrollBehaviorY: "contain",
                  WebkitOverflowScrolling: "touch",
                  padding: "4px 4px 12px",
                }}
              >
                <PathCard
                  title={bookingPathDetails.delivery_project.title}
                  description={bookingPathDetails.delivery_project.description}
                  icon={bookingPathDetails.delivery_project.icon}
                  onSelect={() => selectPath("delivery")}
                />

                <PathCard
                  title={bookingPathDetails.mentor_me.title}
                  description={bookingPathDetails.mentor_me.description}
                  icon={bookingPathDetails.mentor_me.icon}
                  onSelect={() => selectPath("mentor")}
                />

                <PathCard
                  title={bookingPathDetails.coffee_with_me.title}
                  description={bookingPathDetails.coffee_with_me.description}
                  icon={bookingPathDetails.coffee_with_me.icon}
                  onSelect={() => selectPath("coffee")}
                />

                <PathCard
                  title="Technology Ownership Audit"
                  description="Assess how well you control your code, infrastructure, access, documentation, and long-term technology decisions."
                  icon={<ShieldCheck size={28} aria-hidden="true" />}
                  onSelect={selectOwnershipAudit}
                />
              </div>
            </>
          )}

          {(step === "delivery" || step === "mentor" || step === "coffee") && (
            <div
              style={{
                ...pageStyle,
                flex: "1 1 auto",
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehaviorY: "contain",
                WebkitOverflowScrolling: "touch",
                padding: "4px 4px 12px",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <Button
                  type="button"
                  variant="text"
                  startIcon={<ArrowLeft size={18} />}
                  onClick={handleBackToPaths}
                >
                  All project paths
                </Button>
              </div>

              {step === "delivery" && (
                <DeliveryProjectForm
                  onBack={handleBackToPaths}
                  onSubmitted={(reference) =>
                    handleSubmitted("delivery_project", reference)
                  }
                />
              )}

              {step === "mentor" && (
                <MentorMeForm
                  onBack={handleBackToPaths}
                  onSubmitted={(reference) =>
                    handleSubmitted("mentor_me", reference)
                  }
                />
              )}

              {step === "coffee" && (
                <CoffeeWithMeForm
                  onBack={handleBackToPaths}
                  onSubmitted={(reference) =>
                    handleSubmitted("coffee_with_me", reference)
                  }
                />
              )}
            </div>
          )}

          {step === "ownership_audit" && (
            <div
              style={{
                ...pageStyle,
                flex: "1 1 auto",
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehaviorY: "contain",
                WebkitOverflowScrolling: "touch",
                padding: "4px 4px 12px",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <Button
                  type="button"
                  variant="text"
                  startIcon={<ArrowLeft size={18} />}
                  onClick={handleBackToPaths}
                >
                  All project paths
                </Button>
              </div>

              <OwnershipAudit onBack={handleBackToPaths} />
            </div>
          )}

          {step === "confirmed" && confirmation && currentPath && (
            <div
              style={{
                ...pageStyle,
                flex: "1 1 auto",
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehaviorY: "contain",
                WebkitOverflowScrolling: "touch",
                padding: "4px",
              }}
              aria-live="polite"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 12,
                  padding: "12px 0",
                }}
              >
                <CheckCircle2
                  size={48}
                  color="var(--mui-palette-success-main, #2e7d32)"
                  aria-hidden="true"
                />

                <Typography id="work-with-me-title" variant="h4" component="h2">
                  Request submitted
                </Typography>

                <Typography variant="body1" color="text.secondary">
                  {currentPath.confirmationMessage}
                </Typography>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 16,
                  border: "1px solid var(--mui-palette-divider, #d9dfe8)",
                  borderRadius: 8,
                  overflowWrap: "anywhere",
                }}
              >
                <Typography variant="subtitle2">Your reference</Typography>

                <Typography
                  variant="body1"
                  component="p"
                  sx={{ overflowWrap: "anywhere", fontFamily: "monospace" }}
                >
                  {confirmation.reference}
                </Typography>

                <div style={footerStyle}>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<Copy size={16} />}
                    onClick={() => void copyReference()}
                  >
                    Copy reference
                  </Button>

                  <Button
                    type="button"
                    variant="contained"
                    onClick={closeModal}
                  >
                    Done
                  </Button>
                </div>
              </div>

              {copyError && (
                <Alert severity="warning" role="alert">
                  {copyError}
                </Alert>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
