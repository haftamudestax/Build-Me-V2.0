import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OwnershipAudit } from "../../../apps/web/src/components/WorkWithMe/OwnershipAudit";

const STEP_COUNT = 3;
const QUESTIONS_PER_STEP = 3;
const TOTAL_QUESTIONS = STEP_COUNT * QUESTIONS_PER_STEP;
const MAX_TOTAL_POINTS = TOTAL_QUESTIONS * 2;

type User = ReturnType<typeof userEvent.setup>;

interface CapturedEvent {
  eventName: string;
  journey?: string;
  metadata?: Record<string, unknown>;
}

let events: CapturedEvent[] = [];

function recordEvent(event: Event): void {
  events.push((event as CustomEvent<CapturedEvent>).detail);
}

function eventNames(): string[] {
  return events.map((event) => event.eventName);
}

function findEvent(eventName: string): CapturedEvent | undefined {
  return events.find((event) => event.eventName === eventName);
}

/**
 * Spreads a total (0-18) across the nine questions, two points at a time.
 * Example: 15 -> seven 2s, one 1, the rest 0.
 */
function pointsForTotal(total: number): number[] {
  const points = Array<number>(TOTAL_QUESTIONS).fill(0);
  let remaining = total;

  for (let index = 0; index < TOTAL_QUESTIONS && remaining > 0; index += 1) {
    points[index] = Math.min(2, remaining);
    remaining -= points[index];
  }

  return points;
}

/** Answers the visible step. Each question lists its answers as 2, 1, 0 points. */
async function answerCurrentStep(user: User, stepPoints: number[]) {
  const radios = screen.getAllByRole("radio");

  expect(radios).toHaveLength(QUESTIONS_PER_STEP * 3);

  for (let question = 0; question < QUESTIONS_PER_STEP; question += 1) {
    await user.click(radios[question * 3 + (2 - stepPoints[question])]);
  }
}

async function completeAudit(user: User, points: number[]) {
  for (let step = 0; step < STEP_COUNT; step += 1) {
    await answerCurrentStep(
      user,
      points.slice(step * QUESTIONS_PER_STEP, (step + 1) * QUESTIONS_PER_STEP),
    );

    await user.click(
      screen.getByRole("button", {
        name: step === STEP_COUNT - 1 ? /calculate my score/i : /^continue$/i,
      }),
    );
  }
}

beforeEach(() => {
  events = [];
  window.addEventListener("build-me:analytics", recordEvent);
});

afterEach(() => {
  window.removeEventListener("build-me:analytics", recordEvent);
  cleanup();
});

describe("OwnershipAudit — first step", () => {
  it("renders the title, progress and the first three questions", () => {
    render(<OwnershipAudit onBack={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Technology Ownership Audit" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Technology ownership")).toBeInTheDocument();

    expect(
      screen.getByText("Who controls your domain name?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Who controls your hosting or cloud account?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Can you access and retain your application's source code?",
      ),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("radio")).toHaveLength(9);
    expect(screen.getByText("Question 1 of 9")).toBeInTheDocument();
    expect(screen.getByText("Question 3 of 9")).toBeInTheDocument();
  });

  it("starts with no answer selected", () => {
    render(<OwnershipAudit onBack={vi.fn()} />);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("offers Back to paths, not Previous step, and calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<OwnershipAudit onBack={onBack} />);

    expect(
      screen.queryByRole("button", { name: /previous step/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back to paths/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("OwnershipAudit — validation", () => {
  it("blocks Continue until every question on the step is answered", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please answer every question before continuing.",
    );
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("still blocks when only some questions are answered", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    const radios = screen.getAllByRole("radio");
    await user.click(radios[0]);
    await user.click(radios[3]);

    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("clears the message once an answer is selected", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getAllByRole("radio")[0]);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("tracks the failed validation with the step number", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(findEvent("ownership_audit.validation_failed")).toEqual({
      eventName: "ownership_audit.validation_failed",
      journey: "ownership_audit",
      metadata: { step: 1 },
    });
  });
});

describe("OwnershipAudit — step navigation", () => {
  it("moves to step 2 after the first step is answered", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await answerCurrentStep(user, [2, 1, 0]);
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Access and independence")).toBeInTheDocument();
    expect(screen.getByText("Question 4 of 9")).toBeInTheDocument();
    expect(findEvent("ownership_audit.step_completed")?.metadata).toEqual({
      completedStep: 1,
      nextStep: 2,
    });
  });

  it("labels the last step's button Calculate my score", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    for (let step = 0; step < 2; step += 1) {
      await answerCurrentStep(user, [2, 2, 2]);
      await user.click(screen.getByRole("button", { name: /^continue$/i }));
    }

    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    expect(screen.getByText("Continuity and risk")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /calculate my score/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^continue$/i }),
    ).not.toBeInTheDocument();
  });

  it("goes back a step and keeps the earlier answers", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<OwnershipAudit onBack={onBack} />);

    await answerCurrentStep(user, [2, 1, 0]);
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(
      screen.queryByRole("button", { name: /back to paths/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous step/i }));

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(onBack).not.toHaveBeenCalled();

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked(); // question 1: 2 points
    expect(radios[4]).toBeChecked(); // question 2: 1 point
    expect(radios[8]).toBeChecked(); // question 3: 0 points
  });
});

describe("OwnershipAudit — analytics for answers", () => {
  it("tracks each selected answer with its question, points and step", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await user.click(screen.getAllByRole("radio")[0]);

    expect(events).toEqual([
      {
        eventName: "ownership_audit.answer_selected",
        journey: "ownership_audit",
        metadata: { questionId: "domain", points: 2, step: 1 },
      },
    ]);
  });

  it("tags every event with the ownership_audit journey", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await completeAudit(user, pointsForTotal(MAX_TOTAL_POINTS));

    expect(events.length).toBeGreaterThan(0);

    for (const event of events) {
      expect(event.journey).toBe("ownership_audit");
    }
  });
});

