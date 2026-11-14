// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GetQuickWinsModal } from "../../../apps/web/src/components/GetQuickWins/GetQuickWinsModal";
import { OPEN_GET_QUICK_WINS_EVENT } from "../../../apps/web/src/components/GetQuickWins/openGetQuickWins";
import { openWorkWithMe } from "../../../apps/web/src/components/WorkWithMe/openWorkWithMe";

vi.mock("../../../apps/web/src/components/WorkWithMe/openWorkWithMe", () => ({
  openWorkWithMe: vi.fn(),
}));

type User = ReturnType<typeof userEvent.setup>;

interface CapturedEvent {
  eventName: string;
  journey?: string;
  metadata?: Record<string, unknown>;
}

const VISITOR = {
  name: "Alex Tester",
  email: "alex@example.com",
};

const TOTAL_QUESTIONS = 9;

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
 * Finds the forward action on screens that require explicit navigation.
 *
 * The questions screen is intentionally excluded because selecting an
 * answer automatically advances to the next question.
 */
async function getForwardButton(): Promise<HTMLElement> {
  let forwardButton: HTMLElement | undefined;

  await waitFor(() => {
    const candidates = screen.getAllByRole("button").filter((button) => {
      const accessibleName = [
        button.getAttribute("aria-label") ?? "",
        button.textContent ?? "",
      ]
        .join(" ")
        .trim();

      const isBackwardOrCloseAction = /close|previous|back|cancel/i.test(
        accessibleName,
      );

      const isDisabled =
        button.hasAttribute("disabled") ||
        button.getAttribute("aria-disabled") === "true";

      return (
        !isBackwardOrCloseAction &&
        !isDisabled &&
        button.getAttribute("aria-hidden") !== "true"
      );
    });

    expect(candidates.length).toBeGreaterThan(0);

    forwardButton = candidates[candidates.length - 1];

    expect(forwardButton).toBeVisible();
  });

  if (!forwardButton) {
    throw new Error("Unable to find an enabled forward navigation button");
  }

  return forwardButton;
}

/**
 * Spreads a total (0–18) across nine questions, with a maximum of
 * two points per question.
 */
function pointsForTotal(total: number): number[] {
  if (!Number.isInteger(total) || total < 0 || total > 18) {
    throw new RangeError("Total points must be an integer between 0 and 18");
  }

  const points = Array<number>(TOTAL_QUESTIONS).fill(0);
  let remaining = total;

  for (let index = 0; index < TOTAL_QUESTIONS && remaining > 0; index += 1) {
    points[index] = Math.min(2, remaining);
    remaining -= points[index];
  }

  return points;
}

async function openModal(_user: User): Promise<void> {
  act(() => {
    window.dispatchEvent(new CustomEvent(OPEN_GET_QUICK_WINS_EVENT));
  });

  await screen.findByRole("heading", { name: "Get Quick Wins" });
}

async function selectAudit(user: User): Promise<void> {
  const auditCard = await screen.findByRole("button", {
    name: /^Technology Ownership Audit:/,
  });

  await user.click(auditCard);
}

async function continueToRegistration(user: User): Promise<void> {
  const button = await screen.findByRole("button", {
    name: /continue to registration/i,
  });

  await user.click(button);
}

async function register(user: User, visitor = VISITOR): Promise<void> {
  await user.type(screen.getByLabelText(/full name/i), visitor.name);
  await user.type(screen.getByLabelText(/email address/i), visitor.email);

  const forwardButton = await getForwardButton();

  await user.click(forwardButton);

  await screen.findByText("Question 1 of 9");
}

async function startQuestions(user: User): Promise<void> {
  await openModal(user);
  await selectAudit(user);
  await continueToRegistration(user);
  await register(user);
}

/**
 * Answers all nine questions.
 *
 * Each question has three radio choices scoring 2, 1, or 0 points.
 * Selecting a radio automatically advances to the next question.
 * The final answer automatically advances to the score screen.
 */
