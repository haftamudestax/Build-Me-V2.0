import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AnalyticsPage } from "../../../apps/dashboard/src/pages/analytics/AnalyticsPage";

const { protectedApiGet } = vi.hoisted(() => ({
  protectedApiGet: vi.fn(),
}));

vi.mock("../../../apps/dashboard/src/lib/protectedApi", () => ({
  protectedApiGet,
}));

const summary = {
  feature: "delivery_project",
  journey: "delivery_project",
  period: {
    days: 30,
    start: "2026-09-24T05:46:01.486985+00:00",
    end: "2026-10-24T05:46:01.486985+00:00",
  },
  totals: {
    total_events: 12,
    starts: 4,
    successful_submissions: 2,
  },
  kpis: {
    cta_to_start_rate: 0.5,
    submission_to_confirmation_rate: 1,
  },
};

const events = [
  {
    id: "event-1",
    event_name: "delivery_project.booking_submitted",
    event_type: "feature_use",
    visitor_id: "visitor-123",
    session_id: "session-456",
    timestamp: "2026-10-20T10:30:00Z",
    feature: "delivery_project",
    metadata: {
      source_route: "/",
      destination_route: "/confirmation",
    },
  },
];

const SUMMARY_PATH = "/api/admin/analytics/delivery-project/summary";

const EVENTS_PATH = "/api/admin/analytics/delivery-project/events";

function renderPage(
  overrides: Partial<React.ComponentProps<typeof AnalyticsPage>> = {},
) {
  return render(
    <AnalyticsPage
      title="Delivery Project Analytics"
      description="Monitor project activity."
      summaryPath={SUMMARY_PATH}
      eventsPath={EVENTS_PATH}
      supportsDays
      supportsEventFilter
      {...overrides}
    />,
  );
}

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    protectedApiGet.mockImplementation((path: string) => {
      if (path.includes("/summary")) {
        return Promise.resolve(summary);
      }

      return Promise.resolve(events);
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading state before the analytics responses resolve", () => {
    protectedApiGet.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Loading analytics");
  });

  it("renders summary metrics as readable labels instead of JSON", async () => {
    renderPage();

    // Wait until the asynchronous API responses have rendered.
    const summaryHeading = await screen.findByRole("heading", {
      name: "Summary",
    });

    const summarySection = summaryHeading.closest("section");

    expect(summarySection).not.toBeNull();

    const summary = within(summarySection as HTMLElement);

    expect(summary.getByText("Feature")).toBeInTheDocument();
    expect(summary.getByText("Journey")).toBeInTheDocument();
    expect(summary.getByText("Period · Days")).toBeInTheDocument();

    expect(summary.getByText("Totals · Total Events")).toBeInTheDocument();

    expect(
      summary.getByText("Totals · Successful Submissions"),
    ).toBeInTheDocument();

    expect(summary.getByText("Kpis · Cta To Start Rate")).toBeInTheDocument();

    expect(summary.queryByText(/"days"\s*:\s*30/)).not.toBeInTheDocument();
  });

  it("renders event records in a table with readable labels", async () => {
    renderPage();

    const table = await screen.findByRole("table");

    expect(within(table).getByText("Event Name")).toBeInTheDocument();

    expect(
      within(table).getByText("Delivery Project › Booking Submitted"),
    ).toBeInTheDocument();

    expect(within(table).getByText("Feature Use")).toBeInTheDocument();
    expect(within(table).getByText("visitor-123")).toBeInTheDocument();
    expect(within(table).getByText("session-456")).toBeInTheDocument();
  });

  it("shows an empty state when no events are returned", async () => {
    protectedApiGet.mockImplementation((path: string) =>
      Promise.resolve(path.includes("/summary") ? summary : []),
    );

    renderPage();

    expect(
      await screen.findByText("No records found for the selected filters."),
    ).toBeInTheDocument();
  });

  it("shows a dash when summary values are missing", async () => {
    protectedApiGet.mockImplementation((path: string) =>
      Promise.resolve(
        path.includes("/summary")
          ? {
              feature: "delivery_project",
              journey: "delivery_project",
              period: { days: 30 },
              totals: { successful_submissions: null },
              kpis: {},
            }
          : [{ id: "event-2", event_name: "hero.viewed" }],
      ),
    );

    renderPage();

    expect(
      await screen.findByText("Totals · Successful Submissions"),
    ).toBeInTheDocument();

    const metric = screen
      .getByText("Totals · Successful Submissions")
      .closest("article");

    expect(metric).not.toBeNull();

    expect(within(metric as HTMLElement).getByText("—")).toBeInTheDocument();
  });

  it("sends the selected reporting period to the summary endpoint", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("table");

    const reportingPeriod = screen.getByLabelText("Reporting period");

    await user.selectOptions(reportingPeriod, "7");

    await waitFor(() => {
      expect(protectedApiGet).toHaveBeenCalledWith(
        SUMMARY_PATH,
        expect.objectContaining({
          query: { days: 7 },
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  it("sends the event filter and resets pagination", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("table");

    await user.type(
      screen.getByLabelText("Event name"),
      "delivery_project.booking_submitted",
    );

    await waitFor(() => {
      expect(protectedApiGet).toHaveBeenCalledWith(
        EVENTS_PATH,
        expect.objectContaining({
          query: {
            limit: 50,
            offset: 0,
            event_name: "delivery_project.booking_submitted",
          },
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  it("displays API errors accessibly", async () => {
    protectedApiGet.mockRejectedValue(
      new Error("Request failed with status 500"),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Request failed with status 500",
    );
  });

  it("disables the Previous button on the first page", async () => {
    renderPage();

    await screen.findByRole("table");

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });
});
