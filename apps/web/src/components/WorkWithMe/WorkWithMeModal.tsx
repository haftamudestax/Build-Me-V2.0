import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Alert, Button, IconButton, Typography } from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coffee,
  Copy,
  FolderKanban,
  GraduationCap,
  X,
} from "lucide-react";

import { Modal } from "@build-me/ui";
import { CoffeeWithMeForm } from "./CoffeeWithMeForm";
import { DeliveryProjectForm } from "./DeliveryProjectForm";
import { MentorMeForm } from "./MentorMeForm";
import type { BookingSubmission } from "./bookingConfirmation";
import {
  OPEN_WORK_WITH_ME_EVENT,
  type OpenWorkWithMeDetail,
} from "./openWorkWithMe";

type BookingPackageTier = "beginner" | "intermediate" | "advanced";

type JourneyStep =
  | "paths"
  | "packages"
  | "delivery"
  | "mentor"
  | "coffee"
  | "ownership_audit"
  | "confirmed";

type BookingPath = BookingSubmission["bookingType"];

type FormStep = "delivery" | "mentor" | "coffee";

interface PathDetails {
  title: string;
  description: string;
  confirmationMessage: string;
  icon: ReactNode;
}

interface PackageOption {
  tier: BookingPackageTier;
  name: string;
  price: number;
  description: string;
}

const pathPackages: Record<BookingPath, PackageOption[]> = {
  delivery_project: [
    {
      tier: "beginner",
      name: "Starter MVP",
      price: 1499,
      description:
        "A focused starting point for core features, landing pages, or small prototypes.",
    },
    {
      tier: "intermediate",
      name: "Standard Full-Stack",
      price: 3499,
      description:
        "A comprehensive build covering database architecture, auth, APIs, and responsive UI.",
    },
    {
      tier: "advanced",
      name: "Enterprise System",
      price: 6999,
      description:
        "A robust, scalable solution featuring custom microservices, security hardening, and deep integrations.",
    },
  ],
  mentor_me: [
    {
      tier: "beginner",
      name: "Code & Architecture Review",
      price: 199,
      description:
        "A single deep-dive session reviewing your codebase, design patterns, and immediate blockers.",
    },
    {
      tier: "intermediate",
      name: "Monthly Growth Mentorship",
      price: 799,
      description:
        "Bi-weekly 1-on-1 sessions, continuous code reviews, and tailored career/technical guidance.",
    },
    {
      tier: "advanced",
      name: "Engineering Leadership Intensive",
      price: 1499,
      description:
        "Comprehensive multi-week advisory focusing on system architecture, team scaling, and production deployment.",
    },
  ],
  coffee_with_me: [
    {
      tier: "beginner",
      name: "Quick Catch-up",
      price: 50,
      description:
        "A fast 20-minute coffee chat to swap tech insights, ask quick questions, or say hello.",
    },
    {
      tier: "intermediate",
      name: "Deep-Dive Coffee",
      price: 120,
      description:
        "A full 45-minute structured discussion on a specific project idea, tech stack choice, or hurdle.",
    },
    {
      tier: "advanced",
      name: "Strategic Brainstorming",
      price: 250,
      description:
        "An extended brainstorming session mapping out product roadmap ideas and technical viability.",
    },
  ],
};

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
      "Schedule a conversation to discuss ideas, technology, collaboration, or career opportunities.",
    confirmationMessage:
      "Your Coffee With Me request has been submitted. I'll review your preferred meeting time and follow up to confirm availability.",
    icon: <Coffee size={28} aria-hidden="true" />,
  },
};

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
};

const pathGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 14,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const pathButtonStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 8,
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
  padding: "16px 20px",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 12,
  backgroundColor: "rgba(255, 255, 255, 0.78)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "0 6px 18px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)",
  color: "inherit",
  textAlign: "left",
  font: "inherit",
  cursor: "pointer",
  transition:
    "transform 180ms ease, border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease",
  overflowWrap: "anywhere",
};

const packageCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  width: "100%",
  minWidth: 0,
  padding: "18px",
  border: "1px solid rgba(255, 255, 255, 0.35)",
  borderRadius: 12,
  backgroundColor: "rgba(255, 255, 255, 0.72)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  color: "inherit",
  textAlign: "left",
  font: "inherit",
  cursor: "pointer",
  transition:
    "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
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

function getBookingType(step: FormStep): BookingPath {
  switch (step) {
    case "delivery":
      return "delivery_project";
    case "mentor":
      return "mentor_me";
    case "coffee":
      return "coffee_with_me";
  }
}

function getFormStep(bookingType: BookingPath): FormStep {
  switch (bookingType) {
    case "delivery_project":
      return "delivery";
    case "mentor_me":
      return "mentor";
    case "coffee_with_me":
      return "coffee";
  }
}

