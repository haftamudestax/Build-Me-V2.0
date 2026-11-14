import { act } from "react";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAnalyticsConfig } from "@build-me/utils";
import { WorkWithMeModal } from "../../../apps/web/src/components/WorkWithMe/WorkWithMeModal";
import { OPEN_WORK_WITH_ME_EVENT } from "../../../apps/web/src/components/WorkWithMe/openWorkWithMe";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@build-me/utils", () => ({
  getAnalyticsConfig: vi.fn(),
}));

vi.mock("@build-me/ui", async () => {
  const React = await import("react");

  const CardSection = ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children);

  const Card = Object.assign(
    ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    {
      Header: CardSection,
      Body: CardSection,
    },
  );

  function Modal({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) {
    if (!isOpen) return null;

    return React.createElement(
      "div",
      {
        role: "dialog",
        "aria-label": "Work With Me",
      },
      children,
    );
  }

  return { Card, Modal };
});

const VISITOR_ID = "11111111-1111-4111-8111-111111111111";

const BOOKING_REFERENCE = {
  delivery: "DELIVERY-TEST-123",
  mentor: "MENTOR-TEST-123",
  coffee: "COFFEE-TEST-123",
};

type AnalyticsEvent = {
  eventName: string;
  metadata?: Record<string, unknown>;
};

type BookingResponse = {
  data?: {
    id?: string;
    reference?: string;
    bookingType?: string;
    status?: string;
  };
  error?: string;
};

let analyticsEvents: AnalyticsEvent[] = [];
let analyticsHandler: (event: Event) => void;

const mockedGetAnalyticsConfig = vi.mocked(getAnalyticsConfig);

function openWorkWithMe(path: "delivery" | "mentor" | "coffee") {
  act(() => {
    window.dispatchEvent(
      new CustomEvent(OPEN_WORK_WITH_ME_EVENT, {
        detail: { path },
      }),
    );
  });
}

function getAnalyticsEventNames() {
  return analyticsEvents.map((event) => event.eventName);
}

function getAnalyticsEvent(eventName: string) {
  return analyticsEvents.find((event) => event.eventName === eventName);
}

function mockSuccessfulBooking(reference: string, bookingType: string) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    status: 201,
    json: async (): Promise<BookingResponse> => ({
      data: {
        id: reference,
        reference,
        bookingType,
        status: "pending",
      },
    }),
  } as Response);
}

function mockFailedBooking(message: string) {
  vi.mocked(fetch).mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({
      error: message,
    }),
  } as Response);
}

function getSubmittedPayload() {
  const request = vi.mocked(fetch).mock.calls[0];

  if (!request) {
    throw new Error("No booking request was submitted.");
  }

  const [, requestInit] = request;

  if (typeof requestInit?.body !== "string") {
    throw new Error("The booking request did not contain a JSON body.");
  }

  return JSON.parse(requestInit.body);
}

function getSubmittedHeaders() {
  const request = vi.mocked(fetch).mock.calls[0];

  if (!request) {
    throw new Error("No booking request was submitted.");
  }

  const [, requestInit] = request;

  return requestInit?.headers as Record<string, string>;
}

async function choosePackage(
  user: ReturnType<typeof userEvent.setup>,
  packageName: string,
) {
  await user.click(
    screen.getByRole("button", {
      name: new RegExp(packageName, "i"),
    }),
  );
}

async function chooseSelectOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string | RegExp,
  option: RegExp,
) {
  const select = screen.getByRole("combobox", {
    name: label,
  });

  await user.click(select);

  const listbox = await screen.findByRole("listbox");

  // MUI Select options are rendered inside the listbox.
  // Query their visible text rather than relying on a particular option role.
  const optionElement = await within(listbox).findByText(option);

  await user.click(optionElement);
}

