import { useState } from "react";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";

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
  onBack: () => void;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
    auditSections
      .slice(0, sectionIndex)
      .reduce((total, section) => total + section.questions.length, 0),
  );

  const allQuestions = auditSections.flatMap((section, index) =>
    section.questions.map((question) => ({
      ...question,
      sectionIndex: index,
      sectionTitle: section.title,
    })),
  );

  const currentQuestion = allQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    return null;
  }

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === TOTAL_QUESTIONS - 1;

  function handleAnswer(points: number): void {
    onAnswer(currentQuestion.id, points);

    if (isLastQuestion) {
      onFinish();
      return;
    }

    const nextQuestion = allQuestions[currentQuestionIndex + 1];

    // Update the parent when moving into another section.
    if (nextQuestion.sectionIndex !== currentQuestion.sectionIndex) {
      onSectionChange(nextQuestion.sectionIndex);
    }

    // Automatically display the next question.
    setCurrentQuestionIndex((previous) => previous + 1);
  }

  function handlePrevious(): void {
    if (isFirstQuestion) {
      onBack();
      return;
    }

    const previousQuestion = allQuestions[currentQuestionIndex - 1];

    if (previousQuestion.sectionIndex !== currentQuestion.sectionIndex) {
      onSectionChange(previousQuestion.sectionIndex);
    }

    setCurrentQuestionIndex((previous) => previous - 1);
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow={`Step 3 of 5 · Question ${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}`}
        title={currentQuestion.sectionTitle}
        description="Choose the answer that best describes your situation today."
      />

      {/* Question progress */}
      <Stack spacing={1}>
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography component="p" variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {Math.round(((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100)}%
          </Typography>
        </Stack>

        <Stack
          direction="row"
          sx={{
            width: "100%",
            height: 6,
            borderRadius: 10,
            overflow: "hidden",
            bgcolor: "action.hover",
          }}
        >
          <Stack
            sx={{
              width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%`,
              bgcolor: "primary.main",
              transition: "width 250ms ease",
            }}
          />
        </Stack>
      </Stack>

      {/* One question at a time */}
      <FormControl
        component="fieldset"
        fullWidth
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 3,
          minWidth: 0,
        }}
      >
        <FormLabel
          component="legend"
          sx={{
            color: "text.primary",
            fontWeight: 700,
            fontSize: "1.1rem",
            mb: 1,
          }}
        >
          {currentQuestion.question}
        </FormLabel>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {currentQuestion.help}
        </Typography>

        <RadioGroup
          name={currentQuestion.id}
          value={
            answers[currentQuestion.id] === undefined
              ? ""
              : String(answers[currentQuestion.id])
          }
          onChange={(event) => handleAnswer(Number(event.target.value))}
        >
          {currentQuestion.answers.map((answer) => (
            <FormControlLabel
              key={answer.label}
              value={String(answer.points)}
              control={<Radio />}
              label={answer.label}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                mx: 0,
                my: 0.5,
                px: 1,
                py: 0.5,
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {/* Navigation */}
      <StepFooter
        previous={{
          label: "Previous",
          onClick: handlePrevious,
        }}
      />
    </Stack>
  );
}
