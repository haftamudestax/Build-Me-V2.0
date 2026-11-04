import { ArrowRight, BookOpen, Users } from "lucide-react";
import { Box, Button, Stack, Typography } from "@mui/material";

import { StepHeader } from "../ownershipAudit/StepParts";

interface LearningCircleWhyStepProps {
  onBack: () => void;
  onJoin: () => void;
  telegramAvailable: boolean;
}

export function LearningCircleWhyStep({
  onBack,
  onJoin,
  telegramAvailable,
}: LearningCircleWhyStepProps) {
  return (
    <Stack spacing={3}>
      <StepHeader
        title="Technology Ownership Learning Circle"
        description="Learn how to take control of the technology your business depends on."
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 2,
          color: "primary.main",
        }}
      >
        <Users size={52} aria-hidden="true" />
      </Box>

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
              style={{ flexShrink: 0, marginTop: 3 }}
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

      {!telegramAvailable && (
        <Box
          role="status"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            The Telegram community invitation is being prepared. Joining will be
            available here once the group is launched.
          </Typography>
        </Box>
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
        <Button type="button" variant="text" onClick={onBack}>
          Back to options
        </Button>

        <Button
          type="button"
          variant="contained"
          onClick={onJoin}
          disabled={!telegramAvailable}
          endIcon={<ArrowRight size={18} />}
        >
          {telegramAvailable ? "Join the Learning Circle" : "Coming soon"}
        </Button>
      </Stack>
    </Stack>
  );
}
