
describe("Ownership Learning Circle — end-to-end flow", () => {
  const visitor = {
    name: "E2E Tester",
    email: "e2e-learning-circle@example.com",
  };

  const visitorId = "7c1e9a40-3b5d-4e8a-9d2f-6a4b8c0e1f22";
  const sessionId = "2d6f8b13-5a7c-4c9e-8e1b-9f3a5c7d0e44";

  const telegramUrl = "https://t.me/+nTxE4K_CdeY5Y2Rk";

  const expectedEvents = [
    "ownership_learning_circle.selected",
    "ownership_learning_circle.started",
    "ownership_learning_circle.explanation_viewed",
    "ownership_learning_circle.registration_started",
    "ownership_learning_circle.step_completed",
    "ownership_learning_circle.registration_completed",
    "ownership_learning_circle.step_completed",
    "ownership_learning_circle.join_viewed",
    "ownership_learning_circle.telegram_opened",
  ];

  function stubAnalytics() {
    cy.intercept("POST", "**/api/visitors", {
      statusCode: 201,
      body: {
        visitor_id: visitorId,
        session_id: sessionId,
      },
    }).as("registerVisitor");

    cy.intercept("POST", "**/api/events", {
      statusCode: 201,
      body: {},
    }).as("trackEvent");
  }

  function openModal() {
    cy.visit("/");

    cy.contains("button", /^Get Quick Wins$/)
      .should("be.visible")
      .click();

    cy.contains("h2", "Get Quick Wins").should("be.visible");
  }

  function selectLearningCircle() {
    cy.get(
      'button[aria-label^="Technology Ownership Learning Circle:"]',
    )
      .should("exist")
      .scrollIntoView()
      .should("be.visible")
      .and("be.enabled")
      .click();

    cy.contains(
      "h2",
      "Technology Ownership Learning Circle",
    ).should("be.visible");
  }

  function completeRegistration() {
    cy.contains("button", "Continue to registration")
      .scrollIntoView()
      .should("be.visible")
      .and("be.enabled")
      .click();

    cy.contains("h2", "Join the Learning Circle")
      .should("be.visible");

    cy.get('input[name="name"]')
      .should("be.visible")
      .clear()
      .type(visitor.name);

    cy.get('input[name="email"]')
      .should("be.visible")
      .clear()
      .type(visitor.email);

    cy.contains("button", "Continue to the Learning Circle")
      .scrollIntoView()
      .should("be.visible")
      .and("be.enabled")
      .click();

    cy.contains("h2", /you're ready to join/i)
      .should("be.visible");
  }

  function captureEvents(events: string[]) {
    cy.window().then((win) => {
      win.addEventListener("build-me:analytics", (event) => {
        const customEvent = event as CustomEvent<{
          eventName?: string;
        }>;

        if (customEvent.detail?.eventName) {
          events.push(customEvent.detail.eventName);
        }
      });
    });
  }

  function learningCircleEventNames(events: string[]) {
    return events.filter((name) =>
      name.startsWith("ownership_learning_circle."),
    );
  }

  beforeEach(() => {
    cy.viewport(1280, 900);
    stubAnalytics();
  });

  describe("choosing the Learning Circle", () => {
    it("offers the Learning Circle alongside the Ownership Audit", () => {
      openModal();

      cy.get('button[aria-label^="Technology Ownership Audit:"]')
        .should("exist")
        .scrollIntoView()
        .should("be.visible");

      cy.get(
        'button[aria-label^="Technology Ownership Learning Circle:"]',
      )
        .should("exist")
        .scrollIntoView()
        .should("be.visible");
    });

    it("keeps the Ownership Audit working alongside the Learning Circle", () => {
      openModal();
      selectLearningCircle();

      cy.contains("button", "Back to options")
        .scrollIntoView()
        .click();

      cy.get('button[aria-label^="Technology Ownership Audit:"]')
        .scrollIntoView()
        .should("be.visible")
        .click();

      cy.contains("h2", "About the Technology Ownership Audit")
        .should("be.visible");

      cy.contains("Step 1 of 5").should("be.visible");
    });
  });

  describe("step 1: why the Learning Circle", () => {
    beforeEach(() => {
      openModal();
      selectLearningCircle();
    });

    it("explains the purpose of the Learning Circle", () => {
      cy.contains(
        "The Technology Ownership Learning Circle is a community for people who want to understand, manage, and make better decisions about their digital technology.",
      ).should("be.visible");

      cy.contains("h6", "What you can learn").should("be.visible");
    });

    it("shows all three learning topics", () => {
      [
        "Understand what you own",
        "Stay in control",
        "Build long-term confidence",
      ].forEach((topic) => {
        cy.contains(topic)
          .scrollIntoView()
          .should("be.visible");
      });
    });

    it("explains the technology ownership subjects covered", () => {
      [
        "domains, hosting, source code, infrastructure, and digital assets",
        "account ownership, provider relationships, access, and handovers",
        "backups, renewals, maintenance, recovery, and technology decisions",
      ].forEach((description) => {
        cy.contains(description)
          .scrollIntoView()
          .should("be.visible");
      });
    });

    it("goes back to the options", () => {
      cy.contains("button", "Back to options")
        .scrollIntoView()
        .click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");

      cy.get(
        'button[aria-label^="Technology Ownership Learning Circle:"]',
      )
        .scrollIntoView()
        .should("be.visible");
    });

    it("continues to the registration step", () => {
      cy.contains("button", "Continue to registration")
        .scrollIntoView()
        .should("be.visible")
        .click();

      cy.contains("h2", "Join the Learning Circle")
        .should("be.visible");

      cy.get('input[name="name"]').should("be.visible");
      cy.get('input[name="email"]').should("be.visible");
    });
  });

  describe("step 2: Learning Circle registration", () => {
    beforeEach(() => {
      openModal();
      selectLearningCircle();

      cy.contains("button", "Continue to registration")
        .scrollIntoView()
        .click();

      cy.contains("h2", "Join the Learning Circle")
        .should("be.visible");
    });

    it("shows the registration fields", () => {
      cy.get('input[name="name"]').should("be.visible");
      cy.get('input[name="email"]').should("be.visible");

      // Organisation is optional.
      cy.get('input[name="organisation"]').should("exist");
    });

    it("requires valid registration details before continuing", () => {
      cy.contains("button", "Continue to the Learning Circle")
        .should("be.visible")
        .click();

      cy.get('input[name="name"]').should("be.visible");
      cy.get('input[name="email"]').should("be.visible");

      cy.contains("h2", "Join the Learning Circle")
        .should("be.visible");
    });

    it("accepts visitor details and proceeds to the join step", () => {
      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type(visitor.email);

      cy.contains("button", "Continue to the Learning Circle")
        .scrollIntoView()
        .click();

      cy.contains("h2", /you're ready to join/i)
        .should("be.visible");

      cy.contains("a", "Join the Learning Circle")
        .should("be.visible");
    });
  });

  describe("step 3: joining the Learning Circle", () => {
    beforeEach(() => {
      openModal();
      selectLearningCircle();
      completeRegistration();
    });

    it("shows the Telegram invitation link", () => {
      cy.contains("a", "Join the Learning Circle")
        .should("be.visible")
        .and("have.attr", "href", telegramUrl)
        .and("have.attr", "target", "_blank")
        .and("have.attr", "rel", "noopener noreferrer");
    });

    it("opens the Telegram invitation in a new tab", () => {
      cy.contains("a", "Join the Learning Circle")
        .should("have.attr", "target", "_blank")
        .and("have.attr", "href", telegramUrl);
    });

    it("returns to registration from the join step", () => {
      cy.contains("button", "Previous")
        .scrollIntoView()
        .click();

      cy.contains("h2", "Join the Learning Circle")
        .should("be.visible");

      cy.get('input[name="name"]').should("have.value", visitor.name);
      cy.get('input[name="email"]').should("have.value", visitor.email);
    });

    it("closes the modal from the join step", () => {
      cy.contains("button", /^Close$/)
        .scrollIntoView()
        .click();

      cy.contains("h2", /you're ready to join/i)
        .should("not.exist");

      cy.contains("button", /^Get Quick Wins$/)
        .should("be.visible");
    });
  });

  describe("navigation and modal lifecycle", () => {
    it("returns from the join step through registration to the explanation and options", () => {
      openModal();
      selectLearningCircle();
      completeRegistration();

      // Join -> Registration
      cy.contains("button", "Previous")
        .scrollIntoView()
        .click();

      cy.contains("h2", "Join the Learning Circle")
        .should("be.visible");

      // Registration -> Why
      cy.contains("button", "Previous")
        .scrollIntoView()
        .click();

      cy.contains(
        "h2",
        "Technology Ownership Learning Circle",
      ).should("be.visible");

      // Why -> Options
      cy.contains("button", "Back to options")
        .scrollIntoView()
        .click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");
    });

    it("closes and starts fresh when reopened", () => {
      openModal();
      selectLearningCircle();

      cy.get('button[aria-label="Close Get Quick Wins modal"]')
        .should("be.visible")
        .click();

      cy.contains(
        "h2",
        "Technology Ownership Learning Circle",
      ).should("not.exist");

      cy.contains("button", /^Get Quick Wins$/)
        .should("be.visible")
        .click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");

      cy.get(
        'button[aria-label^="Technology Ownership Learning Circle:"]',
      )
        .scrollIntoView()
        .should("be.visible");
    });

    it("does not open Work With Me when the visitor closes the Learning Circle", () => {
      openModal();
      selectLearningCircle();
      completeRegistration();

      cy.contains("button", /^Close$/)
        .scrollIntoView()
        .click();

      cy.contains("button", /^Get Quick Wins$/)
        .should("be.visible");

      cy.get("body").should("not.contain", "All project paths");
    });
  });

  describe("analytics", () => {
    it("reports the events for each step of the Learning Circle journey", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectLearningCircle();
      completeRegistration();

      expectedEvents.slice(0, -1).forEach((name) => {
        cy.wrap(events).should("include", name);
      });

      cy.contains("a", "Join the Learning Circle")
        .should("be.visible")
        .click();

      cy.wrap(events).should(
        "include",
        "ownership_learning_circle.telegram_opened",
      );
    });

    it("records the expected analytics event sequence", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectLearningCircle();
      completeRegistration();

      cy.contains("a", "Join the Learning Circle")
        .should("be.visible")
        .click();

      cy.wrap(events).should(() => {
        expect(learningCircleEventNames(events)).to.deep.equal(
          expectedEvents,
        );
      });
    });

    it("records the back-to-paths event when the visitor returns to options", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectLearningCircle();

      cy.contains("button", "Back to options")
        .scrollIntoView()
        .click();

      cy.wrap(events).should(
        "include",
        "ownership_learning_circle.back_to_paths",
      );
    });
  });
});

export {};
