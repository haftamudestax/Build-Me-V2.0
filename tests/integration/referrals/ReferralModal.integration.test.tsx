import "@testing-library/jest-dom/vitest";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, screen } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

const { getAnalyticsConfigMock } = vi.hoisted(() => ({
  getAnalyticsConfigMock: vi.fn(),
}));

vi.mock("@build-me/utils", () => ({
  getAnalyticsConfig: getAnalyticsConfigMock,
}));

import { ReferralButton } from "../../../apps/web/src/components/Footer/Referrals/ReferralButton";

const VISITOR_ID = "11111111-1111-4111-8111-111111111111";
const REFERRAL_ID = "22222222-2222-4222-8222-222222222222";

const REFERRAL_DATA = {
  referrerName: "Alex Tester",
  referrerEmail: "alex@example.com",
  referredName: "Jordan Friend",
  referredEmail: "jordan@example.com",
  relationship: "colleague",
};

type User = ReturnType<typeof userEvent.setup>;

let fetchMock: ReturnType<typeof vi.fn>;

async function openReferral(user: User) {
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

async function completeReferral(user: User) {
  await user.type(
    screen.getByLabelText(/^Your name/),
    REFERRAL_DATA.referrerName,
  );

  await user.type(
    screen.getByLabelText(/^Your email/),
    REFERRAL_DATA.referrerEmail,
  );

  await user.click(
    screen.getByRole("button", {
      name: "Continue",
    }),
  );

  await user.type(
    screen.getByLabelText(/^Their name/),
    REFERRAL_DATA.referredName,
  );

  await user.type(
    screen.getByLabelText(/^Their email/),
    REFERRAL_DATA.referredEmail,
  );

  await user.selectOptions(
    screen.getByLabelText(/^Your relationship/),
    REFERRAL_DATA.relationship,
  );

  await user.click(
    screen.getByRole("button", {
      name: "Review referral",
    }),
  );

  expect(
    screen.getByRole("heading", {
      name: "Review your referral",
    }),
  ).toBeInTheDocument();
}

beforeEach(() => {
  getAnalyticsConfigMock.mockReturnValue({
    baseUrl: "http://localhost:4000",
    visitorId: VISITOR_ID,
    sessionId: "33333333-3333-4333-8333-333333333333",
  });

  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ReferralModal — integration tests", () => {
  it("opens from the ReferralButton", async () => {
    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferral(user);

    expect(screen.getByLabelText(/^Your name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Your email/)).toBeInTheDocument();
  });

  it("completes all three steps and submits the referral", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        reference: REFERRAL_ID,
      }),
    } as Response);

    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferral(user);
    await completeReferral(user);

    await user.click(
      screen.getByRole("button", {
        name: "Submit referral",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Referral submitted!",
      }),
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/referrals");
    expect(options.method).toBe("POST");

    expect(options.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        "Idempotency-Key": expect.any(String),
      }),
    );

    expect(options.headers["Idempotency-Key"].length).toBeGreaterThan(0);

    const requestBody = JSON.parse(options.body);

    expect(requestBody).toEqual(
      expect.objectContaining({
        visitorId: VISITOR_ID,
        ...REFERRAL_DATA,
        message: null,
      }),
    );

    expect(requestBody).not.toHaveProperty("idempotencyKey");
  });

  it("does not complete submission when the API rejects the referral", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        message: "IDEMPOTENCY_KEY_REUSED",
      }),
    } as Response);

    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferral(user);
    await completeReferral(user);

    await user.click(
      screen.getByRole("button", {
        name: "Submit referral",
      }),
    );

    expect(
      await screen.findByText("IDEMPOTENCY_KEY_REUSED"),
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("heading", {
        name: "Review your referral",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Referral submitted!",
      }),
    ).not.toBeInTheDocument();
  });

  it("resets the form when the modal is closed and reopened", async () => {
    const user = userEvent.setup();

    render(<ReferralButton />);

    await openReferral(user);

    await user.type(
      screen.getByLabelText(/^Your name/),
      REFERRAL_DATA.referrerName,
    );

    await user.type(
      screen.getByLabelText(/^Your email/),
      REFERRAL_DATA.referrerEmail,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Close referral modal",
      }),
    );

    expect(
      screen.queryByRole("heading", {
        name: "Refer Someone",
      }),
    ).not.toBeInTheDocument();

    await openReferral(user);

    expect(screen.getByLabelText(/^Your name/)).toHaveValue("");
    expect(screen.getByLabelText(/^Your email/)).toHaveValue("");
  });
});
