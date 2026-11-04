// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GetQuickWinsModal } from "../../../apps/web/src/components/GetQuickWins/GetQuickWinsModal";
import { openWorkWithMe } from "../../../apps/web/src/components/WorkWithMe/openWorkWithMe";

// The final step hands over to Work With Me through this helper. Mocking it
// keeps these tests about Get Quick Wins only.
vi.mock("../../../apps/web/src/components/WorkWithMe/openWorkWithMe", () => ({
  openWorkWithMe: vi.fn(),
}));

type User = ReturnType<typeof userEvent.setup>;

interface CapturedEvent {
  eventName: string;
  journey?: string;
  metadata?: Record<string, unknown>;
}

const VISITOR = { name: "Alex Tester", email: "alex@example.com" };

const TITLE_ID = "get-quick-wins-title";
const QUESTIONS_PER_SECTION = 3;
const SECTION_COUNT = 3;
const TOTAL_QUESTIONS = QUESTIONS_PER_SECTION * SECTION_COUNT;

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

/** Spreads a total (0-18) across the nine questions, two points at a time. */
function pointsForTotal(total: number): number[] {
  const points = Array<number>(TOTAL_QUESTIONS).fill(0);
  let remaining = total;

  for (let index = 0; index < TOTAL_QUESTIONS && remaining > 0; index += 1) {
    points[index] = Math.min(2, remaining);
    remaining -= points[index];
  }

  return points;
}

async function openModal(user: User) {
  await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));
}

async function selectAudit(user: User) {
  await user.click(
    await screen.findByRole("button", {
      name: /^Technology Ownership Audit:/,
    }),
  );
}

async function continueToRegistration(user: User) {
  await user.click(
    screen.getByRole("button", { name: /continue to registration/i }),
  );
}

async function register(user: User, visitor = VISITOR) {
  await user.type(screen.getByLabelText(/full name/i), visitor.name);
  await user.type(screen.getByLabelText(/email address/i), visitor.email);
  await user.click(screen.getByRole("button", { name: /^next$/i }));
}

async function startQuestions(user: User) {
  await openModal(user);
  await selectAudit(user);
  await continueToRegistration(user);
  await register(user);
}

/** Answers the visible section. Each question lists its answers as 2, 1, 0. */
async function answerSection(user: User, points: number[]) {
  const radios = screen.getAllByRole("radio");

  expect(radios).toHaveLength(QUESTIONS_PER_SECTION * 3);

  for (let question = 0; question < QUESTIONS_PER_SECTION; question += 1) {
    await user.click(radios[question * 3 + (2 - points[question])]);
  }
}

async function completeQuestions(user: User, points: number[]) {
  for (let section = 0; section < SECTION_COUNT; section += 1) {
    await answerSection(
      user,
      points.slice(
        section * QUESTIONS_PER_SECTION,
        (section + 1) * QUESTIONS_PER_SECTION,
      ),
    );

    await user.click(
      screen.getByRole("button", {
        name: section === SECTION_COUNT - 1 ? /see my score/i : /^next$/i,
      }),
    );
  }
}

async function reachScore(user: User, points: number[]) {
  await startQuestions(user);
  await completeQuestions(user, points);
}

async function reachNextSteps(user: User, points: number[]) {
  await reachScore(user, points);
  await user.click(screen.getByRole("button", { name: /^next$/i }));
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
  it("shows only the Get Quick Wins button until it is clicked", () => {
    render(<GetQuickWinsModal />);

    expect(
      screen.getByRole("button", { name: "Get Quick Wins" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Get Quick Wins" }),
    ).not.toBeInTheDocument();
  });

  it("opens a modal with the Technology Ownership Audit option", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openModal(user);

    expect(
      await screen.findByRole("heading", { name: "Get Quick Wins" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Technology Ownership Audit:/ }),
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

  it("closes from the close button and tracks the step it closed from", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openModal(user);
    await user.click(
      await screen.findByRole("button", { name: "Close Get Quick Wins modal" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Get Quick Wins" }),
      ).not.toBeInTheDocument(),
    );

    expect(findEvent("get_quick_wins.closed")).toEqual({
      eventName: "get_quick_wins.closed",
      journey: "get_quick_wins",
      metadata: { lastStep: "options" },
    });
  });
});

describe("GetQuickWinsModal — step 1: about the audit", () => {
  it("explains what the audit is, why to do it and the benefits", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openModal(user);
    await selectAudit(user);

    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "About the Technology Ownership Audit",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "What is the Technology Ownership Audit?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Why do a Technology Ownership Audit?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What are the benefits?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue to registration/i }),
    ).toBeInTheDocument();
  });

  it("tracks that the audit was selected and started", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openModal(user);
    await selectAudit(user);

    expect(eventNames()).toEqual([
      "get_quick_wins.opened",
      "ownership_audit.selected",
      "ownership_audit.started",
    ]);
  });

  it("goes back to the options and tracks it", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openModal(user);
    await selectAudit(user);
    await user.click(screen.getByRole("button", { name: /^back$/i }));

    expect(
      await screen.findByRole("heading", { name: "Get Quick Wins" }),
    ).toBeInTheDocument();
    expect(eventNames()).toContain("ownership_audit.back_to_paths");
  });
});

