import { useState } from "react";
import { Alert, Button, LinearProgress, Typography } from "@mui/material";
import { ArrowLeft, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";

type AuditQuestion = {
  id: string;
  question: string;
  help: string;
  answers: { label: string; points: number }[];
};

const auditSteps: { title: string; questions: AuditQuestion[] }[] = [
  {
    title: "Technology ownership",
    questions: [
      {
        id: "domain",
        question: "Who controls your domain name?",
        help: "Consider who owns the registrar account and can change its settings.",
        answers: [
          { label: "I control the account and renewal", points: 2 },
          { label: "A provider manages it, but I have access", points: 1 },
          { label: "A provider controls it entirely", points: 0 },
        ],
      },
      {
        id: "hosting",
        question: "Who controls your hosting or cloud account?",
        help: "You should know where your application runs and who can administer it.",
        answers: [
          {
            label: "I own the account and have administrator access",
            points: 2,
          },
          { label: "I have limited access or shared control", points: 1 },
          { label: "Only my developer or provider has access", points: 0 },
        ],
      },
      {
        id: "source_code",
        question: "Can you access and retain your application's source code?",
        help: "For example, through a repository that you own or control.",
        answers: [
          { label: "Yes, I control the repository", points: 2 },
          { label: "I can request a copy from my provider", points: 1 },
          { label: "I cannot access or obtain it reliably", points: 0 },
        ],
      },
    ],
  },
  {
    title: "Access and independence",
    questions: [
      {
        id: "credentials",
        question:
          "Do you control the critical accounts your business depends on?",
        help: "Think about email, analytics, payment services, and other essential accounts.",
        answers: [
          { label: "Yes, with appropriate administrator access", points: 2 },
          { label: "I control some, but not all", points: 1 },
          { label: "Most are controlled by someone else", points: 0 },
        ],
      },
      {
        id: "documentation",
        question: "Could another qualified developer understand your setup?",
        help: "Documentation, configuration instructions, and clear ownership help with handover.",
        answers: [
          {
            label: "Yes, documentation and handover information are available",
            points: 2,
          },
          {
            label: "Some information exists, but important gaps remain",
            points: 1,
          },
          {
            label: "Essential knowledge exists only with one person",
            points: 0,
          },
        ],
      },
      {
        id: "providers",
        question: "Could you change technology providers if needed?",
        help: "Consider whether you have access, exports, and a practical migration path.",
        answers: [
          {
            label:
              "Yes, I understand the process and have the necessary access",
            points: 2,
          },
          {
            label: "Possibly, but it would require significant help",
            points: 1,
          },
          { label: "No, I would struggle to move away", points: 0 },
        ],
      },
    ],
  },
  {
    title: "Continuity and risk",
    questions: [
      {
        id: "backups",
        question: "Are your important data and systems backed up?",
        help: "A backup is most useful when you know how to restore it.",
        answers: [
          { label: "Yes, and recovery has been tested", points: 2 },
          {
            label: "Backups exist, but recovery is untested or uncertain",
            points: 1,
          },
          { label: "I do not know or have no reliable backups", points: 0 },
        ],
      },
      {
        id: "renewals",
        question: "Can you identify and manage critical renewals and costs?",
        help: "Include domains, hosting, subscriptions, certificates, and third-party services.",
        answers: [
          {
            label: "Yes, ownership, costs, and renewals are documented",
            points: 2,
          },
          { label: "I know some, but the picture is incomplete", points: 1 },
          { label: "I do not have a reliable inventory", points: 0 },
        ],
      },
      {
        id: "maintenance",
        question: "Do you have a plan for maintenance and incidents?",
        help: "Consider updates, security issues, downtime, and who responds when something fails.",
        answers: [
          {
            label: "Yes, responsibilities and recovery steps are clear",
            points: 2,
          },
          {
            label: "Support is available, but the plan is informal",
            points: 1,
          },
          { label: "I rely on reacting when something goes wrong", points: 0 },
        ],
      },
    ],
  },
];

type Answers = Record<string, number>;

function getResult(score: number) {
  if (score >= 85) {
    return {
      title: "Strong ownership foundations",
      description:
        "You appear to have good control over your technology. Review the remaining gaps and keep your recovery and handover plans current.",
    };
  }

  if (score >= 55) {
    return {
      title: "Ownership gaps to address",
      description:
        "You have some important controls in place, but gaps could make changes or recovery difficult. Prioritize accounts, documentation, and backups.",
    };
  }

  return {
    title: "High dependency risk",
    description:
      "Your current setup may leave you dependent on particular people or providers. Start by securing critical accounts, source code, and recoverable backups.",
  };
}

function trackAuditEvent(
  eventName: string,
  metadata: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("build-me:analytics", {
      detail: {
        eventName,
        journey: "ownership_audit",
        metadata,
      },
    }),
  );
}

