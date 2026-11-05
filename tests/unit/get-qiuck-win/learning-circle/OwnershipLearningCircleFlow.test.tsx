// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OwnershipLearningCircleFlow } from "../../../../apps/web/src/components/GetQuickWins/learningCircle/OwnershipLearningCircleFlow";

interface CapturedEvent {
  eventName: string;
  journey?: string;
  metadata?: Record<string, unknown>;
}

let events: CapturedEvent[] = [];

function recordEvent(event: Event): void {
  events.push((event as CustomEvent<CapturedEvent>).detail);
}

async function navigateToRegistration(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(
    screen.getByRole("button", {
      name: "Continue to registration",
    }),
  );
}

async function completeRegistration(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(
    screen.getByRole("textbox", { name: /full name/i }),
    "Alex Morgan",
  );

  await user.type(
    screen.getByRole("textbox", { name: /email address/i }),
    "alex@example.com",
  );

  await user.type(
    screen.getByRole("textbox", { name: /organisation/i }),
    "Example Technologies",
  );

  await user.click(
    screen.getByRole("button", {
      name: "Continue to the Learning Circle",
    }),
  );

  expect(
    await screen.findByRole("heading", {
      name: /ready to join/i,
    }),
  ).toBeInTheDocument();
}

async function navigateToJoinStep(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await navigateToRegistration(user);
  await completeRegistration(user);
}

beforeEach(() => {
  events = [];
  window.addEventListener("build-me:analytics", recordEvent);
});

afterEach(() => {
  window.removeEventListener("build-me:analytics", recordEvent);
  cleanup();
  vi.restoreAllMocks();
});

describe("OwnershipLearningCircleFlow", () => {
  it("renders the explanation and tracks its view", async () => {
    render(<OwnershipLearningCircleFlow onBack={vi.fn()} onClose={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Technology Ownership Learning Circle",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(events.map((event) => event.eventName)).toContain(
        "ownership_learning_circle.explanation_viewed",
      );
    });
  });

  it("moves from the explanation to registration", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    render(
      <OwnershipLearningCircleFlow
        onBack={vi.fn()}
        onClose={vi.fn()}
        onStepChange={onStepChange}
      />,
    );

    await navigateToRegistration(user);

    expect(
      screen.getByRole("textbox", { name: /full name/i }),
    ).toBeInTheDocument();

    expect(events.map((event) => event.eventName)).toContain(
      "ownership_learning_circle.registration_started",
    );

    expect(events.map((event) => event.eventName)).toContain(
      "ownership_learning_circle.step_completed",
    );

    await waitFor(() => {
      expect(onStepChange).toHaveBeenCalledWith("registration");
    });
  });

  it("moves to the join step after valid registration", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    render(
      <OwnershipLearningCircleFlow
        onBack={vi.fn()}
        onClose={vi.fn()}
        onStepChange={onStepChange}
      />,
    );

    await navigateToJoinStep(user);

    expect(
      screen.getByRole("heading", {
        name: /ready to join/i,
      }),
    ).toBeInTheDocument();

    expect(events.map((event) => event.eventName)).toContain(
      "ownership_learning_circle.registration_completed",
    );

    expect(events.map((event) => event.eventName)).toContain(
      "ownership_learning_circle.join_viewed",
    );

    await waitFor(() => {
      expect(onStepChange).toHaveBeenCalledWith("join");
    });
  });

  it("returns from the join step to registration and preserves values", async () => {
    const user = userEvent.setup();

    render(<OwnershipLearningCircleFlow onBack={vi.fn()} onClose={vi.fn()} />);

    await navigateToJoinStep(user);

    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    expect(screen.getByRole("textbox", { name: /full name/i })).toHaveValue(
      "Alex Morgan",
    );

    expect(screen.getByRole("textbox", { name: /email address/i })).toHaveValue(
      "alex@example.com",
    );

    expect(screen.getByRole("textbox", { name: /organisation/i })).toHaveValue(
      "Example Technologies",
    );
  });

  it("returns from registration to the explanation", async () => {
    const user = userEvent.setup();

    render(<OwnershipLearningCircleFlow onBack={vi.fn()} onClose={vi.fn()} />);

    await navigateToRegistration(user);

    await user.click(screen.getByRole("button", { name: /^previous$/i }));

    expect(
      screen.getByRole("heading", {
        name: "Technology Ownership Learning Circle",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Continue to registration",
      }),
    ).toBeInTheDocument();
  });

  it("returns to the options when Back is selected from the explanation", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<OwnershipLearningCircleFlow onBack={onBack} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", {
        name: "Back to options",
      }),
    );

    expect(onBack).toHaveBeenCalledOnce();

    expect(events.map((event) => event.eventName)).toContain(
      "ownership_learning_circle.back_to_paths",
    );
  });

  it("calls onClose from the join step", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<OwnershipLearningCircleFlow onBack={vi.fn()} onClose={onClose} />);

    await navigateToJoinStep(user);

    await user.click(
      screen.getByRole("button", {
        name: "Close",
      }),
    );

    expect(onClose).toHaveBeenCalledOnce();
  });
});