describe("GetQuickWinsModal — step 2: registration", () => {
  async function openRegistration(user: User) {
    await openModal(user);
    await selectAudit(user);
    await continueToRegistration(user);
  }

  it("shows the registration form and tracks the step change", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openRegistration(user);

    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Register for your audit" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organisation/i)).toBeInTheDocument();

    expect(findEvent("ownership_audit.step_completed")?.metadata).toEqual({
      completedStep: 1,
      nextStep: 2,
    });
  });

  it("shows an error under each empty required field", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openRegistration(user);
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(
      screen.getByText("Please enter your name using at least 2 characters."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please enter a valid email address."),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
  });

  it("moves focus to the first invalid field", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openRegistration(user);
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByLabelText(/full name/i)).toHaveFocus();
  });

  it("flags only the email when the name is valid", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openRegistration(user);

    await user.type(screen.getByLabelText(/full name/i), VISITOR.name);
    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(
      screen.getByText("Please enter a valid email address."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Please enter your name using at least 2 characters."),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toHaveFocus();
  });

  it("clears a field's error once the visitor edits it", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openRegistration(user);
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    await user.type(screen.getByLabelText(/full name/i), "Al");

    expect(
      screen.queryByText("Please enter your name using at least 2 characters."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Please enter a valid email address."),
    ).toBeInTheDocument();
  });

  it("tracks which fields failed validation without their values", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openRegistration(user);
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(findEvent("ownership_audit.validation_failed")).toEqual({
      eventName: "ownership_audit.validation_failed",
      journey: "ownership_audit",
      metadata: { step: 2, fields: ["name", "email"] },
    });
  });

  it("goes back to the audit introduction", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openRegistration(user);
    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "About the Technology Ownership Audit",
      }),
    ).toBeInTheDocument();
  });

  it("moves to the questions and tracks the registration without personal data", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openRegistration(user);
    await register(user);

    expect(
      await screen.findByText("Step 3 of 5 · Section 1 of 3"),
    ).toBeInTheDocument();

    expect(eventNames()).toContain("ownership_audit.registration_completed");

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain(VISITOR.name);
    expect(serialized).not.toContain(VISITOR.email);
  });
});

describe("GetQuickWinsModal — step 3: the questions", () => {
  it("starts on the first section with three unanswered questions", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await startQuestions(user);

    expect(
      await screen.findByText("Step 3 of 5 · Section 1 of 3"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Technology ownership" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 9")).toBeInTheDocument();
    expect(screen.getByText("Question 3 of 9")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(9);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("blocks Next until every question in the section is answered", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await startQuestions(user);
    await screen.findByText("Step 3 of 5 · Section 1 of 3");

    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please answer every question before continuing.",
    );
    expect(
      screen.getByText("Step 3 of 5 · Section 1 of 3"),
    ).toBeInTheDocument();
    expect(findEvent("ownership_audit.validation_failed")?.metadata).toEqual({
      step: 3,
      section: 1,
    });
  });

  it("clears the message when a question is answered", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await startQuestions(user);
    await screen.findByText("Step 3 of 5 · Section 1 of 3");

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getAllByRole("radio")[0]);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("tracks each answer by question, points and section, not by text", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await startQuestions(user);
    await screen.findByText("Step 3 of 5 · Section 1 of 3");

    await user.click(screen.getAllByRole("radio")[0]);

    expect(findEvent("ownership_audit.answer_selected")).toEqual({
      eventName: "ownership_audit.answer_selected",
      journey: "ownership_audit",
      metadata: { questionId: "domain", points: 2, step: 3, section: 1 },
    });
  });

  it("moves through the sections and labels the last button See my score", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await startQuestions(user);
    await screen.findByText("Step 3 of 5 · Section 1 of 3");

    await answerSection(user, [2, 2, 2]);
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(
      screen.getByText("Step 3 of 5 · Section 2 of 3"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Access and independence" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Question 4 of 9")).toBeInTheDocument();

    await answerSection(user, [2, 2, 2]);
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(
      screen.getByText("Step 3 of 5 · Section 3 of 3"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Continuity and risk" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /see my score/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^next$/i }),
    ).not.toBeInTheDocument();
  });

  it("goes back a section and keeps the answers", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await startQuestions(user);
    await screen.findByText("Step 3 of 5 · Section 1 of 3");

    await answerSection(user, [2, 1, 0]);
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    expect(
      screen.getByText("Step 3 of 5 · Section 1 of 3"),
    ).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked(); // question 1: 2 points
    expect(radios[4]).toBeChecked(); // question 2: 1 point
    expect(radios[8]).toBeChecked(); // question 3: 0 points
  });

  it("goes back to registration from the first section with the details kept", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await startQuestions(user);
    await screen.findByText("Step 3 of 5 · Section 1 of 3");

    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue(VISITOR.name);
    expect(screen.getByLabelText(/email address/i)).toHaveValue(VISITOR.email);
  });
});

