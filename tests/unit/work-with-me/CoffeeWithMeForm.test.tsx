import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { getAnalyticsConfigMock } = vi.hoisted(() => ({
  getAnalyticsConfigMock: vi.fn(),
}));

vi.mock("@build-me/utils", () => ({
  getAnalyticsConfig: getAnalyticsConfigMock,
}));

import { CoffeeWithMeForm } from "../../../apps/web/src/components/WorkWithMe/CoffeeWithMeForm";

const VALID_VISITOR_ID = "11111111-1111-4111-8111-111111111111";
const VALID_SESSION_ID = "22222222-2222-4222-8222-222222222222";

type CoffeeAnalyticsDetail = {
  eventName?: string;
  metadata?: {
    reason?: string;
    [key: string]: unknown;
  };
};

function renderCoffeeWithMeForm(
  props: {
    onBack?: () => void;
    onSubmitted?: (reference: string) => void;
  } = {},
) {
  return render(
    <CoffeeWithMeForm
      onBack={props.onBack ?? vi.fn()}
      onSubmitted={props.onSubmitted ?? vi.fn()}
    />,
  );
}

function getAnalyticsEvents(
  dispatchSpy: ReturnType<typeof vi.spyOn>,
): CoffeeAnalyticsDetail[] {
  return dispatchSpy.mock.calls
    .map(([event]: [Event, ...unknown[]]) => event)
    .filter(
      (event: Event): event is CustomEvent<CoffeeAnalyticsDetail> =>
        event instanceof CustomEvent && event.type === "build-me:analytics",
    )
    .map((event: CustomEvent<CoffeeAnalyticsDetail>) => event.detail);
}

function getMeetingDateInput(): HTMLInputElement {
  return screen.getByLabelText(
    /preferred meeting date and time/i,
  ) as HTMLInputElement;
}

function getLocalDateTime(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function getFutureMeetingDate(): string {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  futureDate.setSeconds(0, 0);
  return getLocalDateTime(futureDate);
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: /full name/i }),
    "Test Coffee User",
  );

  await user.type(
    screen.getByRole("textbox", { name: /email address/i }),
    "coffee-test@example.com",
  );

  fireEvent.change(getMeetingDateInput(), {
    target: { value: getFutureMeetingDate() },
  });
}

async function submitForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /submit request/i }));
}

beforeEach(() => {
  vi.clearAllMocks();

  getAnalyticsConfigMock.mockReturnValue({
    baseUrl: "/api",
    visitorId: VALID_VISITOR_ID,
    sessionId: VALID_SESSION_ID,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CoffeeWithMeForm", () => {
  it("renders the heading, required fields, format, and Back button", () => {
    renderCoffeeWithMeForm();

    expect(
      screen.getByRole("heading", { name: "Coffee With Me" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("textbox", { name: /full name/i })).toBeRequired();

    expect(
      screen.getByRole("textbox", { name: /email address/i }),
    ).toBeRequired();

    expect(getMeetingDateInput()).toBeRequired();

    expect(
      screen.getByRole("combobox", {
        name: /preferred meeting format/i,
      }),
    ).toBeRequired();

    expect(
      screen.getByRole("button", { name: /submit request/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("defaults the meeting format to Online", () => {
    renderCoffeeWithMeForm();

    expect(
      screen.getByRole("combobox", {
        name: /preferred meeting format/i,
      }),
    ).toHaveTextContent("Online");
  });

  it("calls onBack when Back is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    renderCoffeeWithMeForm({ onBack });

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows a validation error when the name is too short", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderCoffeeWithMeForm();

    await user.type(screen.getByRole("textbox", { name: /full name/i }), "A");

    await submitForm(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /at least 2 characters/i,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderCoffeeWithMeForm();

    await user.type(
      screen.getByRole("textbox", { name: /full name/i }),
      "Test User",
    );

    await user.type(
      screen.getByRole("textbox", { name: /email address/i }),
      "invalid-email",
    );

    await submitForm(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /valid email address/i,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a meeting date and time", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderCoffeeWithMeForm();

    await user.type(
      screen.getByRole("textbox", { name: /full name/i }),
      "Test User",
    );

    await user.type(
      screen.getByRole("textbox", { name: /email address/i }),
      "test@example.com",
    );

    await submitForm(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /select your preferred meeting date and time/i,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a meeting time in the past", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderCoffeeWithMeForm();

    await user.type(
      screen.getByRole("textbox", { name: /full name/i }),
      "Test User",
    );

    await user.type(
      screen.getByRole("textbox", { name: /email address/i }),
      "test@example.com",
    );

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    pastDate.setSeconds(0, 0);

    fireEvent.change(getMeetingDateInput(), {
      target: { value: getLocalDateTime(pastDate) },
    });

    await submitForm(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /meeting time in the future/i,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("dispatches a validation-failed analytics event for client validation", async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    renderCoffeeWithMeForm();

    await submitForm(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /at least 2 characters/i,
    );

    expect(
      getAnalyticsEvents(dispatchSpy).some(
        (event) =>
          event.eventName === "coffee_with_me.validation_failed" &&
          event.metadata?.reason === "client_validation",
      ),
    ).toBe(true);
  });

  it("does not submit when visitor analytics configuration is unavailable", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    vi.stubGlobal("fetch", fetchMock);

    getAnalyticsConfigMock.mockReturnValue({
      baseUrl: "/api",
      visitorId: null,
      sessionId: VALID_SESSION_ID,
    });

    renderCoffeeWithMeForm();

    await fillValidForm(user);
    await submitForm(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /visitor session is not ready/i,
    );

    expect(fetchMock).not.toHaveBeenCalled();

    expect(
      getAnalyticsEvents(dispatchSpy).some(
        (event) =>
          event.eventName === "coffee_with_me.validation_failed" &&
          event.metadata?.reason === "visitor_session_unavailable",
      ),
    ).toBe(true);
  });
});