describe("OwnershipAudit — scoring", () => {
  const scoreCases = [
    {
      total: 0,
      score: 0,
      title: "High dependency risk",
      category: "high_risk",
    },
    {
      total: 9,
      score: 50,
      title: "High dependency risk",
      category: "high_risk",
    },
    {
      total: 10,
      score: 56,
      title: "Ownership gaps to address",
      category: "developing",
    },
    {
      total: 15,
      score: 83,
      title: "Ownership gaps to address",
      category: "developing",
    },
    {
      total: 16,
      score: 89,
      title: "Strong ownership foundations",
      category: "strong",
    },
    {
      total: 17,
      score: 94,
      title: "Strong ownership foundations",
      category: "strong",
    },
    {
      total: 18,
      score: 100,
      title: "Strong ownership foundations",
      category: "strong",
    },
  ];

  it.each(scoreCases)(
    "$total of 18 points scores $score/100 and shows '$title'",
    async ({ total, score, title, category }) => {
      const user = userEvent.setup();

      render(<OwnershipAudit onBack={vi.fn()} />);

      await completeAudit(user, pointsForTotal(total));

      expect(
        screen.getByRole("heading", {
          name: "Your Technology Ownership Score",
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(`${score}/100`)).toBeInTheDocument();
      expect(
        screen.getByLabelText(`Score: ${score} out of 100`),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();

      expect(findEvent("ownership_audit.completed")?.metadata).toEqual({
        score,
        answeredQuestions: TOTAL_QUESTIONS,
        resultCategory: category,
      });
      expect(findEvent("ownership_audit.results_viewed")?.metadata).toEqual({
        score,
        resultCategory: category,
      });
    },
  );

  it("tracks completed before results_viewed", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await completeAudit(user, pointsForTotal(MAX_TOTAL_POINTS));

    expect(eventNames().slice(-2)).toEqual([
      "ownership_audit.completed",
      "ownership_audit.results_viewed",
    ]);
  });
});

describe("OwnershipAudit — results", () => {
  const adminAccessStep =
    /Review ownership and administrator access for critical accounts/;
  const documentStep =
    /Document your technology setup and provider handover process/;
  const backupsStep = /Verify backups and document how to restore your systems/;
  const reviewStep = /Review these controls regularly/;

  it("shows only the regular review step for a perfect score", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await completeAudit(user, pointsForTotal(18));

    expect(screen.getByText(reviewStep)).toBeInTheDocument();
    expect(screen.queryByText(adminAccessStep)).not.toBeInTheDocument();
    expect(screen.queryByText(documentStep)).not.toBeInTheDocument();
    expect(screen.queryByText(backupsStep)).not.toBeInTheDocument();
  });

  it("adds the documentation step once the score is below 100", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await completeAudit(user, pointsForTotal(16)); // 89, still strong

    expect(screen.getByText(documentStep)).toBeInTheDocument();
    expect(screen.getByText(reviewStep)).toBeInTheDocument();
    expect(screen.queryByText(adminAccessStep)).not.toBeInTheDocument();
    expect(screen.queryByText(backupsStep)).not.toBeInTheDocument();
  });

  it("shows every recommended step for a low score", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await completeAudit(user, pointsForTotal(0));

    expect(screen.getByText(adminAccessStep)).toBeInTheDocument();
    expect(screen.getByText(documentStep)).toBeInTheDocument();
    expect(screen.getByText(backupsStep)).toBeInTheDocument();
    expect(screen.getByText(reviewStep)).toBeInTheDocument();
  });

  it("states that the result is a self-assessment, not a certification", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await completeAudit(user, pointsForTotal(9));

    expect(
      screen.getByText(
        "This is a self-assessment based on your answers, not a security audit or certification.",
      ),
    ).toBeInTheDocument();
  });

  it("calls onBack from Back to Work With Me", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<OwnershipAudit onBack={onBack} />);

    await completeAudit(user, pointsForTotal(9));
    await user.click(
      screen.getByRole("button", { name: /back to work with me/i }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("restarts with a clean form and tracks the restart", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={vi.fn()} />);

    await completeAudit(user, pointsForTotal(18));
    await user.click(screen.getByRole("button", { name: /retake audit/i }));

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }

    expect(findEvent("ownership_audit.restarted")).toEqual({
      eventName: "ownership_audit.restarted",
      journey: "ownership_audit",
      metadata: {},
    });
  });
});
