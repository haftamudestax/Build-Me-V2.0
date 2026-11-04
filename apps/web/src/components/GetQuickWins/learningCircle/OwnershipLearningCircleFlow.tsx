import { useEffect, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";

import { StepHeader } from "../ownershipAudit/StepParts";

import { LearningCircleWhyStep } from "./LearningCircleWhyStep";
import {
  LEARNING_CIRCLE_NAME,
  TELEGRAM_LEARNING_CIRCLE_URL,
} from "./learningCircleConfig";
import { trackLearningCircle } from "./learningCircleAnalytics";

export type LearningCircleStep = "why" | "join";

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

  const explanationTracked = useRef(false);

  const telegramAvailable = Boolean(TELEGRAM_LEARNING_CIRCLE_URL);

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

  function handleJoin(): void {
    if (!TELEGRAM_LEARNING_CIRCLE_URL) {
      return;
    }

    trackLearningCircle("ownership_learning_circle.join_clicked");

    trackLearningCircle("ownership_learning_circle.telegram_opened");

    window.open(TELEGRAM_LEARNING_CIRCLE_URL, "_blank", "noopener,noreferrer");

    setStep("join");
  }

  function handleTelegramOpen(): void {
    if (!TELEGRAM_LEARNING_CIRCLE_URL) {
      return;
    }

    trackLearningCircle("ownership_learning_circle.telegram_opened");
  }

  function handleBack(): void {
    if (step === "join") {
      setStep("why");
      return;
    }

    trackLearningCircle("ownership_learning_circle.back_to_paths");

    onBack();
  }

  return (
    <Stack spacing={3}>
      {step === "why" && (
        <LearningCircleWhyStep
          onBack={handleBack}
          onJoin={handleJoin}
          telegramAvailable={telegramAvailable}
        />
      )}

      {step === "join" && (
        <>
          <StepHeader
            title="Join the Learning Circle"
            description={`Take the next step with the ${LEARNING_CIRCLE_NAME}.`}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 2,
              color: "primary.main",
            }}
          >
            <Users size={52} aria-hidden="true" />
          </Box>

          <Typography color="text.secondary">
            {telegramAvailable
              ? "The Telegram invitation has been opened in a new tab. Follow the invitation to join the community."
              : "The Telegram community invitation is not available yet."}
          </Typography>

          {telegramAvailable && (
            <Button
              component="a"
              href={TELEGRAM_LEARNING_CIRCLE_URL!}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              endIcon={<ExternalLink size={18} />}
              onClick={handleTelegramOpen}
            >
              Open Telegram invitation
            </Button>
          )}

          <Stack
            sx={{
              flexDirection: {
                xs: "column-reverse",
                sm: "row",
              },
              gap: 1.5,
              justifyContent: "space-between",
            }}
          >
            <Button
              type="button"
              variant="text"
              startIcon={<ArrowLeft size={18} />}
              onClick={handleBack}
            >
              Back
            </Button>

            <Button type="button" variant="outlined" onClick={onClose}>
              Close
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
