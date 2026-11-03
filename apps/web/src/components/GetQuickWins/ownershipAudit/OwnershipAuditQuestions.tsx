import { useState } from "react";
import {
  Alert,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";

import { trackEvent } from "./analytics";
import {
  TOTAL_QUESTIONS,
  auditSections,
  type AuditAnswers,
} from "./ownershipAuditData";
import { StepFooter, StepHeader } from "./StepParts";

interface OwnershipAuditQuestionsProps {
  answers: AuditAnswers;
  sectionIndex: number;
  onSectionChange: (sectionIndex: number) => void;
  onAnswer: (questionId: string, points: number) => void;
  /** Called from "Previous" on the first section. */
  onBack: () => void;
  /** Called from "See my score" on the last section. */
  onFinish: () => void;
}

export function OwnershipAuditQuestions({
  answers,
  sectionIndex,
  onSectionChange,
  onAnswer,
  onBack,
  onFinish,
}: OwnershipAuditQuestionsProps) {
  const [error, setError] = useState("");

  const section = auditSections[sectionIndex];
  const isLastSection = sectionIndex === auditSections.length - 1;
  const questionsBefore = auditSections
    .slice(0, sectionIndex)
    .reduce((total, item) => total + item.questions.length, 0);

  function handleAnswer(questionId: string, points: number): void {
    setError("");
    onAnswer(questionId, points);
  }

  function handlePrevious(): void {
    setError("");

    if (sectionIndex === 0) {
      onBack();
      return;
    }

    onSectionChange(sectionIndex - 1);
  }

  function handleNext(): void {
    const hasUnanswered = section.questions.some(
      (question) => answers[question.id] === undefined,
    );

    if (hasUnanswered) {
      setError("Please answer every question before continuing.");
      trackEvent("ownership_audit.validation_failed", {
        step: 3,
        section: sectionIndex + 1,
      });
      return;
    }

    setError("");

    if (isLastSection) {
      onFinish();
      return;
    }

    onSectionChange(sectionIndex + 1);
  }

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow={`Step 3 of 5 · Section ${sectionIndex + 1} of ${auditSections.length}`}
        title={section.title}
        description="Choose the answer that best describes your situation today."
      />

      {section.questions.map((question, index) => (
        <FormControl
          key={question.id}
          component="fieldset"
          fullWidth
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 2,
            m: 0,
            minWidth: 0,
          }}
        >
          <FormLabel
            component="legend"
            sx={{ color: "text.primary", fontWeight: 600, px: 0.5 }}
          >
            {question.question}
          </FormLabel>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {question.help}
          </Typography>

          <RadioGroup
            name={question.id}
            value={
              answers[question.id] === undefined
                ? ""
                : String(answers[question.id])
            }
            onChange={(event) =>
              handleAnswer(question.id, Number(event.target.value))
            }
          >
            {question.answers.map((answer) => (
              <FormControlLabel
                key={answer.label}
                value={String(answer.points)}
                control={<Radio />}
                label={answer.label}
              />
            ))}
          </RadioGroup>

          <Typography variant="caption" color="text.secondary">
            Question {questionsBefore + index + 1} of {TOTAL_QUESTIONS}
          </Typography>
        </FormControl>
      ))}

      {error && (
        <Alert severity="warning" role="alert">
          {error}
        </Alert>
      )}

      <StepFooter
        previous={{ label: "Previous", onClick: handlePrevious }}
        next={{
          label: isLastSection ? "See my score" : "Next",
          onClick: handleNext,
        }}
      />
    </Stack>
  );
}
