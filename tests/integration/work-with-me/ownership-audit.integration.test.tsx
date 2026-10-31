// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OwnershipAudit } from "../../../apps/web/src/components/WorkWithMe/OwnershipAudit";

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

/**
 * A minimal stand-in for the Work With Me modal: a paths view that opens the
 * audit, and the audit's onBack returning to the paths view.
 */
function WorkWithMeHost() {
  const [view, setView] = useState<"paths" | "audit">("paths");

  if (view === "audit") {
    return <OwnershipAudit onBack={() => setView("paths")} />;
  }

  return (
    <div>
      <h2>Work With Me</h2>
      <button type="button" onClick={() => setView("audit")}>
        Start the audit
      </button>
    </div>
  );
}

/** Answers the visible step. Each question lists its answers as 2, 1, 0 points. */
async function answerStep(user: User, points: number[]) {
  const radios = screen.getAllByRole("radio");

  for (let question = 0; question < 3; question += 1) {
    await user.click(radios[question * 3 + (2 - points[question])]);
  }
}

async function completeAudit(user: User, points: number[]) {
  for (let step = 0; step < 3; step += 1) {
    await answerStep(user, points.slice(step * 3, step * 3 + 3));

    await user.click(
      screen.getByRole("button", {
        name: step === 2 ? /calculate my score/i : /^continue$/i,
      }),
    );
  }
}

const allTwos = Array<number>(9).fill(2);
const allZeros = Array<number>(9).fill(0);

beforeEach(() => {
  events = [];
  window.addEventListener("build-me:analytics", recordEvent);
});

afterEach(() => {
  window.removeEventListener("build-me:analytics", recordEvent);
  cleanup();
});

describe("Ownership Audit journey — hosted in Work With Me", () => {
  it("opens from the paths view and returns to it from step 1", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeHost />);

    await user.click(screen.getByRole("button", { name: /start the audit/i }));
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back to paths/i }));
    expect(
      screen.getByRole("heading", { name: "Work With Me" }),
    ).toBeInTheDocument();
  });

  it("completes the audit, returns to the paths view and starts clean next time", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeHost />);

    await user.click(screen.getByRole("button", { name: /start the audit/i }));
    await completeAudit(user, allTwos);

    expect(screen.getByText("100/100")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /back to work with me/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Work With Me" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start the audit/i }));

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });
});

describe("Ownership Audit journey — analytics sequence", () => {
  it("emits the full event sequence for a clean run", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={() => undefined} />);

    await completeAudit(user, allTwos);

    expect(eventNames()).toEqual([
      "ownership_audit.answer_selected",
      "ownership_audit.answer_selected",
      "ownership_audit.answer_selected",
      "ownership_audit.step_completed",
      "ownership_audit.answer_selected",
      "ownership_audit.answer_selected",
      "ownership_audit.answer_selected",
      "ownership_audit.step_completed",
      "ownership_audit.answer_selected",
      "ownership_audit.answer_selected",
      "ownership_audit.answer_selected",
      "ownership_audit.completed",
      "ownership_audit.results_viewed",
    ]);
  });

  it("records a validation failure once, before any step is completed", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={() => undefined} />);

    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await completeAudit(user, allTwos);

    const names = eventNames();

    expect(
      names.filter((name) => name === "ownership_audit.validation_failed"),
    ).toHaveLength(1);
    expect(names[0]).toBe("ownership_audit.validation_failed");
    expect(names.indexOf("ownership_audit.validation_failed")).toBeLessThan(
      names.indexOf("ownership_audit.step_completed"),
    );
  });

  it("scores the latest answer when a visitor changes their mind", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={() => undefined} />);

    // Question 1: pick 2 points, then change to 0 points.
    const firstStepRadios = screen.getAllByRole("radio");
    await user.click(firstStepRadios[0]);
    await user.click(firstStepRadios[2]);

    // Finish the rest of the audit with full marks.
    await answerStep(user, [0, 2, 2]);
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await answerStep(user, [2, 2, 2]);
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await answerStep(user, [2, 2, 2]);
    await user.click(
      screen.getByRole("button", { name: /calculate my score/i }),
    );

    // 16 of 18 points is 89/100.
    expect(screen.getByText("89/100")).toBeInTheDocument();

    const domainEvents = events.filter(
      (event) => event.metadata?.questionId === "domain",
    );

    // Re-selecting the already-checked 0-point answer fires no new change event.
    expect(domainEvents.map((event) => event.metadata?.points)).toEqual([2, 0]);
  });

  it("restarts and scores the second attempt independently", async () => {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={() => undefined} />);

    await completeAudit(user, allTwos);
    expect(screen.getByText("100/100")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retake audit/i }));
    await completeAudit(user, allZeros);

    expect(screen.getByText("0/100")).toBeInTheDocument();
    expect(screen.getByText("High dependency risk")).toBeInTheDocument();

    const names = eventNames();

    expect(
      names.filter((name) => name === "ownership_audit.completed"),
    ).toHaveLength(2);
    expect(names).toContain("ownership_audit.restarted");
    expect(names.indexOf("ownership_audit.restarted")).toBeGreaterThan(
      names.indexOf("ownership_audit.completed"),
    );
  });
});

/**
 * Contract with apps/web/src/main.tsx.
 *
 * main.tsx only forwards events it finds in `eventTypeByName`; anything else is
 * dropped with an "Unrecognized custom analytics event" warning. These tests
 * fail until every event the audit emits is registered there.
 */
describe("Ownership Audit journey — analytics registration in main.tsx", () => {
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

  const mainSource = readMainSource();

  async function collectEmittedEventNames(): Promise<string[]> {
    const user = userEvent.setup();

    render(<OwnershipAudit onBack={() => undefined} />);

    // Cover validation, a full run and a restart so every event type fires.
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await completeAudit(user, allTwos);
    await user.click(screen.getByRole("button", { name: /retake audit/i }));

    return [...new Set(eventNames())];
  }

  it("registers every event the audit emits in the event map", async () => {
    const emitted = await collectEmittedEventNames();

    expect(emitted.length).toBeGreaterThan(0);

    for (const name of emitted) {
      expect(mainSource, `"${name}" is missing from eventTypeByName`).toContain(
        `"${name}":`,
      );
    }
  });

  it("derives the ownership_audit feature from the event name", () => {
    expect(mainSource).toContain('startsWith("ownership_audit.")');
  });
});
