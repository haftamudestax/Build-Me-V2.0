import { useEffect, useState } from "react";
import { LinearProgress, Stack } from "@mui/material";

import {
  emptyRegistration,
  type Registration,
} from "../ownershipAudit/registration";
import { ToolkitContentStep } from "./ToolkitContentStep";
import { ToolkitDetailsStep } from "./ToolkitDetailsStep";
import { ToolkitWhyStep } from "./ToolkitWhyStep";
import { trackToolkit } from "./toolkitAnalytics";

export type ToolkitStep = "why" | "details" | "content";

const STEP_NUMBER: Record<ToolkitStep, number> = {
  why: 1,
  details: 2,
  content: 3,
};

const TOTAL_STEPS = 3;

interface OwnershipToolkitFlowProps {
  onBack: () => void;
  onClose: () => void;
  onStepChange?: (step: ToolkitStep) => void;
}

export function OwnershipToolkitFlow({
  onBack,
  onClose,
  onStepChange,
}: OwnershipToolkitFlowProps) {
  const [step, setStep] = useState<ToolkitStep>("why");
  const [registration, setRegistration] =
    useState<Registration>(emptyRegistration);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  function moveForward(from: ToolkitStep, to: ToolkitStep): void {
    trackToolkit("ownership_toolkit.step_completed", {
      completedStep: STEP_NUMBER[from],
      nextStep: STEP_NUMBER[to],
    });
    setStep(to);
  }

  function handleBackToOptions(): void {
    trackToolkit("ownership_toolkit.back_to_paths");
    onBack();
  }

  function handleRegistered(): void {
    trackToolkit("ownership_toolkit.registration_completed");
    moveForward("details", "content");
    trackToolkit("ownership_toolkit.content_viewed");
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
        <ToolkitWhyStep
          onBack={handleBackToOptions}
          onNext={() => moveForward("why", "details")}
        />
      )}

      {step === "details" && (
        <ToolkitDetailsStep
          values={registration}
          onChange={setRegistration}
          onBack={() => setStep("why")}
          onSubmit={handleRegistered}
        />
      )}

      {step === "content" && (
        <ToolkitContentStep
          name={registration.name.trim()}
          onPrevious={() => setStep("details")}
          onClose={onClose}
        />
      )}
    </Stack>
  );
}