function getStepFromOpenPath(
  path: OpenWorkWithMeDetail["path"],
): FormStep | null {
  if (path === "delivery" || path === "mentor" || path === "coffee") {
    return path;
  }

  return null;
}

function formatInvoiceTotal(totalCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(totalCents / 100);
}

function getEmailStatusLabel(
  status: BookingSubmission["invoiceEmailStatus"],
): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "not_sent":
      return "Not sent";
    default:
      return "Not available";
  }
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

  const isActive = isFocused || isHovered;

  return (
    <button
      type="button"
      onClick={onSelect}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...pathButtonStyle,
        borderColor: isActive
          ? "var(--color-dark-yellow)"
          : pathButtonStyle.borderColor,
        backgroundColor: isHovered
          ? "rgba(255, 255, 255, 0.94)"
          : pathButtonStyle.backgroundColor,
        boxShadow: isActive
          ? "0 14px 28px -4px rgba(15, 23, 42, 0.14), 0 4px 10px -2px rgba(217, 155, 22, 0.18)"
          : pathButtonStyle.boxShadow,
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        outline: isFocused ? "2px solid var(--color-dark-yellow)" : "none",
        outlineOffset: 2,
      }}
      aria-label={`${title}: ${description}`}
    >
      <span
        style={{
          display: "inline-flex",
          color: "var(--color-dark-yellow)",
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
          lineHeight: 1.5,
          color: "var(--mui-palette-text-secondary, #666)",
          overflowWrap: "anywhere",
        }}
      >
        {description}
      </span>
    </button>
  );
}

interface PackageCardProps {
  option: PackageOption;
  isSelected: boolean;
  onSelect: () => void;
}

