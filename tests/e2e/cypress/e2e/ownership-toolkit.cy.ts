describe("Ownership Toolkit — end-to-end flow", () => {
  const visitor = { name: "E2E Tester", email: "e2e-toolkit@example.com" };

  const visitorId = "7c1e9a40-3b5d-4e8a-9d2f-6a4b8c0e1f22";
  const sessionId = "2d6f8b13-5a7c-4c9e-8e1b-9f3a5c7d0e44";

  const pdfPath = "/downloads/technology-ownership-toolkit.pdf";
  const pdfFileName = "Technology-Ownership-Toolkit.pdf";

  const parts = [
    {
      title: "Part 1: Know what you own",
      tools: [
        "Domain and DNS checklist",
        "Hosting and cloud checklist",
        "Source code checklist",
      ],
    },
    {
      title: "Part 2: Stay in control of access and providers",
      tools: [
        "Critical accounts register",
        "Handover pack template",
        "Provider exit plan",
      ],
    },
    {
      title: "Part 3: Keep running and recover",
      tools: [
        "Backup and recovery checklist",
        "Renewals and costs calendar",
        "Maintenance and incident plan",
      ],
    },
  ];

  const allToolTitles = parts.flatMap((part) => part.tools);

  function stubAnalytics() {
    cy.intercept("POST", "**/api/visitors", {
      statusCode: 201,
      body: { visitor_id: visitorId, session_id: sessionId },
    }).as("registerVisitor");

    cy.intercept("POST", "**/api/events", { statusCode: 201, body: {} }).as(
      "trackEvent",
    );
  }

  function openModal() {
    cy.visit("/");

    cy.contains("button", /^Get Quick Wins$/)
      .should("be.visible")
      .click();

    cy.contains("h2", "Get Quick Wins").should("be.visible");
  }

  function selectToolkit() {
    cy.get('button[aria-label^="Technology Ownership Toolkit:"]')
      .should("be.visible")
      .click();

    cy.contains("h2", "Why the Technology Ownership Toolkit?").should(
      "be.visible",
    );
  }

  function continueToDetails() {
    cy.contains("button", "Continue to your details")
      .scrollIntoView()
      .should("be.visible")
      .click();

    cy.contains("h2", "Your details").should("be.visible");
  }

  function submitDetails() {
    cy.get('input[name="name"]').type(visitor.name);
    cy.get('input[name="email"]').type(visitor.email);
    cy.contains("button", "Open my toolkit").click();
  }

  function reachToolkit() {
    openModal();
    selectToolkit();
    continueToDetails();
    submitDetails();

    cy.contains("h2", "Your Technology Ownership Toolkit").should("be.visible");
  }

  function toolSummary(title: string) {
    // Each tool is an accordion whose header is a button with aria-expanded.
    return cy.contains('[role="button"][aria-expanded]', title);
  }

  function captureEvents(events: string[]) {
    cy.window().then((win) => {
      win.addEventListener("build-me:analytics", (event) => {
        events.push((event as CustomEvent).detail.eventName);
      });
    });
  }

  beforeEach(() => {
    stubAnalytics();
  });

  describe("choosing the toolkit", () => {
    it("offers the toolkit next to the audit", () => {
      openModal();

      cy.get('button[aria-label^="Technology Ownership Audit:"]').should(
        "be.visible",
      );
      cy.get('button[aria-label^="Technology Ownership Toolkit:"]').should(
        "be.visible",
      );
    });

    it("keeps the audit working alongside it", () => {
      openModal();
      selectToolkit();

      cy.contains("button", /^Back$/).scrollIntoView().click();
      cy.get('button[aria-label^="Technology Ownership Audit:"]').click();

      cy.contains("h2", "About the Technology Ownership Audit").should(
        "be.visible",
      );
      cy.contains("Step 1 of 5").should("be.visible");
    });
  });

  describe("step 1: why the toolkit", () => {
    it("explains what the toolkit is, why to use it, what is inside and who it is for", () => {
      openModal();
      selectToolkit();

      cy.contains("Step 1 of 3").should("be.visible");

      ["What is the Toolkit?", "Why use it?", "What is inside?", "Who is it for?"].forEach(
        (heading) => {
          cy.contains("h3", heading).scrollIntoView().should("be.visible");
        },
      );
    });

    it("lists every part and tool", () => {
      openModal();
      selectToolkit();

      parts.forEach((part) => {
        cy.contains("h4", part.title).scrollIntoView().should("be.visible");

        part.tools.forEach((tool) => {
          cy.contains("li", tool).should("exist");
        });
      });
    });

    it("goes back to the options", () => {
      openModal();
      selectToolkit();

      cy.contains("button", /^Back$/).scrollIntoView().click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");
      cy.get('button[aria-label^="Technology Ownership Toolkit:"]').should(
        "be.visible",
      );
    });
  });

  describe("step 2: your details", () => {
    it("shows the details form", () => {
      openModal();
      selectToolkit();
      continueToDetails();

      cy.contains("Step 2 of 3").should("be.visible");
      cy.get('input[name="name"]').should("be.visible");
      cy.get('input[name="email"]').should("be.visible");
      cy.get('input[name="organisation"]').should("be.visible");
    });

    it("keeps the toolkit closed until the details are valid, and focuses the first problem", () => {
      openModal();
      selectToolkit();
      continueToDetails();

      cy.contains("button", "Open my toolkit").click();

      cy.contains("Please enter your name using at least 2 characters.").should(
        "be.visible",
      );
      cy.contains("Please enter a valid email address.").should("be.visible");
      cy.get('input[name="name"]').should("have.focus");

      cy.contains("Step 2 of 3").should("be.visible");
      cy.contains("a", "Download PDF").should("not.exist");
    });

    it("rejects an invalid email address", () => {
      openModal();
      selectToolkit();
      continueToDetails();

      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type("not-an-email");
      cy.contains("button", "Open my toolkit").click();

      cy.contains("Please enter a valid email address.").should("be.visible");
      cy.contains("Please enter your name using at least 2 characters.").should(
        "not.exist",
      );
    });

    it("goes back to step 1", () => {
      openModal();
      selectToolkit();
      continueToDetails();

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 1 of 3").should("be.visible");
    });
  });

  describe("step 3: the toolkit online", () => {
    it("shows the toolkit prepared for the visitor", () => {
      reachToolkit();

      cy.contains("Step 3 of 3").should("be.visible");
      cy.contains(`Prepared for ${visitor.name} · Version 1.0`).should(
        "be.visible",
      );
      cy.contains("h3", "How to use this toolkit")
        .scrollIntoView()
        .should("be.visible");
    });

    it("shows every part with its three tools, closed to begin with", () => {
      reachToolkit();

      parts.forEach((part) => {
        cy.contains("h3", part.title).scrollIntoView().should("be.visible");
      });

      allToolTitles.forEach((title) => {
        toolSummary(title).should("have.attr", "aria-expanded", "false");
      });

      cy.get('input[type="checkbox"]').should("not.exist");
    });

    it("opens a tool to show its checklist, template and finish line", () => {
      reachToolkit();

      toolSummary("Domain and DNS checklist").scrollIntoView().click();

      cy.contains("Make sure your business, not a provider, controls your domain name.")
        .scrollIntoView()
        .should("be.visible");
      cy.get('input[type="checkbox"]').should("have.length", 6);
      cy.contains("h4", "Template: Domain register")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("Registrar").scrollIntoView().should("be.visible");
      cy.contains("Done when:").scrollIntoView().should("be.visible");
    });

    it("lets the visitor tick checklist items", () => {
      reachToolkit();

      toolSummary("Domain and DNS checklist").scrollIntoView().click();

      cy.get('input[type="checkbox"]').first().check({ force: true });

      cy.get('input[type="checkbox"]').first().should("be.checked");
      cy.get('input[type="checkbox"]').eq(1).should("not.be.checked");
    });

    it("closes a tool again", () => {
      reachToolkit();

      toolSummary("Source code checklist").scrollIntoView().click();
      cy.get('input[type="checkbox"]').should("have.length", 6);

      toolSummary("Source code checklist").click();

      cy.get('input[type="checkbox"]').should("not.exist");
      toolSummary("Source code checklist").should(
        "have.attr",
        "aria-expanded",
        "false",
      );
    });

    it("opens every one of the nine tools", () => {
      reachToolkit();

      allToolTitles.forEach((title) => {
        toolSummary(title).scrollIntoView().click();
        toolSummary(title).should("have.attr", "aria-expanded", "true");
      });

      cy.get('input[type="checkbox"]').should("have.length", 54);
    });

    it("goes back to the details with them kept", () => {
      reachToolkit();

      cy.contains("button", /^Previous$/).scrollIntoView().click();

      cy.contains("Step 2 of 3").should("be.visible");
      cy.get('input[name="name"]').should("have.value", visitor.name);
      cy.get('input[name="email"]').should("have.value", visitor.email);
    });

    it("closes from the Close button and starts fresh when reopened", () => {
      reachToolkit();

      cy.contains("button", /^Close$/).scrollIntoView().click();
      cy.contains("h2", "Your Technology Ownership Toolkit").should("not.exist");

      cy.contains("button", /^Get Quick Wins$/).click();
      selectToolkit();
      continueToDetails();

      cy.get('input[name="name"]').should("have.value", "");
    });
  });

  describe("the PDF", () => {
    it("links to the generated file with a download name", () => {
      reachToolkit();

      cy.contains("a", "Download PDF")
        .should("have.attr", "href", pdfPath)
        .and("have.attr", "download", pdfFileName);
    });

    it("is served as a real PDF by the web app", () => {
      cy.request({ url: pdfPath, encoding: "binary" }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.headers["content-type"]).to.include("application/pdf");
        expect(String(response.body).slice(0, 5)).to.equal("%PDF-");
        expect(String(response.body).length).to.be.greaterThan(5000);
      });
    });

    it("downloads the file when the visitor clicks Download PDF", () => {
      const events: string[] = [];

      reachToolkit();
      captureEvents(events);

      cy.contains("a", "Download PDF").scrollIntoView().click();

      cy.readFile(`${Cypress.config("downloadsFolder")}/${pdfFileName}`, null, {
        timeout: 15000,
      }).should("have.length.greaterThan", 5000);

      cy.wrap(events).should("include", "ownership_toolkit.pdf_downloaded");
    });
  });

  describe("analytics", () => {
    it("reports each step of the journey as it happens", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectToolkit();
      continueToDetails();
      submitDetails();
      cy.contains("h2", "Your Technology Ownership Toolkit").should("be.visible");

      toolSummary("Backup and recovery checklist").scrollIntoView().click();
      cy.contains("a", "Download PDF").scrollIntoView().click();

      [
        "ownership_toolkit.selected",
        "ownership_toolkit.started",
        "ownership_toolkit.step_completed",
        "ownership_toolkit.registration_completed",
        "ownership_toolkit.content_viewed",
        "ownership_toolkit.tool_opened",
        "ownership_toolkit.pdf_downloaded",
      ].forEach((name) => {
        cy.wrap(events).should("include", name);
      });
    });

    // Needs VITE_ANALYTICS_URL, so the page registers a visitor (stubbed above)
    // and sends events to the analytics service (also stubbed).
    it("sends the events to the analytics service without personal data", () => {
      type RecordedCall = { request: { body: Record<string, unknown> } };

      const read = (body: Record<string, unknown>, camel: string, snake: string) =>
        body[camel] ?? body[snake];

      openModal();

      // Precondition: the page registered a visitor, which only happens when
      // the web app was started with VITE_ANALYTICS_URL.
      cy.wait("@registerVisitor", { timeout: 10000 });

      selectToolkit();
      continueToDetails();
      submitDetails();
      cy.contains("h2", "Your Technology Ownership Toolkit").should("be.visible");

      cy.get("@trackEvent.all").should((calls) => {
        const recorded = calls as unknown as RecordedCall[];

        expect(recorded, "analytics requests sent to /api/events").to.have.length
          .greaterThan(0);

        const names = recorded.map((call) =>
          read(call.request.body, "eventName", "event_name"),
        );

        expect(names).to.include("ownership_toolkit.selected");
        expect(names).to.include("ownership_toolkit.registration_completed");
        expect(names).to.include("ownership_toolkit.content_viewed");
      });

      cy.get("@trackEvent.all").then((calls) => {
        const recorded = calls as unknown as RecordedCall[];

        const selected = recorded.find(
          (call) =>
            read(call.request.body, "eventName", "event_name") ===
            "ownership_toolkit.selected",
        );

        expect(selected, "ownership_toolkit.selected request").to.exist;
        expect(read(selected!.request.body, "eventType", "event_type")).to.equal(
          "click",
        );
        expect(read(selected!.request.body, "visitorId", "visitor_id")).to.equal(
          visitorId,
        );

        const serialized = JSON.stringify(recorded.map((call) => call.request.body));

        expect(serialized).not.to.contain(visitor.name);
        expect(serialized).not.to.contain(visitor.email);
      });
    });
  });
});

export {};
