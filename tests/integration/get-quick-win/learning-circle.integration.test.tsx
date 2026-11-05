// @vitest-environment jsdom

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

    await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));

    await user.click(
      screen.getByRole("button", {
        name: /^Technology Ownership Learning Circle:/,
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Technology Ownership Learning Circle",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Join the Learning Circle",
      }),
    ).toBeEnabled();
  });

  it("completes the explanation and Telegram invitation journey", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    render(<GetQuickWinsModal />);

    await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));

    await user.click(
      screen.getByRole("button", {
        name: /^Technology Ownership Learning Circle:/,
      }),
    );

    await waitFor(() => {
      expect(learningCircleEvents().map((event) => event.eventName)).toEqual([
        "ownership_learning_circle.selected",
        "ownership_learning_circle.started",
        "ownership_learning_circle.explanation_viewed",
      ]);
    });

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

    expect(learningCircleEvents().map((event) => event.eventName)).toEqual([
      "ownership_learning_circle.selected",
      "ownership_learning_circle.started",
      "ownership_learning_circle.explanation_viewed",
      "ownership_learning_circle.join_clicked",
      "ownership_learning_circle.telegram_opened",
    ]);
  });

  it("returns to the options without opening another journey", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));

    await user.click(
      screen.getByRole("button", {
        name: /^Technology Ownership Learning Circle:/,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Back to options" }));

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
  });

  it("closes the modal without opening Work With Me", async () => {
    const user = userEvent.setup();

    render(<GetQuickWinsModal />);

    await user.click(screen.getByRole("button", { name: "Get Quick Wins" }));

    await user.click(
      screen.getByRole("button", {
        name: /^Technology Ownership Learning Circle:/,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Back to options" }));

    await user.click(
      screen.getByRole("button", { name: "Close Get Quick Wins modal" }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Get Quick Wins" }),
      ).not.toBeInTheDocument();
    });

    expect(
      events.some((event) => event.eventName.startsWith("work_with_me.")),
    ).toBe(false);
  });
});