function PackageCard({ option, isSelected, onSelect }: PackageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-pressed={isSelected}
      style={{
        ...packageCardStyle,
        borderColor:
          isSelected || isHovered
            ? "var(--color-dark-yellow)"
            : packageCardStyle.borderColor,
        backgroundColor: isSelected
          ? "color-mix(in srgb, var(--color-light-yellow) 16%, rgba(255, 255, 255, 0.85))"
          : isHovered
            ? "rgba(255, 255, 255, 0.9)"
            : packageCardStyle.backgroundColor,
        outline: isSelected ? "2px solid var(--color-dark-yellow)" : "none",
        outlineOffset: 1,
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
          {option.name}
        </span>

        <span
          style={{
            fontWeight: 800,
            fontSize: "1.15rem",
            color: "var(--color-dark-yellow)",
          }}
        >
          ${option.price.toLocaleString("en-US")} USD
        </span>
      </span>

      <span
        style={{
          fontSize: "0.875rem",
          lineHeight: 1.5,
          color: "var(--mui-palette-text-secondary, #666)",
        }}
      >
        {option.description}
      </span>

      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.85rem",
          fontWeight: 600,
          color: isSelected
            ? "var(--color-dark-yellow)"
            : "var(--mui-palette-text-secondary, #666)",
        }}
      >
        {isSelected ? (
          <>
            <CheckCircle2 size={16} aria-hidden="true" />
            Selected
          </>
        ) : (
          <>
            Choose package
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </span>
    </button>
  );
}

export function WorkWithMeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<JourneyStep>("paths");
  const [selectedPath, setSelectedPath] = useState<BookingPath | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<BookingPackageTier | null>(null);
  const [confirmation, setConfirmation] = useState<BookingSubmission | null>(
    null,
  );
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    function handleOpenRequest(event: Event): void {
      const path = (event as CustomEvent<OpenWorkWithMeDetail>).detail?.path;
      const requestedStep = getStepFromOpenPath(path);

      setConfirmation(null);
      setCopyError(null);
      setSelectedPackage(null);

      if (requestedStep) {
        const bookingType = getBookingType(requestedStep);

        setSelectedPath(bookingType);
        setStep("packages");
        trackJourneyEvent(`${bookingType}.selected`);
      } else {
        setSelectedPath(null);
        setStep("paths");
      }

      setIsOpen(true);
      trackJourneyEvent("work_with_me.opened");
    }

    window.addEventListener(OPEN_WORK_WITH_ME_EVENT, handleOpenRequest);

    return () => {
      window.removeEventListener(OPEN_WORK_WITH_ME_EVENT, handleOpenRequest);
    };
  }, []);

  function closeModal(): void {
    setIsOpen(false);
    trackJourneyEvent("work_with_me.closed");
  }

  function selectPath(nextStep: FormStep): void {
    const bookingType = getBookingType(nextStep);

    setSelectedPath(bookingType);
    setSelectedPackage(null);
    setStep("packages");
    setCopyError(null);

    trackJourneyEvent(`${bookingType}.selected`);
  }

  function selectPackage(tier: BookingPackageTier): void {
    if (!selectedPath) return;

    setSelectedPackage(tier);
    setStep(getFormStep(selectedPath));
    setCopyError(null);

    trackJourneyEvent(`${selectedPath}.package_selected`);
  }

  function handleBackToPaths(): void {
    if (selectedPath) {
      trackJourneyEvent(`${selectedPath}.back_to_paths`);
    } else if (step === "ownership_audit") {
      trackJourneyEvent("ownership_audit.back_to_paths");
    }

    setStep("paths");
    setSelectedPath(null);
    setSelectedPackage(null);
    setCopyError(null);
  }

  function handleBackToPackages(): void {
    if (selectedPath) {
      trackJourneyEvent(`${selectedPath}.back_to_packages`);
      setStep("packages");
    }
  }

  function handleSubmitted(submission: BookingSubmission): void {
    setConfirmation(submission);
    setSelectedPath(submission.bookingType);
    setStep("confirmed");
    setCopyError(null);

    trackJourneyEvent(`${submission.bookingType}.confirmation_viewed`);
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

  const selectedPathDetails = selectedPath
    ? bookingPathDetails[selectedPath]
    : null;

  const currentPathPackages = selectedPath ? pathPackages[selectedPath] : [];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        labelledBy="work-with-me-title"
        describedBy="work-with-me-description"
        closeOnEscape
        size="xl"
        closeOnOverlayClick
      >
        <div
          style={{
            ...pageStyle,
            position: "relative",
            width: "100%",
            maxWidth: 960,
            height: "min(760px, calc(100dvh - 64px))",
            maxHeight: "calc(100dvh - 64px)",
            minHeight: 0,
            marginInline: "auto",
            padding: 16,
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
              top: 10,
              right: 10,
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
              <header
                style={{
                  flex: "0 0 auto",
                  padding: "2px 40px 8px 2px",
                }}
              >
                <Typography
                  id="work-with-me-title"
                  variant="h4"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontSize: { xs: "1.8rem", sm: "2.125rem" },
                    overflowWrap: "anywhere",
                    color: "var(--color-dark-yellow)",
                    fontWeight: 700,
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
                  padding: "6px 8px 16px",
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
              </div>
            </>
          )}

          {step === "packages" && selectedPathDetails && selectedPath && (
            <div
              style={{
                ...pageStyle,
                flex: "1 1 auto",
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehaviorY: "contain",
                WebkitOverflowScrolling: "touch",
                padding: "4px 8px 16px",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <Button
                  type="button"
                  variant="text"
                  startIcon={<ArrowLeft size={18} />}
                  onClick={handleBackToPaths}
                  sx={{ color: "var(--color-dark-yellow)" }}
                >
                  All project paths
                </Button>
              </div>

              <header style={{ padding: "4px 2px 8px" }}>
                <Typography
                  id="work-with-me-title"
                  variant="h4"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontSize: { xs: "1.65rem", sm: "2rem" },
                    color: "var(--color-light-yellow)",
                    fontWeight: 700,
                    overflowWrap: "anywhere",
                  }}
                >
                  Choose Your Package
                </Typography>

                <Typography variant="body1" color="text.secondary">
                  {selectedPathDetails.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Select the package that best matches your needs.
                </Typography>
              </header>

              <div
                style={{
                  ...pathGridStyle,
                  flex: "1 1 auto",
                  padding: "4px",
                }}
              >
                {currentPathPackages.map((option) => (
                  <PackageCard
                    key={option.tier}
                    option={option}
                    isSelected={selectedPackage === option.tier}
                    onSelect={() => selectPackage(option.tier)}
                  />
                ))}
              </div>
            </div>
          )}

          {(step === "delivery" || step === "mentor" || step === "coffee") &&
            selectedPackage && (
              <div
                style={{
                  ...pageStyle,
                  flex: "1 1 auto",
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  overscrollBehaviorY: "contain",
                  WebkitOverflowScrolling: "touch",
                  padding: "4px 8px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <Button
                    type="button"
                    variant="text"
                    startIcon={<ArrowLeft size={18} />}
                    onClick={handleBackToPaths}
                    sx={{
                      color: "var(--color-light-yellow)",
                      fontWeight: 700,
                    }}
                  >
                    All project paths
                  </Button>

                  <Button
                    type="button"
                    variant="text"
                    onClick={handleBackToPackages}
                    sx={{
                      color: "var(--color-light-yellow)",
                      fontWeight: 700,
                    }}
                  >
                    Change package
                  </Button>
                </div>

                {step === "delivery" && (
                  <DeliveryProjectForm
                    selectedPackage={selectedPackage}
                    onBack={handleBackToPackages}
                    onSubmitted={handleSubmitted}
                  />
                )}

                {step === "mentor" && (
                  <MentorMeForm
                    selectedPackage={selectedPackage}
                    onBack={handleBackToPackages}
                    onSubmitted={handleSubmitted}
                  />
                )}

                {step === "coffee" && (
                  <CoffeeWithMeForm
                    selectedPackage={selectedPackage}
                    onBack={handleBackToPackages}
                    onSubmitted={handleSubmitted}
                  />
                )}
              </div>
            )}

          {step === "confirmed" && confirmation && currentPath && (
            <div
              style={{
                ...pageStyle,
                flex: "0 1 auto",
                minHeight: 0,
                overflow: "visible",
                padding: "4px",
              }}
              aria-live="polite"
              className="bg-light-yellow border-r-4 border-b-4 border-r-black border-b-black"
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
                  color="var(--color-white)"
                  aria-hidden="true"
                />

                <Typography
                  id="work-with-me-title"
                  variant="h4"
                  component="h2"
                  sx={{
                    color: "var(--color-black)",
                    font: 700,
                  }}
                >
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
                  gap: 12,
                  padding: 16,
                  border: "1px solid var(--mui-palette-divider, #d9dfe8)",
                  borderRadius: 8,
                  overflowWrap: "anywhere",
                }}
                className="bg-dark-yellow"
              >
                <div>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "var(--color-white)",
                      font: 700,
                    }}
                  >
                    Booking reference
                  </Typography>

                  <Typography
                    variant="body1"
                    component="p"
                    sx={{
                      overflowWrap: "anywhere",
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  >
                    {confirmation.reference}
                  </Typography>
                </div>

                <div>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "var(--color-white)",
                      font: 700,
                    }}
                  >
                    Invoice number
                  </Typography>

                  <Typography variant="body1" component="p">
                    {confirmation.invoice?.invoiceNumber ??
                      "Invoice details are being prepared."}
                  </Typography>
                </div>

                {confirmation.invoice && (
                  <>
                    <div>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "var(--color-white)",
                          font: 700,
                        }}
                      >
                        Invoice total
                      </Typography>

                      <Typography
                        variant="h6"
                        component="p"
                        sx={{ fontWeight: 700 }}
                      >
                        {formatInvoiceTotal(
                          confirmation.invoice.totalCents,
                          confirmation.invoice.currency,
                        )}
                      </Typography>
                    </div>

                    <div>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "var(--color-white)",
                          font: 700,
                        }}
                      >
                        Payment status
                      </Typography>

                      <Typography sx={{ fontWeight: 700 }}>
                        {confirmation.invoice?.status
                          ? confirmation.invoice.status
                              .charAt(0)
                              .toUpperCase() +
                            confirmation.invoice.status.slice(1)
                          : "Unavailable"}
                      </Typography>
                    </div>
                  </>
                )}

                <div>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "var(--color-white)",
                      font: 700,
                    }}
                  >
                    Invoice email status
                  </Typography>

                  <Typography variant="body1" component="p">
                    {getEmailStatusLabel(confirmation.invoiceEmailStatus)}
                  </Typography>
                </div>

                <div style={footerStyle}>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<Copy size={16} />}
                    onClick={() => void copyReference()}
                    sx={{
                      backgroundColor: "var(--color-black)",
                      color: "var(--color-light-yellow)",
                      fontWeight: 700,
                      border: "1.5px solid var(--color-black)",
                      borderRadius: 0,
                      boxShadow: "none",
                      px: 3,
                      py: 1,
                      textTransform: "none",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        backgroundColor: "var(--color-light-yellow)",
                        color: "var(--color-black)",
                        border: "1.5px solid var(--color-black)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    Copy reference
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={closeModal}
                    sx={{
                      backgroundColor: "var(--color-white)",
                      color: "var(--color-black)",
                      fontWeight: 700,
                      border: "1.5px solid var(--color-black)",
                      borderRadius: 0,
                      boxShadow: "none",
                      px: 3,
                      py: 1,
                      textTransform: "none",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        backgroundColor: "var(--color-light-yellow)",
                        color: "var(--color-black)",
                        border: "1.5px solid var(--color-black)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>

              {!confirmation.invoice && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Your booking was submitted successfully. Invoice information
                  is not available in the response yet. You can keep your
                  booking reference for future correspondence.
                </Alert>
              )}

              {confirmation.invoiceEmailStatus === "failed" && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Your booking was successful, but the invoice email could not
                  be sent. Your booking reference is available above.
                </Alert>
              )}

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