async function completeQuestions(user: User, points: number[]): Promise<void> {
  expect(points).toHaveLength(TOTAL_QUESTIONS);

  for (let index = 0; index < TOTAL_QUESTIONS; index += 1) {
    const questionNumber = index + 1;

    await screen.findByText(`Question ${questionNumber} of ${TOTAL_QUESTIONS}`);

    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(3);

    const targetPoints = points[index];
    const radioIndex = targetPoints === 2 ? 0 : targetPoints === 1 ? 1 : 2;

    await user.click(radios[radioIndex]);

    if (index < TOTAL_QUESTIONS - 1) {
      await screen.findByText(
        `Question ${questionNumber + 1} of ${TOTAL_QUESTIONS}`,
      );
    } else {
      await screen.findByText("Step 4 of 5");
    }
  }
}

async function reachScore(user: User, points: number[]): Promise<void> {
  await startQuestions(user);
  await completeQuestions(user, points);
}

async function reachNextSteps(user: User, points: number[]): Promise<void> {
  await reachScore(user, points);

  const forwardButton = await getForwardButton();

  await user.click(forwardButton);

  await screen.findByText("Step 5 of 5");
}

beforeEach(() => {
  events = [];

  vi.mocked(openWorkWithMe).mockClear();

  window.addEventListener("build-me:analytics", recordEvent);
});

afterEach(() => {
  window.removeEventListener("build-me:analytics", recordEvent);
  cleanup();
});

describe("GetQuickWinsModal — opening and the options view", () => {
  it("starts closed and shows nothing until opened", () => {
    render(<GetQuickWinsModal />);

    expect(
      screen.queryByRole("heading", { name: "Get Quick Wins" }),
    ).not.toBeInTheDocument();
  });

  it("opens a modal with all three option cards when triggered", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await openModal(user);

    expect(
      screen.getByRole("heading", { name: "Get Quick Wins" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /^Technology Ownership Audit:/,
      }),
    ).toBeInTheDocument();
  });

  it("tracks the modal opening under the get_quick_wins journey", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await openModal(user);

    expect(events).toEqual([
      {
        eventName: "get_quick_wins.opened",
        journey: "get_quick_wins",
        metadata: {},
      },
    ]);
  });
});

describe("GetQuickWinsModal — step 3: the questions", () => {
  it("starts on the first question with three unanswered choices", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await startQuestions(user);

    expect(screen.getByText("Step 3 of 5 · Question 1/9")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Technology ownership",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Question 1 of 9")).toBeInTheDocument();

    expect(screen.getAllByRole("radio")).toHaveLength(3);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("tracks each answer by question, points and section, not by text", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await startQuestions(user);

    await screen.findByText("Question 1 of 9");

    await user.click(screen.getAllByRole("radio")[0]);

    expect(findEvent("ownership_audit.answer_selected")).toEqual({
      eventName: "ownership_audit.answer_selected",
      journey: "ownership_audit",
      metadata: {
        questionId: "domain",
        points: 2,
        step: 3,
        section: 1,
      },
    });

    await screen.findByText("Question 2 of 9");
  });
});

describe("GetQuickWinsModal — step 4: the score", () => {
  it("shows the visitor's name, score and result", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await reachScore(user, pointsForTotal(18));

    expect(screen.getByText("Step 4 of 5")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Your Technology Ownership Score",
      }),
    ).toBeInTheDocument();

    expect(screen.getByTestId("quick-wins-name")).toHaveTextContent(
      VISITOR.name,
    );

    expect(screen.getByTestId("quick-wins-score")).toHaveTextContent("100/100");

    expect(screen.getByLabelText("Score: 100 out of 100")).toBeInTheDocument();

    expect(screen.getByTestId("quick-wins-band")).toHaveTextContent(
      "Strong ownership foundations",
    );
  });
});

describe("GetQuickWinsModal — step 5: next steps", () => {
  it("shows tailored recommendations and handover buttons", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await reachNextSteps(user, pointsForTotal(18));

    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Your next steps",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Where to start",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "How I can help",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Go to Mentor Me",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Go to Deliver My Project",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Go to Coffee With Me",
      }),
    ).toBeInTheDocument();
  });
});
