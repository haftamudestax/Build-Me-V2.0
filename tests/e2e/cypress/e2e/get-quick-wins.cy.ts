describe("Get Quick Wins — end-to-end flow", () => {
  const visitor = { name: "E2E Tester", email: "e2e-tester@example.com" };

  const visitorId = "5b0d2a6e-2c0f-4b0e-9f0e-1c6f2d9a7b11";
  const sessionId = "9a3c1f52-7d4e-4f0a-8b6c-2e1d5a7c9f33";

  const questionIdsBySection = [
    ["domain", "hosting", "source_code"],
    ["credentials", "documentation", "providers"],
    ["backups", "renewals", "maintenance"],
  ];

  const allTwos = Array<number>(9).fill(2);
  const allZeros = Array<number>(9).fill(0);

  // 10 of 18 points is 56/100.
  const mixed = [2, 2, 2, 2, 2, 0, 0, 0, 0];

  const paths = [
    { title: "Deliver My Project", selectedEvent: "delivery_project.selected" },
    { title: "Mentor Me", selectedEvent: "mentor_me.selected" },
    { title: "Coffee With Me", selectedEvent: "coffee_with_me.selected" },
  ];

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

  function selectAudit() {
    cy.get('button[aria-label^="Technology Ownership Audit:"]')
      .should("be.visible")
      .click();

    cy.contains("h2", "About the Technology Ownership Audit").should(
      "be.visible",
    );
  }

  function continueToRegistration() {
    cy.contains("button", "Continue to registration").click();
    cy.contains("h2", "Register for your audit").should("be.visible");
  }

  function register() {
    cy.get('input[name="name"]').type(visitor.name);
    cy.get('input[name="email"]').type(visitor.email);
    cy.contains("button", /^Next$/).click();
  }

  function answer(questionId: string, points: number) {
    // MUI hides the native radio input behind its own icon.
    cy.get(`input[name="${questionId}"][value="${points}"]`).check({
      force: true,
    });
  }

  function answerSection(sectionIndex: number, points: number[]) {
    questionIdsBySection[sectionIndex].forEach((questionId, index) => {
      answer(questionId, points[index]);
    });
  }

  function completeQuestions(points: number[]) {
    [0, 1, 2].forEach((sectionIndex) => {
      answerSection(sectionIndex, points.slice(sectionIndex * 3, sectionIndex * 3 + 3));

      cy.contains(
        "button",
        sectionIndex === 2 ? "See my score" : /^Next$/,
      ).click();
    });
  }

  function startQuestions() {
    openModal();
    selectAudit();
    continueToRegistration();
    register();
    cy.contains("Step 3 of 5 · Section 1 of 3").should("be.visible");
  }

  function reachScore(points: number[]) {
    startQuestions();
    completeQuestions(points);
    cy.contains("h2", "Your Technology Ownership Score").should("be.visible");
  }

  function reachNextSteps(points: number[]) {
    reachScore(points);
    cy.contains("button", /^Next$/).click();
    cy.contains("h2", "Your next steps").should("be.visible");
  }

  function scoreElement(score: number) {
    return cy.get(`[aria-label="Score: ${score} out of 100"]`);
  }

  // The "Recommended for you" chip sits in the same row as the path's heading.
  function expectRecommended(recommendedTitle: string) {
    paths.forEach(({ title }) => {
      const row = cy.contains("h4", title).parent();

      if (title === recommendedTitle) {
        row.should("contain.text", "Recommended for you");
      } else {
        row.should("not.contain.text", "Recommended for you");
      }
    });
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

  describe("opening and step 1", () => {
    it("opens a modal from the Get Quick Wins button", () => {
      openModal();

      cy.get('button[aria-label^="Technology Ownership Audit:"]').should(
        "be.visible",
      );
    });

    it("closes from the close button", () => {
      openModal();

      cy.get('button[aria-label="Close Get Quick Wins modal"]').click();

      cy.contains("h2", "Get Quick Wins").should("not.exist");
    });

    it("explains what the audit is, why to do it and the benefits", () => {
      openModal();
      selectAudit();

      cy.contains("Step 1 of 5").should("be.visible");
      // The modal's content scrolls, and Cypress treats anything clipped by a
      // scrolling ancestor as hidden, so scroll each part into view first.
      cy.contains("h3", "What is the Technology Ownership Audit?")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("h3", "Why do a Technology Ownership Audit?")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("h3", "What are the benefits?")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("button", "Continue to registration")
        .scrollIntoView()
        .should("be.visible");
    });

    it("goes back to the options from the introduction", () => {
      openModal();
      selectAudit();

      cy.contains("button", /^Back$/).click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");
      cy.get('button[aria-label^="Technology Ownership Audit:"]').should(
        "be.visible",
      );
    });
  });

  describe("step 2: registration", () => {
    it("shows the registration form", () => {
      openModal();
      selectAudit();
      continueToRegistration();

      cy.contains("Step 2 of 5").should("be.visible");
      cy.get('input[name="name"]').should("be.visible");
      cy.get('input[name="email"]').should("be.visible");
      cy.get('input[name="organisation"]').should("be.visible");
    });

    it("shows an error under each empty required field and focuses the first", () => {
      openModal();
      selectAudit();
      continueToRegistration();

      cy.contains("button", /^Next$/).click();

      cy.contains("Please enter your name using at least 2 characters.").should(
        "be.visible",
      );
      cy.contains("Please enter a valid email address.").should("be.visible");
      cy.get('input[name="name"]').should("have.focus");
      cy.contains("Step 2 of 5").should("be.visible");
    });

    it("rejects an invalid email address", () => {
      openModal();
      selectAudit();
      continueToRegistration();

      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type("not-an-email");
      cy.contains("button", /^Next$/).click();

      cy.contains("Please enter a valid email address.").should("be.visible");
      cy.contains("Please enter your name using at least 2 characters.").should(
        "not.exist",
      );
    });

    it("goes back to the introduction", () => {
      openModal();
      selectAudit();
      continueToRegistration();

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 1 of 5").should("be.visible");
    });

    it("moves on to the questions once the form is valid", () => {
      startQuestions();

      cy.contains("h2", "Technology ownership").should("be.visible");
      cy.get('input[type="radio"]').should("have.length", 9);
      cy.get('input[type="radio"]:checked').should("not.exist");
    });
  });

  describe("step 3: the questions", () => {
    it("asks for every answer in a section before continuing", () => {
      startQuestions();

      cy.contains("button", /^Next$/).click();

      cy.get('[role="alert"]')
        .scrollIntoView()
        .should("be.visible")
        .and("contain.text", "Please answer every question before continuing.");

      // The step label is at the top of the scrolling content, so bring it back
      // into view before asserting that the visitor is still on section 1.
      cy.contains("Step 3 of 5 · Section 1 of 3")
        .scrollIntoView()
        .should("be.visible");

      // Two of three answers is still not enough.
      answer("domain", 2);
      answer("hosting", 1);
      cy.contains("button", /^Next$/).click();
      cy.get('[role="alert"]').scrollIntoView().should("be.visible");

      // The last answer lets the visitor continue.
      answer("source_code", 0);
      cy.contains("button", /^Next$/).click();

      cy.contains("Step 3 of 5 · Section 2 of 3").should("be.visible");
      cy.contains("h2", "Access and independence").should("be.visible");
    });

    it("goes back a section and keeps the answers", () => {
      startQuestions();

      answerSection(0, [2, 1, 0]);
      cy.contains("button", /^Next$/).click();
      cy.contains("Step 3 of 5 · Section 2 of 3").should("be.visible");

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 3 of 5 · Section 1 of 3").should("be.visible");
      cy.get('input[name="domain"][value="2"]').should("be.checked");
      cy.get('input[name="hosting"][value="1"]').should("be.checked");
      cy.get('input[name="source_code"][value="0"]').should("be.checked");
    });

    it("goes back to registration with the details kept", () => {
      startQuestions();

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 2 of 5").should("be.visible");
      cy.get('input[name="name"]').should("have.value", visitor.name);
      cy.get('input[name="email"]').should("have.value", visitor.email);
    });

    it("labels the last section's button See my score", () => {
      startQuestions();

      answerSection(0, [2, 2, 2]);
      cy.contains("button", /^Next$/).click();
      answerSection(1, [2, 2, 2]);
      cy.contains("button", /^Next$/).click();

      cy.contains("Step 3 of 5 · Section 3 of 3").should("be.visible");
      cy.contains("button", "See my score")
        .scrollIntoView()
        .should("be.visible");
    });
  });

  describe("step 4: the score", () => {
    it("shows the visitor's name and a perfect score", () => {
      reachScore(allTwos);

      cy.contains("Step 4 of 5").should("be.visible");
      cy.get('[data-testid="quick-wins-name"]').should(
        "have.text",
        visitor.name,
      );
      scoreElement(100).should("have.text", "100/100");
      cy.get('[data-testid="quick-wins-band"]').should(
        "have.text",
        "Strong ownership foundations",
      );
      cy.contains(
        "This is a self-assessment based on your answers, not a security audit or certification.",
      ).should("be.visible");
    });

    it("scores a fully dependent setup as 0 and high risk", () => {
      reachScore(allZeros);

      scoreElement(0).should("have.text", "0/100");
      cy.get('[data-testid="quick-wins-band"]').should(
        "have.text",
        "High dependency risk",
      );
    });

    it("scores a mixed setup as ownership gaps to address", () => {
      reachScore(mixed);

      scoreElement(56).should("have.text", "56/100");
      cy.get('[data-testid="quick-wins-band"]').should(
        "have.text",
        "Ownership gaps to address",
      );
    });

    it("goes back to the last section of questions", () => {
      reachScore(allTwos);

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 3 of 5 · Section 3 of 3").should("be.visible");
      cy.get('input[name="backups"][value="2"]').should("be.checked");
    });

    it("scores the latest answer after going back to change one", () => {
      reachScore(allTwos);
      scoreElement(100).should("be.visible");

      cy.contains("button", /^Previous$/).click();

      // Backups: 2 points down to 0 points makes 16 of 18, or 89.
      answer("backups", 0);
      cy.contains("button", "See my score").click();

      scoreElement(89).should("have.text", "89/100");
    });
  });

  describe("step 5: next steps", () => {
    it("describes a strong result and recommends Mentor Me", () => {
      reachNextSteps(allTwos);

      cy.contains("Step 5 of 5").should("be.visible");
      cy.contains(`${visitor.name}, you are in a strong position`).should(
        "be.visible",
      );
      expectRecommended("Mentor Me");
    });

    it("describes a mixed result and recommends Deliver My Project", () => {
      reachNextSteps(mixed);

      cy.contains(`${visitor.name}, you have important controls in place`).should(
        "be.visible",
      );
      expectRecommended("Deliver My Project");
    });

    it("describes a high-risk result and recommends Coffee With Me", () => {
      reachNextSteps(allZeros);

      cy.contains(`${visitor.name}, your setup may leave you dependent`).should(
        "be.visible",
      );
      expectRecommended("Coffee With Me");
    });

    it("offers a link to each of the three paths", () => {
      reachNextSteps(allZeros);

      paths.forEach(({ title }) => {
        cy.contains("button", `Go to ${title}`).should("exist");
      });
    });

    it("goes back to the score", () => {
      reachNextSteps(allTwos);

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 4 of 5").should("be.visible");
      scoreElement(100).should("be.visible");
    });

    it("closes from the Close button", () => {
      reachNextSteps(allTwos);

      cy.contains("button", /^Close$/).click();

      cy.contains("h2", "Your next steps").should("not.exist");
    });

    paths.forEach(({ title, selectedEvent }) => {
      it(`opens Work With Me on "${title}" from the final step`, () => {
        const events: string[] = [];

        reachNextSteps(allZeros);
        captureEvents(events);

        cy.contains("button", `Go to ${title}`)
          .scrollIntoView()
          .should("be.visible")
          .click();

        // Get Quick Wins closes and the chosen path opens in Work With Me,
        // skipping its list of paths.
        cy.contains("h2", "Your next steps").should("not.exist");
        cy.contains("button", "All project paths").should("be.visible");

        cy.wrap(events).should("include", "ownership_audit.path_selected");
        cy.wrap(events).should("include", "get_quick_wins.closed");
        cy.wrap(events).should("include", selectedEvent);
      });
    });

    it("shows the Mentor Me form when Mentor Me is chosen", () => {
      reachNextSteps(allZeros);

      cy.contains("button", "Go to Mentor Me")
        .scrollIntoView()
        .should("be.visible")
        .click();

      cy.contains("h2", "Mentor Me").should("be.visible");
    });
  });

  describe("state", () => {
    it("starts fresh when the modal is opened again", () => {
      openModal();
      selectAudit();
      continueToRegistration();
      cy.get('input[name="name"]').type(visitor.name);

      cy.get('button[aria-label="Close Get Quick Wins modal"]').click();
      cy.contains("h2", "Register for your audit").should("not.exist");

      cy.contains("button", /^Get Quick Wins$/).click();
      cy.contains("h2", "Get Quick Wins").should("be.visible");

      selectAudit();
      continueToRegistration();

      cy.get('input[name="name"]').should("have.value", "");
    });
  });

  describe("analytics", () => {
    it("reports each step of the journey as it happens", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectAudit();
      continueToRegistration();
      register();
      cy.contains("Step 3 of 5 · Section 1 of 3").should("be.visible");
      completeQuestions(allTwos);
      cy.contains("button", /^Next$/).click();

      cy.wrap(events).should("include", "ownership_audit.selected");
      cy.wrap(events).should("include", "ownership_audit.started");
      cy.wrap(events).should("include", "ownership_audit.registration_completed");
      cy.wrap(events).should("include", "ownership_audit.answer_selected");
      cy.wrap(events).should("include", "ownership_audit.completed");
      cy.wrap(events).should("include", "ownership_audit.results_viewed");
      cy.wrap(events).should("include", "ownership_audit.next_steps_viewed");
    });

    // Needs VITE_ANALYTICS_URL, so the page registers a visitor (stubbed above)
    // and sends events to the analytics service (also stubbed).
    it("sends the events to the analytics service without personal data", () => {
      type RecordedCall = { request: { body: Record<string, unknown> } };

      const read = (body: Record<string, unknown>, camel: string, snake: string) =>
        body[camel] ?? body[snake];

      openModal();
      selectAudit();
      continueToRegistration();
      register();
      cy.contains("Step 3 of 5 · Section 1 of 3").should("be.visible");

      cy.get("@trackEvent.all").should((calls) => {
        const names = (calls as unknown as RecordedCall[]).map((call) =>
          read(call.request.body, "eventName", "event_name"),
        );

        expect(names).to.include("get_quick_wins.opened");
        expect(names).to.include("ownership_audit.selected");
        expect(names).to.include("ownership_audit.registration_completed");
      });

      cy.get("@trackEvent.all").then((calls) => {
        const recorded = calls as unknown as RecordedCall[];

        const opened = recorded.find(
          (call) =>
            read(call.request.body, "eventName", "event_name") ===
            "get_quick_wins.opened",
        );

        expect(opened, "get_quick_wins.opened request").to.exist;
        expect(read(opened!.request.body, "eventType", "event_type")).to.equal(
          "click",
        );
        expect(read(opened!.request.body, "visitorId", "visitor_id")).to.equal(
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