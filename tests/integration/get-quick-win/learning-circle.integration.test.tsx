import "@testing-library/jest-dom/vitest";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GetQuickWinsModal } from "../../../apps/web/src/components/GetQuickWins/GetQuickWinsModal";
import { TELEGRAM_LEARNING_CIRCLE_URL } from "../../../apps/web/src/components/GetQuickWins/learningCircle/learningCircleConfig";

interface CapturedEvent {
  eventName: string;
  journey?: string;
  metadata?: Record<string, unknown>;
}

let events: CapturedEvent[] = [];

function recordEvent(event: Event): void {
  events.push((event as CustomEvent<CapturedEvent>).detail);
}

function learningCircleEvents(): CapturedEvent[] {
  return events.filter((event) =>
    event.eventName.startsWith("ownership_learning_circle."),
  );
}

async function openLearningCircle(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));

  await user.click(
    screen.getByRole("button", {
      name: /^Technology Ownership Learning Circle:/,
    }),
  );

  expect(
    await screen.findByRole("heading", {
      name: "Technology Ownership Learning Circle",
    }),
  ).toBeInTheDocument();
}

async function completeLearningCircleRegistration(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(
    screen.getByRole("button", {
      name: "Continue to registration",
    }),
  );

  expect(
    await screen.findByRole("heading", {
      name: "Join the Learning Circle",
    }),
  ).toBeInTheDocument();

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

beforeEach(() => {
  events = [];
  window.addEventListener("build-me:analytics", recordEvent);
});

afterEach(() => {
  window.removeEventListener("build-me:analytics", recordEvent);
  cleanup();
  vi.restoreAllMocks();
});

describe("Ownership Learning Circle integration", () => {
  it("opens the Learning Circle from Get Quick Wins", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await openLearningCircle(user);

    expect(
      screen.getByRole("button", {
        name: "Continue to registration",
      }),
    ).toBeEnabled();

    expect(
      screen.getByRole("progressbar", {
        name: "Step 1 of 3",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("What you can learn")).toBeInTheDocument();
  });

  it("completes registration and reaches the Telegram invitation", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await openLearningCircle(user);

    await waitFor(() => {
      expect(learningCircleEvents().map((event) => event.eventName)).toEqual([
        "ownership_learning_circle.selected",
        "ownership_learning_circle.started",
        "ownership_learning_circle.explanation_viewed",
      ]);
    });

    await completeLearningCircleRegistration(user);

    expect(screen.getByText(/Alex Morgan/)).toBeInTheDocument();

    expect(
      screen.getByRole("progressbar", {
        name: "Step 3 of 3",
      }),
    ).toBeInTheDocument();

    const telegramInvitation = screen.getByRole("link", {
      name: "Join the Learning Circle",
    });

    expect(telegramInvitation).toHaveAttribute(
      "href",
      TELEGRAM_LEARNING_CIRCLE_URL,
    );

    expect(telegramInvitation).toHaveAttribute("target", "_blank");

    await waitFor(() => {
      expect(learningCircleEvents().map((event) => event.eventName)).toEqual([
        "ownership_learning_circle.selected",
        "ownership_learning_circle.started",
        "ownership_learning_circle.explanation_viewed",
        "ownership_learning_circle.registration_started",
        "ownership_learning_circle.step_completed",
        "ownership_learning_circle.registration_completed",
        "ownership_learning_circle.step_completed",
        "ownership_learning_circle.join_viewed",
      ]);
    });

    await user.click(telegramInvitation);

    await waitFor(() => {
      expect(learningCircleEvents().map((event) => event.eventName)).toContain(
        "ownership_learning_circle.telegram_opened",
      );
    });
  });

  it("preserves registration details when navigating back from the join step", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await openLearningCircle(user);
    await completeLearningCircleRegistration(user);

    await user.click(
      screen.getByRole("button", {
        name: /previous|back/i,
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Join the Learning Circle",
      }),
    ).toBeInTheDocument();

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

  it("returns to the explanation step from registration", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await openLearningCircle(user);

    await user.click(
      screen.getByRole("button", {
        name: "Continue to registration",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Join the Learning Circle",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /previous|back/i,
      }),
    );

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

  it("returns to the options without opening another journey", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await openLearningCircle(user);

    await user.click(
      screen.getByRole("button", {
        name: "Back to options",
      }),
    );

    expect(
      await screen.findByRole("button", {
        name: /^Technology Ownership Audit:/,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /^Technology Ownership Learning Circle:/,
      }),
    ).toBeInTheDocument();

    expect(learningCircleEvents().map((event) => event.eventName)).toContain(
      "ownership_learning_circle.back_to_paths",
    );

    expect(
      events.some((event) => event.eventName.startsWith("work_with_me.")),
    ).toBe(false);
  });

  it("closes the modal without opening Work With Me", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await openLearningCircle(user);

    await user.click(
      screen.getByRole("button", {
        name: "Close Get Quick Wins modal",
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: "Technology Ownership Learning Circle",
        }),
      ).not.toBeInTheDocument();
    });

    expect(
      events.some((event) => event.eventName.startsWith("work_with_me.")),
    ).toBe(false);
  });
});
