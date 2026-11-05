// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GetQuickWinsModal } from "../../../apps/web/src/components/GetQuickWins/GetQuickWinsModal";
import { WorkWithMeModal } from "../../../apps/web/src/components/WorkWithMe/WorkWithMeModal";
import { allTools } from "../../../apps/web/src/components/GetQuickWins/toolkit/toolkitContent";

type User = ReturnType<typeof userEvent.setup>;

interface CapturedEvent {
  eventName: string;
  journey?: string;
  metadata?: Record<string, unknown>;
}

const VISITOR = { name: "Alex Tester", email: "alex@example.com" };

const JOURNEY_PREFIXES = ["ownership_toolkit.", "get_quick_wins."];

// Mirrors EXPECTED_EVENT_TYPES in the analytics service for the toolkit.
const EXPECTED_TYPES: Record<string, string> = {
  "ownership_toolkit.selected": "click",
  "ownership_toolkit.started": "feature_use",
  "ownership_toolkit.step_completed": "feature_use",
  "ownership_toolkit.validation_failed": "feature_use",
  "ownership_toolkit.registration_completed": "feature_use",
  "ownership_toolkit.content_viewed": "view",
  "ownership_toolkit.tool_opened": "click",
  "ownership_toolkit.pdf_downloaded": "click",
  "ownership_toolkit.back_to_paths": "click",
};

let events: CapturedEvent[] = [];

function recordEvent(event: Event): void {
  events.push((event as CustomEvent<CapturedEvent>).detail);
}

function journeyEvents(): CapturedEvent[] {
  return events.filter((event) =>
    JOURNEY_PREFIXES.some((prefix) => event.eventName.startsWith(prefix)),
  );
}

function journeyEventNames(): string[] {
  return journeyEvents().map((event) => event.eventName);
}

/** Both CTAs side by side, the way HeroIntro renders them. */
function HeroActions() {
  return (
    <>
      <WorkWithMeModal />
      <GetQuickWinsModal />
    </>
  );
}

async function openToolkit(user: User) {
  await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));
  await user.click(
    await screen.findByRole("button", {
      name: /^Technology Ownership Toolkit:/,
    }),
  );
}

async function registerForToolkit(user: User, visitor = VISITOR) {
  await user.click(
    screen.getByRole("button", { name: /continue to your details/i }),
  );
  await user.type(screen.getByLabelText(/full name/i), visitor.name);
  await user.type(screen.getByLabelText(/email address/i), visitor.email);
  await user.click(screen.getByRole("button", { name: /open my toolkit/i }));
  await screen.findByText("Step 3 of 3");
}

async function reachToolkit(user: User) {
  await openToolkit(user);
  await registerForToolkit(user);
}

async function downloadPdf(user: User) {
  const link = screen.getByRole("link", { name: "Download PDF" });

  // jsdom cannot follow the link, so stop the browser's own navigation.
  link.addEventListener("click", (event) => event.preventDefault());
  await user.click(link);
}

beforeEach(() => {
  events = [];
  window.addEventListener("build-me:analytics", recordEvent);
});

afterEach(() => {
  window.removeEventListener("build-me:analytics", recordEvent);
  cleanup();
});

