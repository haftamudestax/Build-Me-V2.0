import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { ArrowRight } from "lucide-react";

import type { WorkWithMePath } from "../../WorkWithMe/openWorkWithMe";
import {
  getPathRecommendations,
  getRecommendedActions,
  resultDetails,
  type ResultCategory,
} from "./ownershipAuditData";
import { StepFooter, StepHeader } from "./StepParts";

interface OwnershipAuditNextStepsProps {
  name: string;
  score: number;
  category: ResultCategory;
  onPrevious: () => void;
  onClose: () => void;
  onSelectPath: (path: WorkWithMePath) => void;
}

export function OwnershipAuditNextSteps({
  name,
  score,
  category,
  onPrevious,
  onClose,
  onSelectPath,
}: OwnershipAuditNextStepsProps) {
  const actions = getRecommendedActions(score);
  const recommendations = getPathRecommendations(category);

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow="Step 5 of 5"
        title="Your next steps"
        description={`${name}, ${resultDetails[category].nextStepsIntro}`}
      />

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          Where to start
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          {actions.map((action) => (
            <li key={action}>
              <Typography variant="body2" color="text.secondary">
                {action}
              </Typography>
            </li>
          ))}
        </Box>
      </Box>

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          How I can help
        </Typography>

        <Stack spacing={1.5}>
          {recommendations.map((recommendation) => (
            <Box
              key={recommendation.path}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 2,
                border: "1px solid",
                borderColor: recommendation.recommended
                  ? "primary.main"
                  : "divider",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="subtitle2" component="h4">
                  {recommendation.title}
                </Typography>

                {recommendation.recommended && (
                  <Chip
                    label="Recommended for you"
                    color="primary"
                    size="small"
                  />
                )}
              </Box>

              <Typography variant="body2" color="text.secondary">
                {recommendation.reason}
              </Typography>

              <Box>
                <Button
                  type="button"
                  variant={
                    recommendation.recommended ? "contained" : "outlined"
                  }
                  size="small"
                  endIcon={<ArrowRight size={16} aria-hidden="true" />}
                  onClick={() => onSelectPath(recommendation.path)}
                >
                  Go to {recommendation.title}
                </Button>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <StepFooter
        previous={{ label: "Previous", onClick: onPrevious }}
        next={{ label: "Close", onClick: onClose }}
      />
    </Stack>
  );
}
