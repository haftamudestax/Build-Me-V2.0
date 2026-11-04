import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const { protectedApiGet } = vi.hoisted(() => ({
  protectedApiGet: vi.fn(),
}));

vi.mock("../../../apps/dashboard/src/lib/protectedApi", () => ({
  protectedApiGet,
}));

import { MentorMeAnalyticsPage } from "../../../apps/dashboard/src/pages/analytics/MentorMeAnalyticsPage";

const mockEvents = [
  {
    id: "mentor-event-1",
    timestamp: "2026-10-20T10:00:00.000Z",
    event_name: "mentor_me.booking_submitted",
    event_type: "feature_use",
    visitor_id: "mentor-visitor-123",
    session_id: "mentor-session-456",
    source_route: "/work-with-me",
  },
  {
    id: "mentor-event-2",
    timestamp: "2026-10-20T09:55:00.000Z",
    event_name: "mentor_me.started",
    event_type: "feature_use",
    visitor_id: "mentor-visitor-123",
    session_id: "mentor-session-456",
    source_route: "/work-with-me",
  },
];

function mockSuccessfulAnalytics(events: unknown = mockEvents) {
  protectedApiGet.mockImplementation(async (path: string) => {
    if (path === "/api/admin/analytics/mentor-me/summary") {
      return {
        total_events: 2,
        total_visitors: 1,
      };
    }

    if (path === "/api/admin/analytics/mentor-me/events") {
      return events;
    }

    throw new Error(`Unexpected analytics endpoint: ${path}`);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSuccessfulAnalytics();
});

afterEach(() => {
  cleanup();
});

describe("MentorMeAnalyticsPage", () => {
  it("renders the Mentor Me analytics heading and description", async () => {
    render(<MentorMeAnalyticsPage />);

    expect(
      screen.getByRole("heading", { name: "Mentor Me Analytics" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Monitor mentoring requests, form engagement, validation, and submission outcomes.",
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: "Summary" }),
    ).toBeInTheDocument();
  });

  it("requests the summary and event endpoints", async () => {
    render(<MentorMeAnalyticsPage />);

    // Event names are rendered with a "Mentor Me ›" prefix.
    await screen.findByText(/Booking Submitted/);

    await waitFor(() => {
      expect(protectedApiGet).toHaveBeenCalledWith(
        "/api/admin/analytics/mentor-me/summary",
        expect.objectContaining({
          query: { days: 30 },
          signal: expect.anything(),
        }),
      );

      expect(protectedApiGet).toHaveBeenCalledWith(
        "/api/admin/analytics/mentor-me/events",
        expect.objectContaining({
          query: { limit: 50, offset: 0 },
          signal: expect.anything(),
        }),
      );
    });
  });

  it("displays the booking submitted event", async () => {
    render(<MentorMeAnalyticsPage />);

    expect(await screen.findByText(/Booking Submitted/)).toBeInTheDocument();
  });

  it("displays the started event", async () => {
    render(<MentorMeAnalyticsPage />);

    expect(await screen.findByText(/Started/)).toBeInTheDocument();
  });

  it("displays visitor IDs in both event rows", async () => {
    render(<MentorMeAnalyticsPage />);

    const visitorIds = await screen.findAllByText("mentor-visitor-123");

    expect(visitorIds).toHaveLength(2);
  });

  it("displays session IDs in both event rows", async () => {
    render(<MentorMeAnalyticsPage />);

    const sessionIds = await screen.findAllByText("mentor-session-456");

    expect(sessionIds).toHaveLength(2);
  });

  it("displays the source route in both event rows", async () => {
    render(<MentorMeAnalyticsPage />);

    const routes = await screen.findAllByText("/work-with-me");

    expect(routes).toHaveLength(2);
  });

  it("displays the event type in both event rows", async () => {
    render(<MentorMeAnalyticsPage />);

    const eventTypes = await screen.findAllByText("Feature Use");

    expect(eventTypes).toHaveLength(2);
  });

  it("shows the empty state when no events are returned", async () => {
    mockSuccessfulAnalytics([]);

    render(<MentorMeAnalyticsPage />);

    expect(
      await screen.findByText("No records found for the selected filters."),
    ).toBeInTheDocument();
  });
});