export function OwnershipAudit({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const questions = auditSteps[step].questions;
  const totalQuestions = auditSteps.reduce(
    (total, item) => total + item.questions.length,
    0,
  );
  const answeredCount = Object.keys(answers).length;
  const score = Math.round(
    (Object.values(answers).reduce((total, points) => total + points, 0) /
      (totalQuestions * 2)) *
      100,
  );
  const result = getResult(score);

  function selectAnswer(questionId: string, points: number) {
    setAnswers((current) => ({ ...current, [questionId]: points }));
    setError("");
    trackAuditEvent("ownership_audit.answer_selected", {
      questionId,
      points,
      step: step + 1,
    });
  }

  function nextStep() {
    const unanswered = questions.some(
      (question) => answers[question.id] === undefined,
    );

    if (unanswered) {
      setError("Please answer every question before continuing.");
      trackAuditEvent("ownership_audit.validation_failed", {
        step: step + 1,
      });
      return;
    }

    setError("");

    if (step < auditSteps.length - 1) {
      const next = step + 1;
      setStep(next);
      trackAuditEvent("ownership_audit.step_completed", {
        completedStep: step + 1,
        nextStep: next + 1,
      });
      return;
    }

    setCompleted(true);
    trackAuditEvent("ownership_audit.completed", {
      score,
      answeredQuestions: answeredCount,
      resultCategory:
        score >= 85 ? "strong" : score >= 55 ? "developing" : "high_risk",
    });
    trackAuditEvent("ownership_audit.results_viewed", {
      score,
      resultCategory:
        score >= 85 ? "strong" : score >= 55 ? "developing" : "high_risk",
    });
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setError("");
    setCompleted(false);
    trackAuditEvent("ownership_audit.restarted");
  }

  if (completed) {
    return (
      <section aria-labelledby="ownership-audit-title" aria-live="polite">
        <ShieldCheck size={36} aria-hidden="true" />
        <Typography id="ownership-audit-title" variant="h5" component="h2">
          Your Technology Ownership Score
        </Typography>

        <Typography
          variant="h2"
          component="p"
          aria-label={`Score: ${score} out of 100`}
        >
          {score}/100
        </Typography>

        <LinearProgress
          variant="determinate"
          value={score}
          aria-label="Ownership score"
        />

        <Typography variant="h6" component="h3" sx={{ mt: 2 }}>
          {result.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          {result.description}
        </Typography>

        <Typography variant="subtitle1">Recommended next steps</Typography>
        <ul>
          {score < 85 && (
            <li>
              Review ownership and administrator access for critical accounts.
            </li>
          )}
          {score < 100 && (
            <li>
              Document your technology setup and provider handover process.
            </li>
          )}
          {score < 85 && (
            <li>Verify backups and document how to restore your systems.</li>
          )}
          <li>Review these controls regularly as your technology changes.</li>
        </ul>

        <Alert severity="info" sx={{ mb: 2 }}>
          This is a self-assessment based on your answers, not a security audit
          or certification.
        </Alert>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<RotateCcw size={16} />}
            onClick={restart}
          >
            Retake audit
          </Button>
          <Button variant="contained" onClick={onBack}>
            Back to Work With Me
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="ownership-audit-title">
      <Typography variant="overline">
        Step {step + 1} of {auditSteps.length}
      </Typography>
      <Typography id="ownership-audit-title" variant="h5" component="h2">
        Technology Ownership Audit
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {auditSteps[step].title}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={((step + 1) / auditSteps.length) * 100}
        sx={{ my: 2 }}
        aria-label={`Audit progress, step ${step + 1} of ${auditSteps.length}`}
      />

      {questions.map((question, index) => (
        <fieldset
          key={question.id}
          style={{
            border: "1px solid var(--mui-palette-divider, #ddd)",
            borderRadius: 8,
            padding: 16,
            margin: "0 0 16px",
            minWidth: 0,
          }}
        >
          <legend style={{ paddingInline: 6, fontWeight: 600 }}>
            {question.question}
          </legend>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {question.help}
          </Typography>

          <div role="group" aria-label={question.question}>
            {question.answers.map((answer) => (
              <label
                key={answer.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 4px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={answer.points}
                  checked={answers[question.id] === answer.points}
                  onChange={() => selectAnswer(question.id, answer.points)}
                />
                <span>{answer.label}</span>
              </label>
            ))}
          </div>
          <Typography variant="caption" color="text.secondary">
            Question {step * 3 + index + 1} of {totalQuestions}
          </Typography>
        </fieldset>
      ))}

      {error && (
        <Alert severity="warning" role="alert" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {step === 0 ? (
          <Button
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={onBack}
          >
            Back to paths
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => {
              setError("");
              setStep((current) => current - 1);
            }}
          >
            Previous step
          </Button>
        )}

        <Button
          variant="contained"
          endIcon={<ArrowRight size={16} />}
          onClick={nextStep}
        >
          {step === auditSteps.length - 1 ? "Calculate my score" : "Continue"}
        </Button>
      </div>
    </section>
  );
}
