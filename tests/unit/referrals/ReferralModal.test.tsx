import "@testing-library/jest-dom/vitest";

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
    closeOnEscape?: boolean;
    closeOnOverlayClick?: boolean;
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

import { ReferralModal } from "../../../apps/web/src/components/Footer/Referrals/ReferralModal";

const VISITOR_ID = "11111111-1111-4111-8111-111111111111";

const VALID_REFERRAL = {
  referrerName: "Alex Tester",
  referrerEmail: "alex@example.com",
  referredName: "Jordan Friend",
  referredEmail: "jordan@example.com",
  relationship: "friend",
};

type User = ReturnType<typeof userEvent.setup>;

function renderReferralModal(onClose = vi.fn()) {
  const user = userEvent.setup();

  render(<ReferralModal open onClose={onClose} />);

  return { user, onClose };
}

async function completeReferrerStep(user: User) {
  await user.type(
    screen.getByLabelText(/your name/i),
    VALID_REFERRAL.referrerName,
  );

  await user.type(
    screen.getByLabelText(/your email/i),
    VALID_REFERRAL.referrerEmail,
  );

  await user.click(screen.getByRole("button", { name: "Continue" }));
}

beforeEach(() => {
  getAnalyticsConfigMock.mockReturnValue({
    baseUrl: "http://localhost:4000",
    visitorId: VISITOR_ID,
    sessionId: "test-session-id",
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ReferralModal — unit tests", () => {
  it("renders the first step", () => {
    renderReferralModal();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Refer Someone",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Your information",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/step/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
  });

  it("does not continue when the referrer information is invalid", async () => {
    const { user } = renderReferralModal();

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", {
        name: "Refer Someone",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Your information",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
  });

  it("validates the referrer's email address", async () => {
    const { user } = renderReferralModal();

    await user.type(screen.getByLabelText(/your name/i), "Alex Tester");

    await user.type(screen.getByLabelText(/your email/i), "invalid-email");

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", {
        name: "Refer Someone",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Your information",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
  });

  it("moves to the friend information step after valid referrer details", async () => {
    const { user } = renderReferralModal();

    await completeReferrerStep(user);

    expect(
      screen.getByRole("heading", {
        name: "Who are you referring?",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/step/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/their name/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/their email/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/your relationship/i)).toBeInTheDocument();
  });

  it("validates the referred person's information", async () => {
    const { user } = renderReferralModal();

    await completeReferrerStep(user);

    await user.click(screen.getByRole("button", { name: "Review referral" }));

    expect(
      screen.getByRole("heading", {
        name: "Who are you referring?",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/their name/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/their email/i)).toBeInTheDocument();
  });

  it("does not allow a visitor to refer themselves", async () => {
    const { user } = renderReferralModal();

    await completeReferrerStep(user);

    await user.type(
      screen.getByLabelText(/their name/i),
      VALID_REFERRAL.referrerName,
    );

    await user.type(
      screen.getByLabelText(/their email/i),
      VALID_REFERRAL.referrerEmail,
    );

    await user.selectOptions(
      screen.getByLabelText(/your relationship/i),
      VALID_REFERRAL.relationship,
    );

    await user.click(screen.getByRole("button", { name: "Review referral" }));

    expect(screen.getByText("You cannot refer yourself.")).toBeInTheDocument();
  });

  it("requires a relationship selection", async () => {
    const { user } = renderReferralModal();

    await completeReferrerStep(user);

    await user.type(
      screen.getByLabelText(/their name/i),
      VALID_REFERRAL.referredName,
    );

    await user.type(
      screen.getByLabelText(/their email/i),
      VALID_REFERRAL.referredEmail,
    );

    await user.click(screen.getByRole("button", { name: "Review referral" }));

    expect(
      screen.getByText("Please select your relationship."),
    ).toBeInTheDocument();
  });
});
