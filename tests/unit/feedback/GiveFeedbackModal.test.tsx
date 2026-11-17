import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { getAnalyticsConfigMock } = vi.hoisted(() => ({
  getAnalyticsConfigMock: vi.fn(),
}));

vi.mock("@build-me/utils", () => ({
  getAnalyticsConfig: getAnalyticsConfigMock,
}));

vi.mock("@build-me/ui", () => ({
  Modal: ({
    isOpen,
    children,
    labelledBy,
    describedBy,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    labelledBy?: string;
    describedBy?: string;
  }) =>
    isOpen ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {children}
      </div>
    ) : null,
}));

import { GiveFeedbackModal } from "../../../apps/web/src/components/Feedback/GiveFeedbackModal";

const VISITOR_ID = "11111111-1111-4111-8111-111111111111";

function configureValidVisitorSession() {
  getAnalyticsConfigMock.mockReturnValue({
    baseUrl: "http://localhost:4000",
    visitorId: VISITOR_ID,
    sessionId: "test-session-id",
  });
}

beforeEach(() => {
  getAnalyticsConfigMock.mockReset();
  configureValidVisitorSession();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GiveFeedbackModal — unit tests", () => {
  it("renders the first step with all feedback types", () => {
    render(<GiveFeedbackModal open={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Give Feedback" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Share a suggestion/i }),
    ).toBeInTheDocument();
  });

  it("disables continue button until a feedback type is selected", async () => {
    render(<GiveFeedbackModal open={true} onClose={vi.fn()} />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();
  });

  it("returns to the previous step when Back is selected", async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackModal open={true} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: /Share a suggestion/i }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Share a suggestion" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(
      screen.getByRole("heading", { name: "What would you like to share?" }),
    ).toBeInTheDocument();
  });

  it("calls onClose and resets the form when the modal is closed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GiveFeedbackModal open={true} onClose={onClose} />);

    await user.click(
      screen.getByRole("button", { name: /Share a suggestion/i }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(
      screen.getByRole("button", { name: "Close feedback modal" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "What would you like to share?" }),
    ).toBeInTheDocument();
  });

  it("does not render the dialog when open is false", () => {
    render(<GiveFeedbackModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
