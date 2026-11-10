import "@testing-library/jest-dom/vitest";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReferralButton } from "../../../apps/web/src/components/Footer/Referrals/ReferralButton";

const { getAnalyticsConfigMock } = vi.hoisted(() => ({
  getAnalyticsConfigMock: vi.fn(),
}));

vi.mock("@build-me/utils", () => ({
  getAnalyticsConfig: getAnalyticsConfigMock,
}));

const VISITOR_ID = "123e4567-e89b-42d3-a456-426614174000";
const REFERRAL_ID = "223e4567-e89b-42d3-a456-426614174001";

const mockFetch = vi.fn();

function createSuccessResponse() {
  return {
    ok: true,
    status: 201,
    json: async () => ({
      data: {
        id: REFERRAL_ID,
        reference: REFERRAL_ID,
        status: "pending",
        createdAt: "2026-11-10T12:00:00.000Z",
      },
    }),
  };
}

function createErrorResponse(
  error = "This idempotency key was already used for a different referral request.",
) {
  return {
    ok: false,
    status: 409,
    json: async () => ({
      error,
    }),
  };
}

async function openReferralModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", {
      name: /give referrals\. help others grow with us\./i,
    }),
  );

  expect(
    await screen.findByRole("heading", {
      name: "Refer Someone",
    }),
  ).toBeInTheDocument();
}

async function completeReferrerStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: /your name/i }),
    "John Doe",
  );

  await user.type(
    screen.getByRole("textbox", { name: /your email/i }),
    "john@example.com",
  );

  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function completeFriendStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: /their name/i }),
    "Jane Smith",
  );

  await user.type(
    screen.getByRole("textbox", { name: /their email/i }),
    "jane@example.com",
  );

  await user.selectOptions(
    screen.getByRole("combobox", { name: /your relationship/i }),
    "colleague",
  );

  await user.type(
    screen.getByRole("textbox", { name: /personal message/i }),
    "I think you would enjoy working together.",
  );

  await user.click(screen.getByRole("button", { name: /review referral/i }));
}

async function completeReferralForm(user: ReturnType<typeof userEvent.setup>) {
  await completeReferrerStep(user);
  await completeFriendStep(user);
}

describe("ReferralModal integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAnalyticsConfigMock.mockReturnValue({
      visitorId: VISITOR_ID,
    });

    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens the referral modal from the referral button", async () => {
    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferralModal(user);

    expect(screen.getByText("Share the opportunity")).toBeInTheDocument();

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", { name: /your name/i }),
    ).toBeInTheDocument();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates the referrer information before continuing", async () => {
    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferralModal(user);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter your full name.",
    );

    expect(
      screen.getByRole("heading", { name: "Your information" }),
    ).toBeInTheDocument();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates the referred person's information before review", async () => {
    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferralModal(user);
    await completeReferrerStep(user);

    await user.click(screen.getByRole("button", { name: /review referral/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter the person's name.",
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("prevents a user from referring themselves", async () => {
    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferralModal(user);

    await user.type(
      screen.getByRole("textbox", { name: /your name/i }),
      "John Doe",
    );

    await user.type(
      screen.getByRole("textbox", { name: /your email/i }),
      "john@example.com",
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await user.type(
      screen.getByRole("textbox", { name: /their name/i }),
      "John Doe",
    );

    await user.type(
      screen.getByRole("textbox", { name: /their email/i }),
      "JOHN@example.com",
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /your relationship/i }),
      "friend",
    );

    await user.click(screen.getByRole("button", { name: /review referral/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You cannot refer yourself.",
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("submits a referral and displays the confirmation reference", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce(createSuccessResponse());

    render(<ReferralButton />);

    await openReferralModal(user);
    await completeReferralForm(user);

    expect(
      screen.getByRole("heading", { name: /review your referral/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /submit referral/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/referrals",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
        body: expect.any(String),
      }),
    );

    const requestOptions = mockFetch.mock.calls[0][1];
    const requestBody = JSON.parse(requestOptions.body);

    expect(requestBody).toEqual({
      visitorId: VISITOR_ID,
      referrerName: "John Doe",
      referrerEmail: "john@example.com",
      referredName: "Jane Smith",
      referredEmail: "jane@example.com",
      relationship: "colleague",
      message: "I think you would enjoy working together.",
    });

    expect(requestOptions.headers["Idempotency-Key"]).toBeTruthy();

    expect(
      await screen.findByRole("heading", {
        name: "Referral submitted!",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(REFERRAL_ID)).toBeInTheDocument();
  });

  it("submits an empty optional message without including it in the request body", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce(createSuccessResponse());

    render(<ReferralButton />);

    await openReferralModal(user);
    await completeReferrerStep(user);

    await user.type(
      screen.getByRole("textbox", { name: /their name/i }),
      "Jane Smith",
    );

    await user.type(
      screen.getByRole("textbox", { name: /their email/i }),
      "jane@example.com",
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /your relationship/i }),
      "friend",
    );

    await user.click(screen.getByRole("button", { name: /review referral/i }));

    await user.click(screen.getByRole("button", { name: /submit referral/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

    expect(requestBody).not.toHaveProperty("message");

    expect(
      await screen.findByRole("heading", {
        name: "Referral submitted!",
      }),
    ).toBeInTheDocument();
  });

  it("displays the backend error when the referral request is rejected", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce(
      createErrorResponse(
        "This idempotency key was already used for a different referral request.",
      ),
    );

    render(<ReferralButton />);

    await openReferralModal(user);
    await completeReferralForm(user);

    await user.click(screen.getByRole("button", { name: /submit referral/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This idempotency key was already used for a different referral request.",
    );

    expect(
      screen.getByRole("heading", { name: /review your referral/i }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", { name: "Referral submitted!" }),
    ).not.toBeInTheDocument();
  });

  it("displays an error when visitor analytics configuration is missing", async () => {
    const user = userEvent.setup();

    getAnalyticsConfigMock.mockReturnValueOnce(undefined);

    render(<ReferralButton />);

    await openReferralModal(user);
    await completeReferralForm(user);

    await user.click(screen.getByRole("button", { name: /submit referral/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't verify your visitor session. Please refresh the page and try again.",
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("allows the user to navigate back to the previous step", async () => {
    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferralModal(user);
    await completeReferrerStep(user);

    expect(
      screen.getByRole("heading", { name: /who are you referring/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^back$/i }));

    expect(
      screen.getByRole("heading", { name: /your information/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("textbox", { name: /your name/i })).toHaveValue(
      "John Doe",
    );
  });

  it("closes and resets the referral modal when reopened", async () => {
    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferralModal(user);

    await user.type(
      screen.getByRole("textbox", { name: /your name/i }),
      "John Doe",
    );

    await user.click(
      screen.getByRole("button", { name: /close referral modal/i }),
    );

    await openReferralModal(user);

    expect(screen.getByRole("textbox", { name: /your name/i })).toHaveValue("");

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });
});
