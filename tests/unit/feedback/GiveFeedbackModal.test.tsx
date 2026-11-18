import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GiveFeedbackModal } from "../../../apps/web/src/components/Feedback/GiveFeedbackModal";

const { getAnalyticsConfigMock } = vi.hoisted(() => ({
  getAnalyticsConfigMock: vi.fn(),
}));

vi.mock("@build-me/utils", () => ({
  getAnalyticsConfig: getAnalyticsConfigMock,
}));

vi.mock("@build-me/ui", async () => {
  const React = await import("react");

  return {
    Modal: ({
      isOpen,
      children,
      labelledBy,
    }: {
      isOpen: boolean;
      children: ReactNode;
      labelledBy?: string;
    }) =>
      isOpen
        ? React.createElement(
            "div",
            {
              role: "dialog",
              "aria-modal": "true",
              "aria-labelledby": labelledBy,
            },
            children,
          )
        : null,
  };
});

const feedbackOptions = [
  "Rate your experience",
  "Recommend Me",
  "Report an issue",
  "Share a suggestion",
  "Make a complaint",
];

function renderFeedbackModal(open = true, onClose = vi.fn()) {
  const result = render(<GiveFeedbackModal open={open} onClose={onClose} />);

  return {
    ...result,
    onClose,
  };
}

describe("GiveFeedbackModal — unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAnalyticsConfigMock.mockReturnValue({
      baseUrl: "http://localhost:4000",
      visitorId: "test-visitor-id",
      sessionId: "test-session-id",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the first step with all feedback types", () => {
    renderFeedbackModal();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Give Feedback" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "What would you like to share?",
      }),
    ).toBeInTheDocument();

    for (const option of feedbackOptions) {
      expect(screen.getByRole("button", { name: option })).toBeInTheDocument();
    }

    expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();
  });

  it("renders every feedback option with a forward arrow", () => {
    renderFeedbackModal();

    for (const optionLabel of feedbackOptions) {
      const option = screen.getByRole("button", {
        name: optionLabel,
      });

      expect(option).toBeInTheDocument();

      const arrow = option.querySelector("svg.lucide-arrow-right");

      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("moves directly to the details step when a feedback type is selected", async () => {
    const user = userEvent.setup();

    renderFeedbackModal();

    await user.click(
      screen.getByRole("button", {
        name: "Share a suggestion",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Share a suggestion",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/Step 2 of 2/i)).toBeInTheDocument();

    const suggestionField = document.getElementById("feedback-comments");

    expect(suggestionField).toBeInTheDocument();
    expect(suggestionField?.tagName).toBe("TEXTAREA");

    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Submit feedback/i,
      }),
    ).toBeDisabled();
  });

  it("returns to the feedback type step when Back is selected", async () => {
    const user = userEvent.setup();

    renderFeedbackModal();

    await user.click(
      screen.getByRole("button", {
        name: "Share a suggestion",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Share a suggestion",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(
      screen.getByRole("heading", {
        name: "What would you like to share?",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Share a suggestion",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
  });

  it("calls onClose and resets the form when the modal is closed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = renderFeedbackModal(true, onClose);

    await user.click(
      screen.getByRole("button", {
        name: "Share a suggestion",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Share a suggestion",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Close feedback modal",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    // Reopen the component to verify its internal state was reset.
    rerender(<GiveFeedbackModal open onClose={onClose} />);

    expect(
      screen.getByRole("heading", {
        name: "What would you like to share?",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Share a suggestion",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not render the dialog when open is false", () => {
    renderFeedbackModal(false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
