// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GetQuickWinsModal } from "../../../apps/web/src/components/GetQuickWins/GetQuickWinsModal";
import { WorkWithMeModal } from "../../../apps/web/src/components/WorkWithMe/WorkWithMeModal";

type User = ReturnType<typeof userEvent.setup>;

interface CapturedEvent {
  eventName: string;
  journey?: string;
  metadata?: Record<string, unknown>;
}

const VISITOR = { name: "Alex Tester", email: "alex@example.com" };

const JOURNEY_PREFIXES = ["ownership_audit.", "get_quick_wins."];

let events: CapturedEvent[] = [];

function recordEvent(event: Event): void {
  events.push((event as CustomEvent<CapturedEvent>).detail);
}

/** Events from this journey only, leaving out the Work With Me modal's own. */
function journeyEvents(): CapturedEvent[] {
  return events.filter((event) =>
    JOURNEY_PREFIXES.some((prefix) => event.eventName.startsWith(prefix)),
  );
}

function journeyEventNames(): string[] {
  return journeyEvents().map((event) => event.eventName);
}

/**
 * Both CTAs side by side, the way HeroIntro renders them. Get Quick Wins hands
 * over to Work With Me through a window event, so both must be mounted.
 */
function HeroActions() {
  return (
    <>
      <WorkWithMeModal />
      <GetQuickWinsModal />
    </>
  );
}

/** Spreads a total (0-18) across the nine questions, two points at a time. */
function pointsForTotal(total: number): number[] {
  const points = Array<number>(9).fill(0);
  let remaining = total;

  for (let index = 0; index < 9 && remaining > 0; index += 1) {
    points[index] = Math.min(2, remaining);
    remaining -= points[index];
  }

  return points;
}

async function openAudit(user: User) {
  await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));
  await user.click(
    await screen.findByRole("button", {
      name: /^Technology Ownership Audit:/,
    }),
  );
}

async function register(user: User, visitor = VISITOR) {
  await user.click(
    screen.getByRole("button", { name: /continue to registration/i }),
  );
  await user.type(screen.getByLabelText(/full name/i), visitor.name);
  await user.type(screen.getByLabelText(/email address/i), visitor.email);
  await user.click(screen.getByRole("button", { name: /^next$/i }));
}

/** Answers the visible section. Each question lists its answers as 2, 1, 0. */
async function answerSection(user: User, points: number[]) {
  const radios = screen.getAllByRole("radio");

  for (let question = 0; question < 3; question += 1) {
    await user.click(radios[question * 3 + (2 - points[question])]);
  }
}

async function completeQuestions(user: User, points: number[]) {
  for (let section = 0; section < 3; section += 1) {
    await answerSection(user, points.slice(section * 3, section * 3 + 3));

    await user.click(
      screen.getByRole("button", {
        name: section === 2 ? /see my score/i : /^next$/i,
      }),
    );
  }
}

async function reachScore(user: User, points: number[]) {
  await openAudit(user);
  await register(user);
  await completeQuestions(user, points);
}

async function reachNextSteps(user: User, points: number[]) {
  await reachScore(user, points);
  await user.click(screen.getByRole("button", { name: /^next$/i }));
}

beforeEach(() => {
  events = [];
  window.addEventListener("build-me:analytics", recordEvent);
});

afterEach(() => {
  window.removeEventListener("build-me:analytics", recordEvent);
  cleanup();
});

