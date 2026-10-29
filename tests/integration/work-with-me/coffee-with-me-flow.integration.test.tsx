import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WorkWithMeModal } from "../../../apps/web/src/components/WorkWithMe/WorkWithMeModal";

const { getAnalyticsConfig } = vi.hoisted(() => ({
  getAnalyticsConfig: vi.fn(),
}));

vi.mock("@build-me/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@build-me/utils")>();

  return {
    ...actual,
    getAnalyticsConfig,
  };
});

const mockVisitorId = "123e4567-e89b-42d3-a456-426614174000";

const mockBookingResponse = {
  data: {
    id: "coffee-booking-123",
    reference: "coffee-booking-123",
    bookingType: "coffee_with_me",
    status: "pending",
    createdAt: "2026-10-29T12:00:00.000Z",
  },
};

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function renderWorkWithMeModal() {
  const user = userEvent.setup();

  render(<WorkWithMeModal />);

  return { user };
}

async function openCoffeeWithMe(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: /work with me/i }),
  );

  const dialog = await screen.findByRole("dialog");

  await user.click(
    within(dialog).getByRole("button", { name: /coffee with me/i }),
  );

  return dialog;
}

async function fillCoffeeWithMeForm(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
) {
  await user.type(
    within(dialog).getByRole("textbox", { name: /full name/i }),
    "Integration Test User",
  );

  await user.type(
    within(dialog).getByRole("textbox", { name: /email address/i }),
    "coffee.integration@example.com",
  );

  const meetingDateTime = within(dialog).getByLabelText(
    /preferred meeting date and time/i,
  );

  // Choose a future local date and time.
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  futureDate.setSeconds(0, 0);
  futureDate.setMilliseconds(0);

  const localDateTime =
    [
      futureDate.getFullYear(),
      String(futureDate.getMonth() + 1).padStart(2, "0"),
      String(futureDate.getDate()).padStart(2, "0"),
    ].join("-") +
    "T" +
    String(futureDate.getHours()).padStart(2, "0") +
    ":" +
    String(futureDate.getMinutes()).padStart(2, "0");

  await user.clear(meetingDateTime);
  await user.type(meetingDateTime, localDateTime);

  await user.click(
    within(dialog).getByRole("combobox", {
      name: /preferred meeting format/i,
    }),
  );

  await user.click(await screen.findByRole("option", { name: /^online$/i }));
}

describe("Work With Me — Coffee With Me flow integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAnalyticsConfig.mockReturnValue({
      baseUrl: "",
      visitorId: mockVisitorId,
      sessionId: "integration-test-session",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(createJsonResponse(mockBookingResponse, 201)),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens the Work With Me modal and displays the project paths", async () => {
    const { user } = renderWorkWithMeModal();

    await user.click(screen.getByRole("button", { name: /work with me/i }));

    const dialog = await screen.findByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /coffee with me/i }),
    ).toBeInTheDocument();
  });

  it("opens the Coffee With Me form when that path is selected", async () => {
    const { user } = renderWorkWithMeModal();

    const dialog = await openCoffeeWithMe(user);

    expect(
      within(dialog).getByRole("heading", { name: /coffee with me/i }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("textbox", { name: /full name/i }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("textbox", { name: /email address/i }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByLabelText(/preferred meeting date and time/i),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("combobox", {
        name: /preferred meeting format/i,
      }),
    ).toBeInTheDocument();
  });

  it("returns to project paths when All project paths is clicked", async () => {
    const { user } = renderWorkWithMeModal();

    const dialog = await openCoffeeWithMe(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: /all project paths/i,
      }),
    );

    expect(
      await within(dialog).findByRole("button", {
        name: /coffee with me/i,
      }),
    ).toBeInTheDocument();
  });

  it("closes the modal when the close button is clicked", async () => {
    const { user } = renderWorkWithMeModal();

    await user.click(screen.getByRole("button", { name: /work with me/i }));

    const dialog = await screen.findByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", {
        name: /close work with me modal/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("submits a Coffee With Me booking and displays confirmation", async () => {
    const { user } = renderWorkWithMeModal();

    const dialog = await openCoffeeWithMe(user);

    await fillCoffeeWithMeForm(user, dialog);

    // Verify the visitor session mock is configured before submission.
    expect(getAnalyticsConfig()).toEqual({
      baseUrl: "",
      visitorId: mockVisitorId,
      sessionId: "integration-test-session",
    });

    await user.click(
      within(dialog).getByRole("button", { name: /submit request/i }),
    );

    const fetchMock = vi.mocked(fetch);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/bookings",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "Idempotency-Key": expect.any(String),
          }),
        }),
      );
    });

    const request = fetchMock.mock.calls[0]?.[1];

    expect(request).toBeDefined();

    const payload = JSON.parse(String(request?.body));

    expect(payload).toEqual(
      expect.objectContaining({
        visitorId: mockVisitorId,
        name: "Integration Test User",
        email: "coffee.integration@example.com",
        bookingType: "coffee_with_me",
        meetingDurationMinutes: 30,
        meetingStartAt: expect.any(String),
        requestDetails: expect.objectContaining({
          preferredFormat: "online",
          timezone: expect.any(String),
        }),
      }),
    );

    expect(Number.isNaN(Date.parse(payload.meetingStartAt))).toBe(false);

    expect(
      await within(dialog).findByText(/coffee-booking-123/i),
    ).toBeInTheDocument();
  });

  it("displays an error when the booking request fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      createJsonResponse({ error: "Booking service unavailable." }, 500),
    );

    const { user } = renderWorkWithMeModal();

    const dialog = await openCoffeeWithMe(user);

    await fillCoffeeWithMeForm(user, dialog);

    expect(getAnalyticsConfig()?.visitorId).toBe(mockVisitorId);

    await user.click(
      within(dialog).getByRole("button", { name: /submit request/i }),
    );

    const fetchMock = vi.mocked(fetch);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/bookings",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /booking service unavailable/i,
    );
  });
});
