import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

import { DeliveryProjectAnalyticsPage } from "../../../apps/dashboard/src/pages/analytics/DeliveryProjectAnalyticsPage";
import { HeroAnalyticsPage } from "../../../apps/dashboard/src/pages/analytics/HeroAnalyticsPage";
import { NavbarAnalyticsPage } from "../../../apps/dashboard/src/pages/analytics/NavbarAnalyticsPage";

const { protectedApiGet } = vi.hoisted(() => ({
  protectedApiGet: vi.fn(),
}));

vi.mock("../../../apps/dashboard/src/lib/protectedApi", () => ({
  protectedApiGet,
}));

describe("Analytics page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    protectedApiGet.mockImplementation((path: string) => {
      if (path.includes("delivery-project/summary")) {
        return Promise.resolve({
          totals: {
            total_events: 9,
            successful_submissions: 3,
          },
        });
      }

      if (path.includes("hero/summary")) {
        return Promise.resolve({
          hero_views: 11,
          unique_hero_visitors: 8,
          page_views: 20,
        });
      }

      if (path.includes("navbar/kpis")) {
        return Promise.resolve({
          logo_clicks: 6,
          nav_link_clicks: 14,
        });
      }

      if (path.includes("delivery-project/events")) {
        return Promise.resolve([
          {
            id: "project-event-1",
            event_name: "delivery_project.started",
            event_type: "feature_use",
            visitor_id: "visitor-1",
            timestamp: "2026-10-20T10:00:00Z",
          },
        ]);
      }

      if (path.includes("hero/events")) {
        return Promise.resolve([
          {
            id: "hero-event-1",
            event_name: "hero.viewed",
            event_type: "view",
            visitor_id: "visitor-2",
          },
        ]);
      }

      if (path.includes("navbar/events")) {
        return Promise.resolve([
          {
            id: "navbar-event-1",
            event_name: "navbar.logo_click",
            event_type: "click",
            visitor_id: "visitor-3",
            metadata: {
              source_route: "/",
              destination_route: "/",
            },
          },
        ]);
      }

      return Promise.resolve([]);
    });
  });

  afterEach(cleanup);

  it("renders delivery project analytics metrics and events", async () => {
    render(<DeliveryProjectAnalyticsPage />);

    expect(
      screen.getByRole("heading", { name: "Delivery Project Analytics" }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("Totals · Successful Submissions"),
    ).toBeInTheDocument();

    const table = await screen.findByRole("table");

    expect(
      within(table).getByText("Delivery Project › Started"),
    ).toBeInTheDocument();

    expect(protectedApiGet).toHaveBeenCalledWith(
      "/api/admin/analytics/delivery-project/summary",
      expect.objectContaining({
        query: { days: 30 },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("renders hero metrics and visibility events", async () => {
    render(<HeroAnalyticsPage />);

    expect(
      screen.getByRole("heading", { name: "Hero Analytics" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Unique Hero Visitors")).toBeInTheDocument();

    const table = await screen.findByRole("table");

    expect(within(table).getByText("Hero › Viewed")).toBeInTheDocument();

    expect(protectedApiGet).toHaveBeenCalledWith(
      "/api/admin/analytics/hero/events",
      expect.objectContaining({
        query: { limit: 50, offset: 0 },
      }),
    );
  });

  it("renders navbar KPIs and navigation events", async () => {
    render(<NavbarAnalyticsPage />);

    expect(
      screen.getByRole("heading", { name: "Navbar Analytics" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Logo Clicks")).toBeInTheDocument();

    const table = await screen.findByRole("table");

    expect(within(table).getByText("Navbar › Logo Click")).toBeInTheDocument();

    expect(protectedApiGet).toHaveBeenCalledWith(
      "/api/admin/analytics/navbar/kpis",
      expect.objectContaining({
        query: { days: 30 },
      }),
    );
  });
});