describe("GetQuickWinsModal — step 4: the score", () => {
  it("shows the visitor's name, score and result", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachScore(user, pointsForTotal(18));

    expect(await screen.findByText("Step 4 of 5")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your Technology Ownership Score" }),
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

  it.each([
    { total: 0, score: "0/100", band: "High dependency risk" },
    { total: 9, score: "50/100", band: "High dependency risk" },
    { total: 10, score: "56/100", band: "Ownership gaps to address" },
    { total: 15, score: "83/100", band: "Ownership gaps to address" },
    { total: 16, score: "89/100", band: "Strong ownership foundations" },
  ])(
    "shows $score and '$band' for $total of 18 points",
    async ({ total, score, band }) => {
      const user = userEvent.setup();

      render(<GetQuickWinsModal />);
      await reachScore(user, pointsForTotal(total));

      expect(await screen.findByTestId("quick-wins-score")).toHaveTextContent(
        score,
      );
      expect(screen.getByTestId("quick-wins-band")).toHaveTextContent(band);
    },
  );

  it("tracks completion and the results view with the score and category only", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachScore(user, pointsForTotal(15));
    await screen.findByTestId("quick-wins-score");

    expect(findEvent("ownership_audit.completed")?.metadata).toEqual({
      score: 83,
      answeredQuestions: 9,
      resultCategory: "developing",
    });
    expect(findEvent("ownership_audit.results_viewed")?.metadata).toEqual({
      score: 83,
      resultCategory: "developing",
    });

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain(VISITOR.name);
    expect(serialized).not.toContain(VISITOR.email);
  });

  it("tracks the step change to the score before completion", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachScore(user, pointsForTotal(18));
    await screen.findByTestId("quick-wins-score");

    const names = eventNames();
    const stepIndex = names.lastIndexOf("ownership_audit.step_completed");

    expect(events[stepIndex].metadata).toEqual({
      completedStep: 3,
      nextStep: 4,
    });
    expect(names.slice(stepIndex)).toEqual([
      "ownership_audit.step_completed",
      "ownership_audit.completed",
      "ownership_audit.results_viewed",
    ]);
  });

  it("goes back to the last section of questions with the answers kept", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachScore(user, pointsForTotal(18));
    await screen.findByTestId("quick-wins-score");

    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    expect(
      screen.getByText("Step 3 of 5 · Section 3 of 3"),
    ).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
    expect(radios[3]).toBeChecked();
    expect(radios[6]).toBeChecked();
  });
});

