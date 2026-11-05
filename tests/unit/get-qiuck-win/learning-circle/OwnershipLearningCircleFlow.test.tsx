// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OwnershipLearningCircleFlow } from "../../../../apps/web/src/components/GetQuickWins/learningCircle/OwnershipLearningCircleFlow";
import { TELEGRAM_LEARNING_CIRCLE_URL } from "../../../../apps/web/src/components/GetQuickWins/learningCircle/learningCircleConfig";

interface CapturedEvent {
  eventName: string;
  journey?: string;
  metadata?: Record<string, unknown>;
}

let events: CapturedEvent[] = [];

function recordEvent(event: Event): void {
  events.push((event as CustomEvent<CapturedEvent>).detail);
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

  it("opens Telegram and moves to the join step", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    render(
      <OwnershipLearningCircleFlow
        onBack={vi.fn()}
        onClose={vi.fn()}
        onStepChange={onStepChange}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Join the Learning Circle",
      }),
    );

    expect(openSpy).toHaveBeenCalledWith(
      TELEGRAM_LEARNING_CIRCLE_URL,
      "_blank",
      "noopener,noreferrer",
    );

    expect(
      screen.getByRole("heading", {
        name: "Join the Learning Circle",
      }),
    ).toBeInTheDocument();

    expect(events.map((event) => event.eventName)).toContain(
      "ownership_learning_circle.join_clicked",
    );

    expect(events.map((event) => event.eventName)).toContain(
      "ownership_learning_circle.telegram_opened",
    );

    await waitFor(() => {
      expect(onStepChange).toHaveBeenCalledWith("join");
    });
  });

  it("renders the Telegram invitation link", async () => {
    const user = userEvent.setup();

    vi.spyOn(window, "open").mockReturnValue(null);

    render(<OwnershipLearningCircleFlow onBack={vi.fn()} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", {
        name: "Join the Learning Circle",
      }),
    );

    const link = screen.getByRole("link", {
      name: "Open Telegram invitation",
    });

    expect(link).toHaveAttribute("href", TELEGRAM_LEARNING_CIRCLE_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("returns from the join step to the explanation", async () => {
    const user = userEvent.setup();

    vi.spyOn(window, "open").mockReturnValue(null);

    render(<OwnershipLearningCircleFlow onBack={vi.fn()} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", {
        name: "Join the Learning Circle",
      }),
    );

    await user.click(screen.getByRole("button", { name: /^back$/i }));

    expect(
      screen.getByRole("heading", {
        name: "Technology Ownership Learning Circle",
      }),
    ).toBeInTheDocument();
  });

  it("returns to the options when Back is selected from the explanation", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<OwnershipLearningCircleFlow onBack={onBack} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Back to options" }));

    expect(onBack).toHaveBeenCalledOnce();

    expect(events.map((event) => event.eventName)).toContain(
      "ownership_learning_circle.back_to_paths",
    );
  });

  it("calls onClose from the join step", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    vi.spyOn(window, "open").mockReturnValue(null);

    render(<OwnershipLearningCircleFlow onBack={vi.fn()} onClose={onClose} />);

    await user.click(
      screen.getByRole("button", {
        name: "Join the Learning Circle",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
