
describe("Admin analytics pages", () => {
  const deliverySummary = {
    feature: "delivery_project",
    totals: {
      total_events: 12,
      successful_submissions: 3,
      validation_failures: 1,
    },
    kpis: {
      cta_to_start_rate: 0.5,
      submission_to_confirmation_rate: 1,
    },
  };

  const deliveryEvents = [
    {
      id: "delivery-event-1",
      event_name: "delivery_project.booking_submitted",
      event_type: "feature_use",
      visitor_id: "visitor-e2e-1",
      session_id: "session-e2e-1",
      timestamp: "2026-10-20T10:30:00Z",
      feature: "delivery_project",
      metadata: {
        source_route: "/",
        destination_route: "/confirmation",
      },
    },
  ];

  beforeEach(() => {
    // Replace this with your existing authenticated Cypress login helper
    // if the dashboard requires authentication before rendering routes.
    cy.intercept("GET", "**/api/admin/analytics/delivery-project/summary*", {
      statusCode: 200,
      body: deliverySummary,
    }).as("deliverySummary");

    cy.intercept("GET", "**/api/admin/analytics/delivery-project/events*", {
      statusCode: 200,
      body: deliveryEvents,
    }).as("deliveryEvents");

    cy.intercept("GET", "**/api/admin/analytics/hero/summary*", {
      statusCode: 200,
      body: {
        hero_views: 11,
        unique_hero_visitors: 8,
        page_views: 20,
      },
    }).as("heroSummary");

    cy.intercept("GET", "**/api/admin/analytics/hero/events*", {
      statusCode: 200,
      body: [
        {
          id: "hero-event-1",
          event_name: "hero.viewed",
          event_type: "view",
          visitor_id: "visitor-hero-e2e",
        },
      ],
    }).as("heroEvents");

    cy.intercept("GET", "**/api/admin/analytics/navbar/kpis*", {
      statusCode: 200,
      body: {
        logo_clicks: 6,
        nav_link_clicks: 14,
      },
    }).as("navbarSummary");

    cy.intercept("GET", "**/api/admin/analytics/navbar/events*", {
      statusCode: 200,
      body: [
        {
          id: "navbar-event-1",
          event_name: "navbar.logo_click",
          event_type: "click",
          visitor_id: "visitor-navbar-e2e",
        },
      ],
    }).as("navbarEvents");
  });

  it("displays readable delivery project summary metrics and event table", () => {
    cy.visit("/analytics/delivery-project");

    cy.wait("@deliverySummary");
    cy.wait("@deliveryEvents");

    cy.contains("h1", "Delivery Project Analytics").should("be.visible");
    cy.contains("Total Events").should("be.visible");
    cy.contains("Successful Submissions").should("be.visible");

    cy.findByRole("table").within(() => {
      cy.contains("th", "Event Name").should("be.visible");
      cy.contains("Delivery Project › Booking Submitted").should("be.visible");
      cy.contains("visitor-e2e-1").should("be.visible");
      cy.contains("session-e2e-1").should("be.visible");
    });

    cy.contains('{"total_events":12').should("not.exist");
  });

  it("filters delivery project events by event name", () => {
    cy.visit("/analytics/delivery-project");

    cy.wait("@deliverySummary");
    cy.wait("@deliveryEvents");

    cy.findByLabelText("Event name")
      .clear()
      .type("delivery_project.booking_submitted");

    cy.wait("@deliveryEvents").then((interception) => {
      expect(interception.request.url).to.include(
        "event_name=delivery_project.booking_submitted",
      );
    });
  });

  it("displays readable hero analytics", () => {
    cy.visit("/analytics/hero");

    cy.wait("@heroSummary");
    cy.wait("@heroEvents");

    cy.contains("h1", "Hero Analytics").should("be.visible");
    cy.contains("Unique Hero Visitors").should("be.visible");

    cy.findByRole("table").within(() => {
      cy.contains("Hero › Viewed").should("be.visible");
      cy.contains("visitor-hero-e2e").should("be.visible");
    });
  });

  it("displays readable navbar analytics", () => {
    cy.visit("/analytics/navbar");

    cy.wait("@navbarSummary");
    cy.wait("@navbarEvents");

    cy.contains("h1", "Navbar Analytics").should("be.visible");
    cy.contains("Logo Clicks").should("be.visible");

    cy.findByRole("table").within(() => {
      cy.contains("Navbar › Logo Click").should("be.visible");
      cy.contains("visitor-navbar-e2e").should("be.visible");
    });
  });

  it("refreshes the current analytics page", () => {
    cy.visit("/analytics/hero");

    cy.wait("@heroSummary");
    cy.wait("@heroEvents");

    cy.findByRole("button", { name: "Refresh" }).click();

    cy.wait("@heroSummary");
    cy.wait("@heroEvents");

    cy.contains("h1", "Hero Analytics").should("be.visible");
  });
});
