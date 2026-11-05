import { useEffect, useRef, useState } from "react";
import { LinearProgress, Stack } from "@mui/material";

import {
  emptyRegistration,
  type Registration,
} from "../ownershipAudit/registration";

import { LearningCircleWhyStep } from "./LearningCircleWhyStep";
import { LearningCircleRegistrationStep } from "./LearningCircleRegistrationStep";
import { LearningCircleJoinStep } from "./LearningCircleJoinStep";

import { trackLearningCircle } from "./learningCircleAnalytics";

export type LearningCircleStep = "why" | "registration" | "join";

const STEP_NUMBER: Record<LearningCircleStep, number> = {
  why: 1,
  registration: 2,
  join: 3,
};

const TOTAL_STEPS = 3;

interface OwnershipLearningCircleFlowProps {
  onBack: () => void;
  onClose: () => void;
  onStepChange?: (step: LearningCircleStep) => void;
}

export function OwnershipLearningCircleFlow({
  onBack,
  onClose,
  onStepChange,
}: OwnershipLearningCircleFlowProps) {
  const [step, setStep] = useState<LearningCircleStep>("why");

  const [registration, setRegistration] =
    useState<Registration>(emptyRegistration);

  const explanationTracked = useRef(false);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (explanationTracked.current) {
      return;
    }

    explanationTracked.current = true;

    trackLearningCircle("ownership_learning_circle.explanation_viewed");
  }, []);

  function moveForward(from: LearningCircleStep, to: LearningCircleStep): void {
    trackLearningCircle("ownership_learning_circle.step_completed", {
      completedStep: STEP_NUMBER[from],
      nextStep: STEP_NUMBER[to],
    });

    setStep(to);
  }

  function handleBackToOptions(): void {
    trackLearningCircle("ownership_learning_circle.back_to_paths");

    onBack();
  }

  function handleRegistrationStarted(): void {
    trackLearningCircle("ownership_learning_circle.registration_started");

    moveForward("why", "registration");
  }

  function handleRegistered(): void {
    trackLearningCircle("ownership_learning_circle.registration_completed");

    moveForward("registration", "join");

    trackLearningCircle("ownership_learning_circle.join_viewed");
  }

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <LinearProgress
        variant="determinate"
        value={(STEP_NUMBER[step] / TOTAL_STEPS) * 100}
        aria-label={`Step ${STEP_NUMBER[step]} of ${TOTAL_STEPS}`}
        sx={{ flexShrink: 0 }}
      />

      {step === "why" && (
        <LearningCircleWhyStep
          onBack={handleBackToOptions}
          onNext={handleRegistrationStarted}
        />
      )}

      {step === "registration" && (
        <LearningCircleRegistrationStep
          values={registration}
          onChange={setRegistration}
          onBack={() => setStep("why")}
          onSubmit={handleRegistered}
        />
      )}

      {step === "join" && (
        <LearningCircleJoinStep
          name={registration.name.trim()}
          onPrevious={() => setStep("registration")}
          onClose={onClose}
        />
      )}
    </Stack>
  );
}