describe("Get Quick Wins journey — from the CTA to the next steps", () => {
  it("walks all five steps and ends on advice for the visitor", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(18));

    expect(await screen.findByText("Step 5 of 5")).toBeInTheDocument();
    expect(
      screen.getByText(/Alex Tester, you are in a strong position/),
    ).toBeInTheDocument();
  });

  it("carries the name and answers from one step to the next", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachScore(user, pointsForTotal(15));

    expect(await screen.findByTestId("quick-wins-name")).toHaveTextContent(
      VISITOR.name,
    );
    expect(screen.getByTestId("quick-wins-score")).toHaveTextContent("83/100");
  });

  it("walks back through every step without losing anything", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(18));
    await screen.findByText("Step 5 of 5");

    // Next steps -> score
    await user.click(screen.getByRole("button", { name: /^previous$/i }));
    expect(await screen.findByText("Step 4 of 5")).toBeInTheDocument();

    // Score -> questions, section 3 -> 2 -> 1
    await user.click(screen.getByRole("button", { name: /^previous$/i }));
    expect(
      screen.getByText("Step 3 of 5 · Section 3 of 3"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^previous$/i }));
    expect(
      screen.getByText("Step 3 of 5 · Section 2 of 3"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^previous$/i }));
    expect(
      screen.getByText("Step 3 of 5 · Section 1 of 3"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")[0]).toBeChecked();

    // Questions -> registration, with the visitor's details still filled in
    await user.click(screen.getByRole("button", { name: /^previous$/i }));
    expect(screen.getByLabelText(/full name/i)).toHaveValue(VISITOR.name);
    expect(screen.getByLabelText(/email address/i)).toHaveValue(VISITOR.email);

    // Registration -> introduction -> options
    await user.click(screen.getByRole("button", { name: /^previous$/i }));
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(
      await screen.findByRole("heading", { name: "Get Quick Wins" }),
    ).toBeInTheDocument();
  });

  it("scores the latest answer when the visitor goes back and changes one", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachScore(user, pointsForTotal(18));
    expect(await screen.findByTestId("quick-wins-score")).toHaveTextContent(
      "100/100",
    );

    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    // Question 7 (backups): change 2 points to 0 points, then finish again.
    await user.click(screen.getAllByRole("radio")[2]);
    await user.click(screen.getByRole("button", { name: /see my score/i }));

    // 16 of 18 points is 89/100.
    expect(await screen.findByTestId("quick-wins-score")).toHaveTextContent(
      "89/100",
    );

    const completions = events.filter(
      (event) => event.eventName === "ownership_audit.completed",
    );

    expect(completions.map((event) => event.metadata?.score)).toEqual([
      100, 89,
    ]);
  });

  it.each([
    {
      total: 18,
      band: "Strong ownership foundations",
      recommended: "Mentor Me",
    },
    {
      total: 10,
      band: "Ownership gaps to address",
      recommended: "Deliver My Project",
    },
    { total: 0, band: "High dependency risk", recommended: "Coffee With Me" },
  ])(
    "gives a $band result a matching recommendation ($recommended)",
    async ({ total, band, recommended }) => {
      const user = userEvent.setup();

      render(<HeroActions />);
      await reachScore(user, pointsForTotal(total));

      expect(await screen.findByTestId("quick-wins-band")).toHaveTextContent(
        band,
      );

      await user.click(screen.getByRole("button", { name: /^next$/i }));

      const pathHeadings = await screen.findAllByRole("heading", { level: 4 });
      expect(pathHeadings[0]).toHaveTextContent(recommended);
    },
  );

  it("starts fresh after the visitor closes and reopens it", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(18));

    await user.click(await screen.findByRole("button", { name: /^close$/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Your next steps" }),
      ).not.toBeInTheDocument(),
    );

    await openAudit(user);
    await user.click(
      screen.getByRole("button", { name: /continue to registration/i }),
    );

    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
    expect(screen.getByLabelText(/email address/i)).toHaveValue("");

    await user.type(screen.getByLabelText(/full name/i), "Sam Second");
    await user.type(screen.getByLabelText(/email address/i), "sam@example.com");
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    await screen.findByText("Step 3 of 5 · Section 1 of 3");

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });
});

describe("Get Quick Wins journey — handing over to Work With Me", () => {
  it.each([
    {
      title: "Deliver My Project",
      selectedEvent: "delivery_project.selected",
    },
    { title: "Mentor Me", selectedEvent: "mentor_me.selected" },
    { title: "Coffee With Me", selectedEvent: "coffee_with_me.selected" },
  ])(
    "opens Work With Me on '$title' and closes Get Quick Wins",
    async ({ title, selectedEvent }) => {
      const user = userEvent.setup();

      render(<HeroActions />);
      await reachNextSteps(user, pointsForTotal(0));

      await user.click(
        await screen.findByRole("button", { name: `Go to ${title}` }),
      );

      // The path's form opens, with its own way back to the list of paths.
      expect(
        await screen.findByRole("button", { name: /all project paths/i }),
      ).toBeInTheDocument();

      // Get Quick Wins is closed, and Work With Me skipped its path list.
      expect(
        screen.queryByRole("heading", { name: "Your next steps" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Work With Me" }),
      ).not.toBeInTheDocument();

      const names = events.map((event) => event.eventName);

      expect(names).toContain("work_with_me.opened");
      expect(names).toContain(selectedEvent);
    },
  );

  it("shows the Mentor Me form when Mentor Me is chosen", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(0));

    await user.click(
      await screen.findByRole("button", { name: "Go to Mentor Me" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Mentor Me" }),
    ).toBeInTheDocument();
  });

  it("lets the visitor return to the Work With Me paths afterwards", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(0));

    await user.click(
      await screen.findByRole("button", { name: "Go to Coffee With Me" }),
    );
    await user.click(
      await screen.findByRole("button", { name: /all project paths/i }),
    );

    expect(
      await screen.findByRole("heading", { name: "Work With Me" }),
    ).toBeInTheDocument();
  });
});