describe("Ownership Toolkit journey — from the CTA to the PDF", () => {
  it("walks the three steps and ends on the toolkit for the visitor", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);

    expect(
      screen.getByText("Prepared for Alex Tester · Version 1.0"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Download PDF" }),
    ).toBeInTheDocument();
  });

  it("keeps the visitor's details across the steps", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);

    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    expect(screen.getByLabelText(/full name/i)).toHaveValue(VISITOR.name);

    await user.click(screen.getByRole("button", { name: /open my toolkit/i }));

    expect(
      await screen.findByText("Prepared for Alex Tester · Version 1.0"),
    ).toBeInTheDocument();
  });

  it("lets the visitor read every tool online", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);

    for (const tool of allTools) {
      const summary = screen.getByRole("button", { name: tool.title });

      await user.click(summary);

      expect(summary).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(tool.purpose)).toBeInTheDocument();
    }
  });

  it("walks back from the toolkit to the options without losing the choice", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);

    await user.click(screen.getByRole("button", { name: /^previous$/i }));
    await user.click(screen.getByRole("button", { name: /^previous$/i }));
    await user.click(screen.getByRole("button", { name: /^back$/i }));

    expect(
      await screen.findByRole("button", {
        name: /^Technology Ownership Toolkit:/,
      }),
    ).toBeInTheDocument();
  });

  it("starts fresh after the visitor closes and reopens it", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);

    await user.click(await screen.findByRole("button", { name: /^close$/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Your Technology Ownership Toolkit" }),
      ).not.toBeInTheDocument(),
    );

    await openToolkit(user);
    await user.click(
      screen.getByRole("button", { name: /continue to your details/i }),
    );

    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
    expect(screen.getByLabelText(/email address/i)).toHaveValue("");
  });

  it("runs the audit and the toolkit from the same modal without mixing them", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await openToolkit(user);
    await user.click(screen.getByRole("button", { name: /^back$/i }));

    await user.click(
      await screen.findByRole("button", {
        name: /^Technology Ownership Audit:/,
      }),
    );

    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^back$/i }));
    await user.click(
      await screen.findByRole("button", {
        name: /^Technology Ownership Toolkit:/,
      }),
    );

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });
});

describe("Ownership Toolkit journey — analytics sequence", () => {
  it("emits the full event sequence for a clean run", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);

    await user.click(
      screen.getByRole("button", { name: "Domain and DNS checklist" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Backup and recovery checklist" }),
    );
    await downloadPdf(user);
    await user.click(screen.getByRole("button", { name: /^close$/i }));

    expect(journeyEventNames()).toEqual([
      "get_quick_wins.opened",
      "ownership_toolkit.selected",
      "ownership_toolkit.started",
      "ownership_toolkit.step_completed", // why -> details
      "ownership_toolkit.registration_completed",
      "ownership_toolkit.step_completed", // details -> toolkit
      "ownership_toolkit.content_viewed",
      "ownership_toolkit.tool_opened",
      "ownership_toolkit.tool_opened",
      "ownership_toolkit.pdf_downloaded",
      "get_quick_wins.closed",
    ]);
  });

  it("numbers the step transitions 1 to 3 in order", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);

    const transitions = journeyEvents()
      .filter((event) => event.eventName === "ownership_toolkit.step_completed")
      .map((event) => event.metadata);

    expect(transitions).toEqual([
      { completedStep: 1, nextStep: 2 },
      { completedStep: 2, nextStep: 3 },
    ]);
  });

  it("records which tools were opened and in which part", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);

    await user.click(
      screen.getByRole("button", { name: "Provider exit plan" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Maintenance and incident plan" }),
    );

    const opened = journeyEvents()
      .filter((event) => event.eventName === "ownership_toolkit.tool_opened")
      .map((event) => event.metadata);

    expect(opened).toEqual([
      { toolId: "providers", part: 2 },
      { toolId: "maintenance", part: 3 },
    ]);
  });

  it("tags each event with its own journey", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);
    await user.click(screen.getByRole("button", { name: /^close$/i }));

    for (const event of journeyEvents()) {
      const expectedJourney = event.eventName.startsWith("get_quick_wins.")
        ? "get_quick_wins"
        : "ownership_toolkit";

      expect(event.journey, event.eventName).toBe(expectedJourney);
    }
  });

  it("never puts the visitor's details or toolkit text in an event", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await openToolkit(user);
    await user.click(
      screen.getByRole("button", { name: /continue to your details/i }),
    );
    // Fail the form once, then fill it in properly.
    await user.click(screen.getByRole("button", { name: /open my toolkit/i }));
    await user.type(screen.getByLabelText(/full name/i), VISITOR.name);
    await user.type(screen.getByLabelText(/email address/i), VISITOR.email);
    await user.click(screen.getByRole("button", { name: /open my toolkit/i }));
    await screen.findByText("Step 3 of 3");
    await user.click(
      screen.getByRole("button", { name: "Domain and DNS checklist" }),
    );

    const serialized = JSON.stringify(journeyEvents());

    expect(serialized).not.toContain(VISITOR.name);
    expect(serialized).not.toContain(VISITOR.email);
    expect(serialized).not.toContain(allTools[0].purpose);
  });

  it("closes without handing the visitor over to Work With Me", async () => {
    const user = userEvent.setup();

    render(<HeroActions />);
    await reachToolkit(user);
    await user.click(screen.getByRole("button", { name: /^close$/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Your Technology Ownership Toolkit" }),
      ).not.toBeInTheDocument(),
    );

    expect(
      screen.queryByRole("button", { name: /all project paths/i }),
    ).not.toBeInTheDocument();
    expect(
      events.map((event) => event.eventName).filter((name) =>
        name.startsWith("work_with_me."),
      ),
    ).toEqual([]);
  });
});

