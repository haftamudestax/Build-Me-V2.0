import { ArrowRight, BookOpen } from "lucide-react";
import { Box, Button, Stack, Typography } from "@mui/material";

import { StepHeader } from "../ownershipAudit/StepParts";

interface LearningCircleWhyStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function LearningCircleWhyStep({
  onBack,
  onNext,
}: LearningCircleWhyStepProps) {
  return (
    <Stack spacing={3}>
      <StepHeader
        eyebrow="Step 1 of 3"
        title="Technology Ownership Learning Circle"
        description="Learn how to take control of the technology your business depends on."
      />

      <Typography variant="body1" color="text.secondary">
        The Technology Ownership Learning Circle is a community for people who
        want to understand, manage, and make better decisions about their
        digital technology.
      </Typography>

      <Typography variant="h6">What you can learn</Typography>

      <Stack spacing={2}>
        {[
          {
            title: "Understand what you own",
            description:
              "Learn about domains, hosting, source code, infrastructure, and digital assets.",
          },
          {
            title: "Stay in control",
            description:
              "Understand account ownership, provider relationships, access, and handovers.",
          },
          {
            title: "Build long-term confidence",
            description:
              "Learn about backups, renewals, maintenance, recovery, and technology decisions.",
          },
        ].map((item) => (
          <Box
            key={item.title}
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            <BookOpen
              size={20}
              aria-hidden="true"
              style={{
                flexShrink: 0,
                marginTop: 3,
              }}
            />

            <Box>
              <Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>

              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

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
          onClick={onBack}
          sx={{
            bgcolor: "var(--color-light-yellow)",
            fontWeight: 700,
          }}
        >
          Back to options
        </Button>

        <Button
          type="button"
          variant="contained"
          onClick={onNext}
          endIcon={<ArrowRight size={18} />}
          sx={{
            bgcolor: "var(--color-light-yellow)",
            fontWeight: 700,
          }}
        >
          Continue to registration
        </Button>
      </Stack>
    </Stack>
  );
}