function getFutureDateTimeLocal(daysAhead = 2) {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

describe("Work With Me booking integration flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedGetAnalyticsConfig.mockReturnValue({
      visitorId: VISITOR_ID,
    } as NonNullable<ReturnType<typeof getAnalyticsConfig>>);

    vi.stubGlobal("fetch", vi.fn());

    analyticsEvents = [];

    analyticsHandler = (event: Event) => {
      const customEvent = event as CustomEvent<AnalyticsEvent>;

      if (customEvent.detail) {
        analyticsEvents.push(customEvent.detail);
      }
    };

    window.addEventListener("build-me:analytics", analyticsHandler);
  });

  afterEach(() => {
    window.removeEventListener("build-me:analytics", analyticsHandler);
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("Delivery Project", () => {
    async function openDeliveryForm(user: ReturnType<typeof userEvent.setup>) {
      openWorkWithMe("delivery");

      expect(
        screen.getByRole("heading", {
          name: /choose your package/i,
        }),
      ).toBeInTheDocument();

      await choosePackage(user, "Starter MVP");

      expect(
        screen.getByRole("heading", {
          name: "Deliver My Project",
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Selected package: Beginner — \$499 USD/i),
      ).toBeInTheDocument();
    }

    async function fillDeliveryForm(user: ReturnType<typeof userEvent.setup>) {
      await user.type(
        screen.getByRole("textbox", {
          name: /full name/i,
        }),
        "Alex Developer",
      );

      await user.type(
        screen.getByRole("textbox", {
          name: /email address/i,
        }),
        "alex@example.com",
      );

      await user.type(
        screen.getByRole("textbox", {
          name: /project title/i,
        }),
        "Business website",
      );

      await chooseSelectOption(user, "Project type", /website/i);

      await user.type(
        screen.getByRole("textbox", {
          name: /project description/i,
        }),
        "A responsive business website with service pages and contact forms.",
      );

      await chooseSelectOption(user, "Preferred timeline", /within.*month/i);
    }

    it("submits a delivery project request with the selected package", async () => {
      const user = userEvent.setup();

      mockSuccessfulBooking(BOOKING_REFERENCE.delivery, "delivery_project");

      render(<WorkWithMeModal />);

      await openDeliveryForm(user);
      await fillDeliveryForm(user);

      await chooseSelectOption(
        user,
        "Estimated budget (optional)",
        /1,000.*5,000/i,
      );

      await user.click(
        screen.getByRole("button", {
          name: /submit project request/i,
        }),
      );

      await waitFor(
        () => {
          expect(fetch).toHaveBeenCalledTimes(1);
        },
        { timeout: 10000 },
      );

      expect(fetch).toHaveBeenCalledWith(
        "/api/bookings",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      expect(getSubmittedPayload()).toEqual({
        name: "Alex Developer",
        email: "alex@example.com",
        projectTitle: "Business website",
        projectType: "website",
        description:
          "A responsive business website with service pages and contact forms.",
        timeline: "Within a month",
        budget: "1000_5000",
        visitorId: VISITOR_ID,
        bookingType: "delivery_project",
        requestDetails: {
          package: {
            tier: "beginner",
          },
        },
      });

      await waitFor(
        () => {
          expect(
            screen.getByText(BOOKING_REFERENCE.delivery),
          ).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(getAnalyticsEventNames()).toContain("delivery_project.submitted");

      expect(getAnalyticsEvent("delivery_project.submitted")?.metadata).toEqual(
        expect.objectContaining({
          reference: BOOKING_REFERENCE.delivery,
          bookingType: "delivery_project",
          packageTier: "beginner",
        }),
      );
    }, 15000);

    it("shows validation errors and does not submit an incomplete request", async () => {
      const user = userEvent.setup();

      render(<WorkWithMeModal />);

      await openDeliveryForm(user);

      await user.click(
        screen.getByRole("button", {
          name: /submit project request/i,
        }),
      );

      expect(
        await screen.findByText("Enter your full name."),
      ).toBeInTheDocument();

      expect(
        screen.getByText("Enter a valid email address."),
      ).toBeInTheDocument();

      expect(screen.getByText("Enter a project title.")).toBeInTheDocument();

      expect(screen.getByText("Choose a project type.")).toBeInTheDocument();

      expect(fetch).not.toHaveBeenCalled();

      expect(getAnalyticsEventNames()).toContain(
        "delivery_project.validation_failed",
      );
    }, 15000);

    it("does not submit when the visitor session is unavailable", async () => {
      const user = userEvent.setup();

      mockedGetAnalyticsConfig.mockReturnValue(null);

      render(<WorkWithMeModal />);

      await openDeliveryForm(user);
      await fillDeliveryForm(user);

      await user.click(
        screen.getByRole("button", {
          name: /submit project request/i,
        }),
      );

      expect(
        await screen.findByText(/visitor session could not be initialized/i),
      ).toBeInTheDocument();

      expect(fetch).not.toHaveBeenCalled();
    }, 15000);
  });

  describe("Mentor Me", () => {
    async function openMentorForm(user: ReturnType<typeof userEvent.setup>) {
      openWorkWithMe("mentor");

      await choosePackage(user, "Code & Architecture Review");

      expect(
        screen.getByRole("heading", {
          name: "Mentor Me",
        }),
      ).toBeInTheDocument();
    }

    async function fillMentorForm(user: ReturnType<typeof userEvent.setup>) {
      await user.type(
        screen.getByRole("textbox", {
          name: /full name/i,
        }),
        "Alex Developer",
      );

      await user.type(
        screen.getByRole("textbox", {
          name: /email address/i,
        }),
        "alex@example.com",
      );

      await user.type(
        screen.getByRole("textbox", {
          name: /what would you like mentoring on/i,
        }),
        "Frontend and backend architecture",
      );

      await user.type(
        screen.getByRole("textbox", {
          name: /your goals/i,
        }),
        "Improve my software architecture skills.",
      );
    }

    it("submits a mentoring request with the selected package and idempotency key", async () => {
      const user = userEvent.setup();

      mockSuccessfulBooking(BOOKING_REFERENCE.mentor, "mentor_me");

      render(<WorkWithMeModal />);

      await openMentorForm(user);
      await fillMentorForm(user);

      await user.click(
        screen.getByRole("button", {
          name: /submit request/i,
        }),
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      const headers = getSubmittedHeaders();

      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["Idempotency-Key"]).toBeTruthy();

      expect(getSubmittedPayload()).toEqual({
        visitorId: VISITOR_ID,
        bookingType: "mentor_me",
        name: "Alex Developer",
        email: "alex@example.com",
        requestDetails: {
          package: {
            tier: "beginner",
          },
          mentoringTopic: "Frontend and backend architecture",
          goals: "Improve my software architecture skills.",
          experienceLevel: "beginner",
          preferredFormat: "online",
        },
      });

      await waitFor(() => {
        expect(screen.getByText(BOOKING_REFERENCE.mentor)).toBeInTheDocument();
      });

      expect(getAnalyticsEventNames()).toContain("mentor_me.started");

      expect(getAnalyticsEventNames()).toContain("mentor_me.booking_submitted");

      expect(
        getAnalyticsEvent("mentor_me.booking_submitted")?.metadata,
      ).toEqual(
        expect.objectContaining({
          reference: BOOKING_REFERENCE.mentor,
          bookingType: "mentor_me",
          packageTier: "beginner",
        }),
      );
    }, 15000);

    it("shows validation feedback when mentoring details are incomplete", async () => {
      const user = userEvent.setup();

      render(<WorkWithMeModal />);

      await openMentorForm(user);

      await user.click(
        screen.getByRole("button", {
          name: /submit request/i,
        }),
      );

      expect(
        await screen.findByText(
          "Please enter your name using at least 2 characters.",
        ),
      ).toBeInTheDocument();

      expect(fetch).not.toHaveBeenCalled();

      expect(getAnalyticsEventNames()).toContain("mentor_me.validation_failed");
    }, 15000);
  });

  describe("Coffee With Me", () => {
    async function openCoffeeForm(user: ReturnType<typeof userEvent.setup>) {
      openWorkWithMe("coffee");

      await choosePackage(user, "Quick Catch-up");

      expect(
        screen.getByRole("heading", {
          name: "Coffee With Me",
        }),
      ).toBeInTheDocument();
    }

    async function fillCoffeeForm(
      user: ReturnType<typeof userEvent.setup>,
      meetingStartAt: string,
    ) {
      await user.type(
        screen.getByRole("textbox", {
          name: /full name/i,
        }),
        "Alex Developer",
      );

      await user.type(
        screen.getByRole("textbox", {
          name: /email address/i,
        }),
        "alex@example.com",
      );

      await user.type(
        screen.getByLabelText(/preferred meeting date and time/i),
        meetingStartAt,
      );
    }

    it("submits a coffee meeting request with date, duration, timezone, and idempotency key", async () => {
      const user = userEvent.setup();

      mockSuccessfulBooking(BOOKING_REFERENCE.coffee, "coffee_with_me");

      render(<WorkWithMeModal />);

      await openCoffeeForm(user);

      const meetingStartAt = getFutureDateTimeLocal();
      const expectedMeetingStartAt = new Date(meetingStartAt).toISOString();

      await fillCoffeeForm(user, meetingStartAt);

      await user.click(
        screen.getByRole("button", {
          name: /submit request/i,
        }),
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      const headers = getSubmittedHeaders();

      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["Idempotency-Key"]).toBeTruthy();

      expect(getSubmittedPayload()).toEqual({
        visitorId: VISITOR_ID,
        bookingType: "coffee_with_me",
        name: "Alex Developer",
        email: "alex@example.com",
        meetingStartAt: expectedMeetingStartAt,
        meetingDurationMinutes: 30,
        requestDetails: {
          package: {
            tier: "beginner",
          },
          preferredFormat: "online",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      await waitFor(() => {
        expect(screen.getByText(BOOKING_REFERENCE.coffee)).toBeInTheDocument();
      });

      expect(getAnalyticsEventNames()).toContain("coffee_with_me.started");

      expect(getAnalyticsEventNames()).toContain(
        "coffee_with_me.booking_submitted",
      );

      expect(
        getAnalyticsEvent("coffee_with_me.booking_submitted")?.metadata,
      ).toEqual(
        expect.objectContaining({
          reference: BOOKING_REFERENCE.coffee,
          bookingType: "coffee_with_me",
          packageTier: "beginner",
        }),
      );
    }, 15000);

    it("rejects a coffee meeting without a future date and time", async () => {
      const user = userEvent.setup();

      render(<WorkWithMeModal />);

      await openCoffeeForm(user);

      await user.type(
        screen.getByRole("textbox", {
          name: /full name/i,
        }),
        "Alex Developer",
      );

      await user.type(
        screen.getByRole("textbox", {
          name: /email address/i,
        }),
        "alex@example.com",
      );

      await user.click(
        screen.getByRole("button", {
          name: /submit request/i,
        }),
      );

      expect(
        await screen.findByText(
          "Please select your preferred meeting date and time.",
        ),
      ).toBeInTheDocument();

      expect(fetch).not.toHaveBeenCalled();

      expect(getAnalyticsEventNames()).toContain(
        "coffee_with_me.validation_failed",
      );
    }, 15000);
  });

  it("shows a server error without displaying a booking confirmation", async () => {
    const user = userEvent.setup();

    mockFailedBooking("Booking service unavailable.");

    render(<WorkWithMeModal />);

    await openWorkWithMe("mentor");

    await choosePackage(user, "Code & Architecture Review");

    await user.type(
      screen.getByRole("textbox", {
        name: /full name/i,
      }),
      "Alex Developer",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: /email address/i,
      }),
      "alex@example.com",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: /what would you like mentoring on/i,
      }),
      "Frontend and backend architecture",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: /your goals/i,
      }),
      "Improve my software architecture skills.",
    );

    await user.click(
      screen.getByRole("button", {
        name: /submit request/i,
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Booking service unavailable.",
    );

    expect(
      screen.queryByText(BOOKING_REFERENCE.mentor),
    ).not.toBeInTheDocument();

    expect(getAnalyticsEventNames()).toContain("mentor_me.submission_failed");
  }, 15000);
});
