
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
    "ownership_learning_circle.join_clicked",
    "ownership_learning_circle.telegram_opened",
  ];

  const expectedEventTypes: Record<string, string> = {
    "ownership_learning_circle.selected": "click",
    "ownership_learning_circle.started": "feature_use",
    "ownership_learning_circle.explanation_viewed": "view",
    "ownership_learning_circle.join_clicked": "click",
    "ownership_learning_circle.telegram_opened": "click",
    "ownership_learning_circle.back_to_paths": "click",
  };

  type RecordedCall = {
    request: {
      body: Record<string, unknown>;
    };
  };

  function read(
    body: Record<string, unknown>,
    camel: string,
    snake: string,
  ) {
    return body[camel] ?? body[snake];
  }

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

  function joinLearningCircle() {
    cy.contains("button", "Join the Learning Circle")
      .scrollIntoView()
      .should("be.visible")
      .and("be.enabled")
      .click();

    cy.contains("h2", "Join the Learning Circle").should("be.visible");
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

  function getLearningCircleRequests() {
    return cy.get("@trackEvent.all").then((calls) => {
      const recorded = calls as unknown as RecordedCall[];

      return recorded.filter((call) =>
        String(
          read(
            call.request.body,
            "eventName",
            "event_name",
          ),
        ).startsWith("ownership_learning_circle."),
      );
    });
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

    it("allows the visitor to proceed to the join step", () => {
      joinLearningCircle();

      cy.contains(
        "The Telegram invitation has been opened in a new tab.",
      ).should("be.visible");
    });
  });

  describe("step 2: joining the Learning Circle", () => {
    beforeEach(() => {
      cy.visit("/");

      cy.window().then((win) => {
        cy.stub(win, "open").as("telegramWindow");
      });

      cy.contains("button", /^Get Quick Wins$/)
        .should("be.visible")
        .click();

      selectLearningCircle();
    });

    it("opens the Telegram invitation in a new tab", () => {
      joinLearningCircle();

      cy.get("@telegramWindow").should(
        "have.been.calledWith",
        telegramUrl,
        "_blank",
        "noopener,noreferrer",
      );
    });

    it("shows the Telegram invitation link", () => {
      joinLearningCircle();

      cy.contains("a", "Open Telegram invitation")
        .should("be.visible")
        .and("have.attr", "href", telegramUrl)
        .and("have.attr", "target", "_blank")
        .and("have.attr", "rel", "noopener noreferrer");
    });

    it("returns to the explanation", () => {
      joinLearningCircle();

      cy.contains("button", /^Back$/)
        .scrollIntoView()
        .click();

      cy.contains(
        "h2",
        "Technology Ownership Learning Circle",
      ).should("be.visible");

      cy.contains("button", "Join the Learning Circle")
        .should("be.visible");
    });

    it("closes the modal from the join step", () => {
      joinLearningCircle();

      cy.contains("button", /^Close$/)
        .scrollIntoView()
        .click();

      cy.contains("h2", "Join the Learning Circle")
        .should("not.exist");

      cy.contains("button", /^Get Quick Wins$/).should("be.visible");
    });
  });

  describe("navigation and modal lifecycle", () => {
    it("returns from the join step to the explanation and then to options", () => {
      openModal();
      selectLearningCircle();
      joinLearningCircle();

      cy.contains("button", /^Back$/)
        .scrollIntoView()
        .click();

      cy.contains(
        "h2",
        "Technology Ownership Learning Circle",
      ).should("be.visible");

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

      cy.get('button[aria-label="Close Get Quick Wins modal"]')
        .should("be.visible")
        .click();

      cy.contains("button", /^Get Quick Wins$/).should("be.visible");

      cy.get("body").should("not.contain", "All project paths");
    });
  });

  describe("analytics", () => {
    it("reports each step of the Learning Circle journey", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectLearningCircle();
      joinLearningCircle();

      expectedEvents.forEach((name) => {
        cy.wrap(events).should("include", name);
      });
    });

    it("records the expected analytics event sequence", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectLearningCircle();
      joinLearningCircle();

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

    it("sends Learning Circle events to the analytics service without personal data", () => {
      openModal();

      // Wait only if visitor registration is actually configured.
      cy.get("@registerVisitor.all").should("exist");

      selectLearningCircle();
      joinLearningCircle();

      getLearningCircleRequests().should((calls) => {
        expect(
          calls,
          "Learning Circle analytics requests sent to /api/events",
        ).to.have.length.greaterThan(0);

        const names = calls.map((call) =>
          read(
            call.request.body,
            "eventName",
            "event_name",
          ),
        );

        expectedEvents.forEach((name) => {
          expect(names, `${name} request`).to.include(name);
        });
      });

      getLearningCircleRequests().then((calls) => {
        const selected = calls.find(
          (call) =>
            read(
              call.request.body,
              "eventName",
              "event_name",
            ) === "ownership_learning_circle.selected",
        );

        expect(
          selected,
          "ownership_learning_circle.selected request",
        ).to.exist;

        expect(
          read(selected!.request.body, "eventType", "event_type"),
        ).to.equal("click");

        expect(
          read(selected!.request.body, "visitorId", "visitor_id"),
        ).to.equal(visitorId);

        expect(
          read(selected!.request.body, "sessionId", "session_id"),
        ).to.equal(sessionId);

        for (const call of calls) {
          const eventName = String(
            read(
              call.request.body,
              "eventName",
              "event_name",
            ),
          );

          expect(
            read(call.request.body, "eventType", "event_type"),
            `event type for ${eventName}`,
          ).to.equal(expectedEventTypes[eventName]);

          expect(
            read(call.request.body, "visitorId", "visitor_id"),
          ).to.equal(visitorId);

          expect(
            read(call.request.body, "sessionId", "session_id"),
          ).to.equal(sessionId);
        }

        const serialized = JSON.stringify(
          calls.map((call) => call.request.body),
        );

        expect(serialized).not.to.contain(visitor.name);
        expect(serialized).not.to.contain(visitor.email);
      });
    });
  });
});

export {};