describe("Get Quick Wins journey — analytics sequence", () => {
  it("emits the full event sequence for a clean run", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(18));
    await user.click(
      await screen.findByRole("button", { name: "Go to Mentor Me" }),
    );

    await screen.findByRole("button", { name: /all project paths/i });

    expect(journeyEventNames()).toEqual([
      "get_quick_wins.opened",
      "ownership_audit.selected",
      "ownership_audit.started",
      "ownership_audit.step_completed", // introduction -> registration
      "ownership_audit.registration_completed",
      "ownership_audit.step_completed", // registration -> questions
      ...Array<string>(9).fill("ownership_audit.answer_selected"),
      "ownership_audit.step_completed", // questions -> score
      "ownership_audit.completed",
      "ownership_audit.results_viewed",
      "ownership_audit.step_completed", // score -> next steps
      "ownership_audit.next_steps_viewed",
      "ownership_audit.path_selected",
      "get_quick_wins.closed",
    ]);
  });

  it("numbers the step transitions 1 to 5 in order", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(18));
    await screen.findByText("Step 5 of 5");

    const transitions = journeyEvents()
      .filter((event) => event.eventName === "ownership_audit.step_completed")
      .map((event) => event.metadata);

    expect(transitions).toEqual([
      { completedStep: 1, nextStep: 2 },
      { completedStep: 2, nextStep: 3 },
      { completedStep: 3, nextStep: 4 },
      { completedStep: 4, nextStep: 5 },
    ]);
  });

  it("tags the opening and closing events with the get_quick_wins journey", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(18));
    await user.click(await screen.findByRole("button", { name: /^close$/i }));

    for (const event of journeyEvents()) {
      const expectedJourney = event.eventName.startsWith("get_quick_wins.")
        ? "get_quick_wins"
        : "ownership_audit";

      expect(event.journey).toBe(expectedJourney);
    }
  });

  it("never puts the visitor's details or answer text in an event", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachNextSteps(user, pointsForTotal(0));
    await user.click(
      await screen.findByRole("button", { name: "Go to Coffee With Me" }),
    );
    await screen.findByRole("button", { name: /all project paths/i });

    const serialized = JSON.stringify(journeyEvents());

    expect(serialized).not.toContain(VISITOR.name);
    expect(serialized).not.toContain(VISITOR.email);
    expect(serialized).not.toContain("A provider controls it entirely");
  });
});

/**
 * Contract with apps/web/src/main.tsx.
 *
 * main.tsx only forwards events it finds in eventTypeByName; anything else is
 * dropped with an "Unrecognized custom analytics event" warning. These tests
 * run a journey that fires every event Get Quick Wins can emit and check that
 * each one is registered.
 */
describe("Get Quick Wins journey — analytics registration in main.tsx", () => {
  // Walk up from the working directory instead of using import.meta.url,
  // which is not a plain file URL under the jsdom environment.
  function readMainSource(): string {
    let directory = process.cwd();

    for (let depth = 0; depth < 8; depth += 1) {
      const candidate = join(directory, "apps", "web", "src", "main.tsx");

      if (existsSync(candidate)) {
        return readFileSync(candidate, "utf8");
      }

      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }

    throw new Error("Could not find apps/web/src/main.tsx above the cwd.");
  }

  function readEventMap(source: string): Record<string, string> {
    const entry =
      /^\s*"([a-z_]+\.[a-z_]+)":\s*"(click|feature_use|view)",\s*$/gm;
    const map: Record<string, string> = {};

    for (const match of source.matchAll(entry)) {
      map[match[1]] = match[2];
    }

    return map;
  }

  /** Fires validation failures, a back step, a full run and a path choice. */
  async function emitEveryEvent(): Promise<string[]> {
    const user = userEvent.setup();

    render(<HeroActions />);

    // Open, choose the audit, go back, choose it again.
    await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));
    await user.click(
      await screen.findByRole("button", {
        name: /^Technology Ownership Audit:/,
      }),
    );
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    await user.click(
      await screen.findByRole("button", {
        name: /^Technology Ownership Audit:/,
      }),
    );

    // Fail registration validation, then register.
    await user.click(
      screen.getByRole("button", { name: /continue to registration/i }),
    );
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.type(screen.getByLabelText(/full name/i), VISITOR.name);
    await user.type(screen.getByLabelText(/email address/i), VISITOR.email);
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    // Fail question validation, then finish and choose a path.
    await screen.findByText("Step 3 of 5 · Section 1 of 3");
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await completeQuestions(user, pointsForTotal(18));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(
      await screen.findByRole("button", { name: "Go to Mentor Me" }),
    );

    return [...new Set(journeyEventNames())];
  }

  it("fires every event name Get Quick Wins can emit", async () => {
    const emitted = await emitEveryEvent();

    expect(emitted.sort()).toEqual([
      "get_quick_wins.closed",
      "get_quick_wins.opened",
      "ownership_audit.answer_selected",
      "ownership_audit.back_to_paths",
      "ownership_audit.completed",
      "ownership_audit.next_steps_viewed",
      "ownership_audit.path_selected",
      "ownership_audit.registration_completed",
      "ownership_audit.results_viewed",
      "ownership_audit.selected",
      "ownership_audit.started",
      "ownership_audit.step_completed",
      "ownership_audit.validation_failed",
    ]);
  });

  it("registers every emitted event in the event map", async () => {
    const emitted = await emitEveryEvent();
    const eventMap = readEventMap(readMainSource());

    expect(Object.keys(eventMap).length).toBeGreaterThan(0);

    for (const name of emitted) {
      expect(
        eventMap,
        `"${name}" is missing from eventTypeByName`,
      ).toHaveProperty([name]);
    }
  });

  it("derives the get_quick_wins feature from the event name", () => {
    expect(readMainSource()).toContain('startsWith("get_quick_wins.")');
  });
});