/**
 * Contract with apps/web/src/main.tsx.
 *
 * main.tsx only forwards events it finds in eventTypeByName; anything else is
 * dropped with an "Unrecognized custom analytics event" warning, and the
 * analytics service rejects an event whose type differs from its own list.
 * These tests run a journey that fires every toolkit event and check each one.
 */
describe("Ownership Toolkit journey — analytics registration in main.tsx", () => {
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
    const entry = /^\s*"([a-z_]+\.[a-z_]+)":\s*"(click|feature_use|view)",\s*$/gm;
    const map: Record<string, string> = {};

    for (const match of source.matchAll(entry)) {
      map[match[1]] = match[2];
    }

    return map;
  }

  /** Fires validation failures, a back step, a registration, a tool and the PDF. */
  async function emitEveryToolkitEvent(): Promise<string[]> {
    const user = userEvent.setup();

    render(<HeroActions />);

    // Open, choose the toolkit, go back, choose it again.
    await openToolkit(user);
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    await user.click(
      await screen.findByRole("button", {
        name: /^Technology Ownership Toolkit:/,
      }),
    );

    // Fail the details form once, then register.
    await user.click(
      screen.getByRole("button", { name: /continue to your details/i }),
    );
    await user.click(screen.getByRole("button", { name: /open my toolkit/i }));
    await user.type(screen.getByLabelText(/full name/i), VISITOR.name);
    await user.type(screen.getByLabelText(/email address/i), VISITOR.email);
    await user.click(screen.getByRole("button", { name: /open my toolkit/i }));
    await screen.findByText("Step 3 of 3");

    // Open a tool and download the PDF.
    await user.click(
      screen.getByRole("button", { name: "Domain and DNS checklist" }),
    );
    await downloadPdf(user);

    return [
      ...new Set(
        journeyEventNames().filter((name) => name.startsWith("ownership_toolkit.")),
      ),
    ];
  }

  it("fires every event name the toolkit can emit", async () => {
    const emitted = await emitEveryToolkitEvent();

    expect(emitted.sort()).toEqual(Object.keys(EXPECTED_TYPES).sort());
  });

  it("registers every emitted event in the event map with the right type", async () => {
    const emitted = await emitEveryToolkitEvent();
    const eventMap = readEventMap(readMainSource());

    expect(Object.keys(eventMap).length).toBeGreaterThan(0);

    for (const name of emitted) {
      expect(eventMap, `"${name}" is missing from eventTypeByName`).toHaveProperty(
        [name],
      );
      expect(eventMap[name], `type of "${name}"`).toBe(EXPECTED_TYPES[name]);
    }
  });

  it("derives the ownership_toolkit feature from the event name", () => {
    expect(readMainSource()).toContain('startsWith("ownership_toolkit.")');
  });
});
