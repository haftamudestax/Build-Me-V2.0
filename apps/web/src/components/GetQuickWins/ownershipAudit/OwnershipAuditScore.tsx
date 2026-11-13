import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  auditSections,
  resultDetails,
  type AuditAnswers,
  type ResultCategory,
} from "./ownershipAuditData";
import { StepFooter, StepHeader } from "./StepParts";

interface OwnershipAuditScoreProps {
  name: string;
  score: number;
  category: ResultCategory;
  answers: AuditAnswers;
  onPrevious: () => void;
  onNext: () => void;
}

export function OwnershipAuditScore({
  name,
  score,
  category,
  answers,
  onPrevious,
  onNext,
}: OwnershipAuditScoreProps) {
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const details = resultDetails[category];

  // Flatten all sections into a single question list.
  const allQuestions = auditSections.flatMap((section) =>
    section.questions.map((question) => ({
      id: question.id,
      question: question.question,
      sectionTitle: section.title,
      answers: question.answers,
    })),
  );

  return (
    <Stack spacing={2.5} aria-live="polite" sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow="Step 4 of 5"
        title="Your Technology Ownership Score"
        description={`Results for ${name}`}
      />

      {/* Score summary */}
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
          value={Math.min(100, Math.max(0, score))}
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
          sx={{ fontWeight: 700 }}
        >
          {details.title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {details.description}
        </Typography>
      </Box>

      {/* View all questions */}
      <Box>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setShowAllQuestions((previous) => !previous)}
          aria-expanded={showAllQuestions}
          aria-controls="audit-questions-review"
          sx={{
            width: "100%",
            borderColor: "var(--color-dark-yellow)",
            color: "var(--color-black)",
            bgcolor: "var(--color-dark-yellow)",
            py: 1.25,
            px: 3,
            borderRadius: "8px",
            fontWeight: 700,
            textTransform: "none",
            boxShadow: "none",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "var(--color-light-yellow)",
              bgcolor: "var(--color-light-yellow)",
              boxShadow: "0 4px 12px rgba(247, 183, 51, 0.25)",
              transform: "translateY(-1px)",
            },
          }}
        >
          {showAllQuestions ? "Hide Questions" : "View All Questions"}
        </Button>

        <Collapse in={showAllQuestions} timeout="auto">
          <Stack id="audit-questions-review" spacing={2} sx={{ mt: 2 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
              Your Audit Answers
            </Typography>

            {allQuestions.map((question, index) => {
              // Get the respondent's selected points.
              const selectedPoints = answers?.[question.id];

              // Safely find the matching answer.
              const selectedAnswer = Array.isArray(question.answers)
                ? question.answers.find(
                    (answer) =>
                      answer != null && answer.points === selectedPoints,
                  )
                : undefined;

              return (
                <Box
                  key={question.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {question.sectionTitle} · Question {index + 1}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    component="h4"
                    sx={{ fontWeight: 700, mt: 0.5 }}
                  >
                    {question.question}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    Your answer
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      mt: 0.5,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {selectedAnswer?.label ?? "Not answered"}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Collapse>
      </Box>

      {/* Assessment disclaimer */}
      <Alert severity="info">
        This is a self-assessment based on your answers, not a security audit or
        certification.
      </Alert>

      {/* Navigation */}
      <StepFooter
        previous={{
          label: "Previous",
          onClick: onPrevious,
        }}
        next={{
          label: "Next",
          onClick: onNext,
        }}
      />
    </Stack>
  );
}