describe("GetQuickWinsModal — step 5: next steps", () => {
  it("describes the result for the visitor by name", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachNextSteps(user, pointsForTotal(18));

    expect(await screen.findByText("Step 5 of 5")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your next steps" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Alex Tester, you are in a strong position/),
    ).toBeInTheDocument();
  });

  it.each([
    {
      total: 18,
      intro: /Alex Tester, you are in a strong position/,
      recommended: "Mentor Me",
    },
    {
      total: 10,
      intro: /Alex Tester, you have important controls in place/,
      recommended: "Deliver My Project",
    },
    {
      total: 0,
      intro: /Alex Tester, your setup may leave you dependent/,
      recommended: "Coffee With Me",
    },
  ])(
    "adapts the advice and recommended path for $total of 18 points",
    async ({ total, intro, recommended }) => {
      const user = userEvent.setup();

      render(<GetQuickWinsModal />);
      await reachNextSteps(user, pointsForTotal(total));

      expect(await screen.findByText(intro)).toBeInTheDocument();

      const pathHeadings = screen.getAllByRole("heading", { level: 4 });
      expect(pathHeadings).toHaveLength(3);
      expect(pathHeadings[0]).toHaveTextContent(recommended);
      expect(screen.getAllByText("Recommended for you")).toHaveLength(1);
    },
  );

  it("offers a link to each of the three Work With Me paths", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachNextSteps(user, pointsForTotal(0));

    for (const title of ["Deliver My Project", "Mentor Me", "Coffee With Me"]) {
      expect(
        await screen.findByRole("button", { name: `Go to ${title}` }),
      ).toBeInTheDocument();
    }
  });

  it("tracks that next steps were viewed with the result category", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachNextSteps(user, pointsForTotal(0));
    await screen.findByText("Step 5 of 5");

    expect(findEvent("ownership_audit.next_steps_viewed")?.metadata).toEqual({
      resultCategory: "high_risk",
    });
  });

  it.each([
    { path: "delivery", title: "Deliver My Project" },
    { path: "mentor", title: "Mentor Me" },
    { path: "coffee", title: "Coffee With Me" },
  ])(
    "closes and opens Work With Me on $path when '$title' is chosen",
    async ({ path, title }) => {
      const user = userEvent.setup();

      render(<GetQuickWinsModal />);
      await reachNextSteps(user, pointsForTotal(0));

      await user.click(
        await screen.findByRole("button", { name: `Go to ${title}` }),
      );

      await waitFor(() => expect(openWorkWithMe).toHaveBeenCalledWith(path));
      expect(openWorkWithMe).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(
          screen.queryByRole("heading", { name: "Your next steps" }),
        ).not.toBeInTheDocument(),
      );

      expect(findEvent("ownership_audit.path_selected")?.metadata).toEqual({
        path,
      });
      expect(findEvent("get_quick_wins.closed")?.metadata).toEqual({
        lastStep: "next",
      });
    },
  );

  it("closes from the Close button without opening Work With Me", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachNextSteps(user, pointsForTotal(18));

    await user.click(await screen.findByRole("button", { name: /^close$/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Your next steps" }),
      ).not.toBeInTheDocument(),
    );

    expect(openWorkWithMe).not.toHaveBeenCalled();
  });

  it("goes back to the score", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await reachNextSteps(user, pointsForTotal(18));
    await screen.findByText("Step 5 of 5");

    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    expect(await screen.findByText("Step 4 of 5")).toBeInTheDocument();
    expect(screen.getByTestId("quick-wins-score")).toHaveTextContent("100/100");
  });
});

describe("GetQuickWinsModal — state and accessibility", () => {
  it("starts fresh when it is reopened", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openModal(user);
    await selectAudit(user);
    await continueToRegistration(user);
    await user.type(screen.getByLabelText(/full name/i), VISITOR.name);

    await user.click(
      screen.getByRole("button", { name: "Close Get Quick Wins modal" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Register for your audit" }),
      ).not.toBeInTheDocument(),
    );

    await openModal(user);

    expect(
      await screen.findByRole("heading", { name: "Get Quick Wins" }),
    ).toBeInTheDocument();

    await selectAudit(user);
    await continueToRegistration(user);

    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
    expect(findEvent("get_quick_wins.closed")?.metadata).toEqual({
      lastStep: "register",
    });
  });

  it("labels every step with the heading the dialog refers to", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openModal(user);
    expect(document.getElementById(TITLE_ID)).toBeInTheDocument(); // options

    await selectAudit(user);
    expect(document.getElementById(TITLE_ID)).toBeInTheDocument(); // step 1

    await continueToRegistration(user);
    expect(document.getElementById(TITLE_ID)).toBeInTheDocument(); // step 2

    await register(user);
    await screen.findByText("Step 3 of 5 · Section 1 of 3");
    expect(document.getElementById(TITLE_ID)).toBeInTheDocument(); // step 3

    await completeQuestions(user, pointsForTotal(18));
    await screen.findByTestId("quick-wins-score");
    expect(document.getElementById(TITLE_ID)).toBeInTheDocument(); // step 4

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await screen.findByText("Step 5 of 5");
    expect(document.getElementById(TITLE_ID)).toBeInTheDocument(); // step 5
  });

  it("shows a progress bar that names the current step", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);
    await openModal(user);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await selectAudit(user);

    expect(screen.getByRole("progressbar")).toHaveAccessibleName("Step 1 of 5");
  });
});
