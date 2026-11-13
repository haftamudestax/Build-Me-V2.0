import { Box, Button, Stack, Typography } from "@mui/material";
import { ExternalLink, Users } from "lucide-react";

import { StepFooter, StepHeader } from "../ownershipAudit/StepParts";

import {
  LEARNING_CIRCLE_NAME,
  TELEGRAM_LEARNING_CIRCLE_URL,
} from "./learningCircleConfig";

import { trackLearningCircle } from "./learningCircleAnalytics";

interface LearningCircleJoinStepProps {
  name: string;
  onPrevious: () => void;
  onClose: () => void;
}

export function LearningCircleJoinStep({
  name,
  onPrevious,
  onClose,
}: LearningCircleJoinStepProps) {
  const telegramAvailable = Boolean(TELEGRAM_LEARNING_CIRCLE_URL);

  function handleTelegramOpen(): void {
    if (!TELEGRAM_LEARNING_CIRCLE_URL) {
      return;
    }

    trackLearningCircle("ownership_learning_circle.telegram_opened");
  }

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow="Step 3 of 3"
        title="You're ready to join!"
        description={`Welcome, ${name}. Your next step is to join the ${LEARNING_CIRCLE_NAME}.`}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1.5,
          py: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 76,
            height: 76,
            borderRadius: "50%",
            bgcolor: "action.hover",
            color: "primary.main",
          }}
        >
          <Users size={40} aria-hidden="true" />
        </Box>

        <Typography variant="h6" component="h3">
          Welcome to the Learning Circle
        </Typography>

        <Typography color="text.secondary" variant="body2">
          Learn how to understand, manage, and take control of the technology
          your business depends on.
        </Typography>
      </Box>

      <Box
        sx={{
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          What happens next?
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Open the Telegram invitation and follow the instructions to join the
          community. Once you join, you can participate in discussions, learn
          with others, and develop your technology ownership knowledge.
        </Typography>
      </Box>

      {telegramAvailable ? (
        <Button
          component="a"
          href={TELEGRAM_LEARNING_CIRCLE_URL!}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          size="large"
          endIcon={<ExternalLink size={18} aria-hidden="true" />}
          onClick={handleTelegramOpen}
          sx={{
            bgcolor: "var(--color-light-yellow)",
            fontWeight: 700,
          }}
        >
          Join the Learning Circle
        </Button>
      ) : (
        <Typography color="text.secondary" variant="body2">
          The Telegram invitation is not available yet. Please try again later.
        </Typography>
      )}

      <StepFooter
        previous={{
          label: "Previous",
          onClick: onPrevious,
        }}
        next={{
          label: "Close",
          onClick: onClose,
        }}
      />
    </Stack>
  );
}
