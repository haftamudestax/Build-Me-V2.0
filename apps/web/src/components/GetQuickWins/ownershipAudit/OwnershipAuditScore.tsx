import { Alert, Box, LinearProgress, Stack, Typography } from "@mui/material";

import { resultDetails, type ResultCategory } from "./ownershipAuditData";
import { StepFooter, StepHeader } from "./StepParts";

interface OwnershipAuditScoreProps {
  name: string;
  score: number;
  category: ResultCategory;
  onPrevious: () => void;
  onNext: () => void;
}

export function OwnershipAuditScore({
  name,
  score,
  category,
  onPrevious,
  onNext,
}: OwnershipAuditScoreProps) {
  const details = resultDetails[category];

  return (
    <Stack spacing={2.5} aria-live="polite" sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow="Step 4 of 5"
        title="Your Technology Ownership Score"
        description={`Results for ${name}`}
      />

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Name
        </Typography>
        <Typography
          variant="body1"
          data-testid="quick-wins-name"
          sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
        >
          {name}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5 }}
        >
          Score
        </Typography>
        <Typography
          variant="h3"
          component="p"
          data-testid="quick-wins-score"
          aria-label={`Score: ${score} out of 100`}
          sx={{ fontWeight: 700 }}
        >
          {score}/100
        </Typography>

        <LinearProgress
          variant="determinate"
          value={score}
          aria-label="Ownership score"
          sx={{ mt: 1 }}
        />
      </Box>

      <Box>
        <Typography
          variant="h6"
          component="h3"
          data-testid="quick-wins-band"
          gutterBottom
        >
          {details.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {details.description}
        </Typography>
      </Box>

      <Alert severity="info">
        This is a self-assessment based on your answers, not a security audit or
        certification.
      </Alert>

      <StepFooter
        previous={{ label: "Previous", onClick: onPrevious }}
        next={{ label: "Next", onClick: onNext }}
      />
    </Stack>
  );
}
