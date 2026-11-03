import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Box, Button, IconButton, LinearProgress, Stack } from "@mui/material";
import { ArrowRight, ShieldCheck, X } from "lucide-react";

import { Modal } from "@build-me/ui";
import {
  openWorkWithMe,
  type WorkWithMePath,
} from "../WorkWithMe/openWorkWithMe";
import { trackEvent } from "./ownershipAudit/analytics";
import {
  calculateScore,
  getResultCategory,
  type AuditAnswers,
} from "./ownershipAudit/ownershipAuditData";
import { OwnershipAuditIntro } from "./ownershipAudit/OwnershipAuditIntro";
import { OwnershipAuditNextSteps } from "./ownershipAudit/OwnershipAuditNextSteps";
import { OwnershipAuditQuestions } from "./ownershipAudit/OwnershipAuditQuestions";
import { OwnershipAuditRegistration } from "./ownershipAudit/OwnershipAuditRegistration";
import {
  emptyRegistration,
  type Registration,
} from "./ownershipAudit/registration";
import { OwnershipAuditScore } from "./ownershipAudit/OwnershipAuditScore";
import {
  DESCRIPTION_ID,
  StepHeader,
  TITLE_ID,
} from "./ownershipAudit/StepParts";

type AuditStep = "intro" | "register" | "questions" | "score" | "next";
type QuickWinsStep = "options" | AuditStep;

const STEP_NUMBER: Record<AuditStep, number> = {
  intro: 1,
  register: 2,
  questions: 3,
  score: 4,
  next: 5,
};

const TOTAL_STEPS = 5;

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
};

interface OptionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onSelect: () => void;
}

function OptionCard({ title, description, icon, onSelect }: OptionCardProps) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-label={`${title}: ${description}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1.5,
        width: "100%",
        minWidth: 0,
        p: 2.5,
        textAlign: "left",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "transparent",
        color: "inherit",
        font: "inherit",
        cursor: "pointer",
        overflowWrap: "anywhere",
        transition: "border-color 160ms ease, background-color 160ms ease",
        "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <Box sx={{ display: "inline-flex", color: "primary.main" }}>{icon}</Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          width: "100%",
          fontWeight: 600,
          fontSize: "1rem",
        }}
      >
        <span>{title}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </Box>

      <Box
        component="span"
        sx={{ fontSize: "0.875rem", lineHeight: 1.6, color: "text.secondary" }}
      >
        {description}
      </Box>
    </Box>
  );
}

export function GetQuickWinsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<QuickWinsStep>("options");
  const [registration, setRegistration] =
    useState<Registration>(emptyRegistration);
  const [answers, setAnswers] = useState<AuditAnswers>({});
  const [questionSection, setQuestionSection] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const name = registration.name.trim();
  const score = calculateScore(answers);
  const category = getResultCategory(score);

  // Each new step starts at the top. Without this the content keeps the scroll
  // position from the previous step's footer and the heading is cut off.
  useEffect(() => {
    if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0;
  }, [step, questionSection]);

  function openModal(): void {
    setStep("options");
    setRegistration(emptyRegistration);
    setAnswers({});
    setQuestionSection(0);
    setIsOpen(true);
    trackEvent("get_quick_wins.opened", {}, "get_quick_wins");
  }

  function closeModal(): void {
    setIsOpen(false);
    // The backend reads "step" as a number, so the step name travels as lastStep.
    trackEvent("get_quick_wins.closed", { lastStep: step }, "get_quick_wins");
  }

  function moveForward(from: AuditStep, to: AuditStep): void {
    trackEvent("ownership_audit.step_completed", {
      completedStep: STEP_NUMBER[from],
      nextStep: STEP_NUMBER[to],
    });
    setStep(to);
  }

  function selectAudit(): void {
    setStep("intro");
    trackEvent("ownership_audit.selected");
    trackEvent("ownership_audit.started");
  }

  function backToOptions(): void {
    trackEvent("ownership_audit.back_to_paths");
    setStep("options");
  }

  function handleRegistered(): void {
    trackEvent("ownership_audit.registration_completed");
    moveForward("register", "questions");
  }

  function handleAnswer(questionId: string, points: number): void {
    setAnswers((current) => ({ ...current, [questionId]: points }));
    trackEvent("ownership_audit.answer_selected", {
      questionId,
      points,
      step: 3,
      section: questionSection + 1,
    });
  }

  function handleFinishQuestions(): void {
    const finalScore = calculateScore(answers);
    const finalCategory = getResultCategory(finalScore);

    moveForward("questions", "score");
    trackEvent("ownership_audit.completed", {
      score: finalScore,
      answeredQuestions: Object.keys(answers).length,
      resultCategory: finalCategory,
    });
    trackEvent("ownership_audit.results_viewed", {
      score: finalScore,
      resultCategory: finalCategory,
    });
  }

  function handleShowNextSteps(): void {
    moveForward("score", "next");
    trackEvent("ownership_audit.next_steps_viewed", {
      resultCategory: category,
    });
  }

  function handleSelectPath(path: WorkWithMePath): void {
    trackEvent("ownership_audit.path_selected", { path });
    closeModal();

    // Let this modal finish closing before the Work With Me modal opens.
    window.setTimeout(() => openWorkWithMe(path), 0);
  }

  const currentStepNumber = step === "options" ? 0 : STEP_NUMBER[step];

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        onClick={openModal}
        aria-haspopup="dialog"
      >
        Get Quick Wins
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        labelledBy={TITLE_ID}
        describedBy={DESCRIPTION_ID}
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
            aria-label="Close Get Quick Wins modal"
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

          {step !== "options" && (
            <LinearProgress
              variant="determinate"
              value={(currentStepNumber / TOTAL_STEPS) * 100}
              aria-label={`Step ${currentStepNumber} of ${TOTAL_STEPS}`}
              sx={{ flexShrink: 0 }}
            />
          )}

          <div
            ref={scrollAreaRef}
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
            {step === "options" && (
              <Stack spacing={2.5} sx={{ minWidth: 0 }}>
                <StepHeader
                  title="Get Quick Wins"
                  description="Choose a quick assessment to find the fastest improvements for your technology."
                />

                <OptionCard
                  title="Technology Ownership Audit"
                  description="Assess how well you control your code, infrastructure, access, documentation, and long-term technology decisions."
                  icon={<ShieldCheck size={28} aria-hidden="true" />}
                  onSelect={selectAudit}
                />
              </Stack>
            )}

            {step === "intro" && (
              <OwnershipAuditIntro
                onBack={backToOptions}
                onNext={() => moveForward("intro", "register")}
              />
            )}

            {step === "register" && (
              <OwnershipAuditRegistration
                values={registration}
                onChange={setRegistration}
                onBack={() => setStep("intro")}
                onSubmit={handleRegistered}
              />
            )}

            {step === "questions" && (
              <OwnershipAuditQuestions
                answers={answers}
                sectionIndex={questionSection}
                onSectionChange={setQuestionSection}
                onAnswer={handleAnswer}
                onBack={() => setStep("register")}
                onFinish={handleFinishQuestions}
              />
            )}

            {step === "score" && (
              <OwnershipAuditScore
                name={name}
                score={score}
                category={category}
                onPrevious={() => setStep("questions")}
                onNext={handleShowNextSteps}
              />
            )}

            {step === "next" && (
              <OwnershipAuditNextSteps
                name={name}
                score={score}
                category={category}
                onPrevious={() => setStep("score")}
                onClose={closeModal}
                onSelectPath={handleSelectPath}
              />
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
