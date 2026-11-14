
describe("Get Quick Wins — end-to-end flow", () => {
  const visitor = {
    name: "E2E Tester",
    email: "e2e-tester@example.com",
  };

  const visitorId = "5b0d2a6e-2c0f-4b0e-9f0e-1c6f2d9a7b11";
  const sessionId = "9a3c1f52-7d4e-4f0a-8b6c-2e1d5a7c9f33";

  const questionIds = [
    "domain",
    "hosting",
    "source_code",
    "credentials",
    "documentation",
    "providers",
    "backups",
    "renewals",
    "maintenance",
  ];

  const allTwos = Array<number>(9).fill(2);
  const allZeros = Array<number>(9).fill(0);
  const mixed = [2, 2, 2, 2, 2, 0, 0, 0, 0];

  const paths = [
    {
      title: "Deliver My Project",
      selectedEvent: "delivery_project.selected",
    },
    {
      title: "Mentor Me",
      selectedEvent: "mentor_me.selected",
    },
    {
      title: "Coffee With Me",
      selectedEvent: "coffee_with_me.selected",
    },
  ];

  const toolkitTitle = "Technology Ownership Toolkit";

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

  function selectAudit() {
    cy.get('button[aria-label^="Technology Ownership Audit:"]')
      .should("be.visible")
      .click();

    cy.contains("h2", "About the Technology Ownership Audit")
      .should("be.visible");
  }

  function selectToolkit() {
    cy.get('button[aria-label^="Technology Ownership Toolkit:"]')
      .should("be.visible")
      .click();

    cy.contains("h2", "Why the Technology Ownership Toolkit?")
      .should("be.visible");
  }

  function selectLearningCircle() {
    cy.get(
      'button[aria-label^="Technology Ownership Learning Circle:"]',
    )
      .should("be.visible")
      .click();
  }

  function continueToRegistration() {
    cy.contains("button", "Continue to registration")
      .should("be.visible")
      .click();

    cy.contains("h2", "Register for your audit")
      .should("be.visible");
  }

  function register() {
    cy.get('input[name="name"]').type(visitor.name);
    cy.get('input[name="email"]').type(visitor.email);

    cy.contains("button", /^Next$/).click();
  }

  function answer(
    questionId: string,
    points: number,
    nextQuestionNumber?: number,
  ) {
    cy.get(`input[name="${questionId}"][value="${points}"]`)
      .should("exist")
      .check({ force: true });

    if (nextQuestionNumber !== undefined) {
      cy.contains(`Question ${nextQuestionNumber} of 9`)
        .should("be.visible");
    }
  }

  function answerAllQuestions(points: number[]) {
    if (points.length !== questionIds.length) {
      throw new Error(
        `Expected ${questionIds.length} answers, received ${points.length}.`,
      );
    }

    questionIds.forEach((questionId, index) => {
      answer(
        questionId,
        points[index],
        index < questionIds.length - 1
          ? index + 2
          : undefined,
      );
    });
  }

  function startQuestions() {
    openModal();
    selectAudit();
    continueToRegistration();
    register();

    cy.contains("Step 3 of 5 · Question 1/9")
      .should("be.visible");

    cy.contains("Question 1 of 9").should("be.visible");

    cy.get(`input[name="${questionIds[0]}"]`)
      .should("exist");
  }

  function completeQuestions(points: number[]) {
    answerAllQuestions(points);

    cy.contains("h2", "Your Technology Ownership Score")
      .should("be.visible");
  }

  function reachScore(points: number[]) {
    startQuestions();
    completeQuestions(points);
  }

  /**
   * Advances from the score screen to the next-steps screen.
   * Finds the modal's own visible Next button.
   */
  function clickScoreNext() {
    cy.contains("h2", "Your Technology Ownership Score")
      .should("be.visible")
      .scrollIntoView();

    cy.get("button:visible")
      .filter((_, button) => button.innerText.trim() === "Next")
      .last()
      .should("be.visible")
      .click();
  }

  function reachNextSteps(points: number[]) {
    reachScore(points);

    clickScoreNext();

    cy.contains("h2", "Your next steps")
      .should("be.visible");
  }

  function scoreElement(score: number) {
    return cy.get(`[aria-label="Score: ${score} out of 100"]`);
  }

  function expectRecommended(recommendedTitle: string) {
    paths.forEach(({ title }) => {
      cy.contains("h4", title)
        .parent()
        .then(($row) => {
          const rowText = $row.text();

          if (title === recommendedTitle) {
            expect(rowText).to.contain("Recommended for you");
          } else {
            expect(rowText).not.to.contain("Recommended for you");
          }
        });
    });
  }

  function captureEvents(events: string[]) {
    cy.window().then((win) => {
      win.addEventListener("build-me:analytics", (event) => {
        const customEvent = event as CustomEvent<{
          eventName?: string;
        }>;

        const eventName = customEvent.detail?.eventName;

        if (typeof eventName === "string") {
          events.push(eventName);
        }
      });
    });
  }

  function startToolkit() {
    openModal();
    selectToolkit();

    cy.contains("Step 1 of 3").should("be.visible");
  }

  function continueToToolkitDetails() {
    startToolkit();

    cy.contains("button", "Continue to your details")
      .should("be.visible")
      .click();

    cy.contains("h2", "Your details").should("be.visible");
    cy.contains("Step 2 of 3").should("be.visible");
  }

  function fillToolkitDetails() {
    cy.get('input[name="name"]').type(visitor.name);
    cy.get('input[name="email"]').type(visitor.email);
    cy.get('input[name="organisation"]').type("E2E Organisation");

    cy.contains("button", "Open my toolkit").click();
  }

  function reachToolkitContent() {
    continueToToolkitDetails();
    fillToolkitDetails();

    cy.contains("Step 3 of 3").should("be.visible");
    cy.contains(toolkitTitle).should("be.visible");
  }

  beforeEach(() => {
    stubAnalytics();
  });

  describe("opening and options", () => {
    it("opens the modal from the Get Quick Wins button", () => {
      openModal();

      cy.get('button[aria-label^="Technology Ownership Audit:"]')
        .should("be.visible");

      cy.get('button[aria-label^="Technology Ownership Toolkit:"]')
        .should("be.visible");

      cy.get(
        'button[aria-label^="Technology Ownership Learning Circle:"]',
      ).should("be.visible");
    });

    it("closes from the close button", () => {
      openModal();

      cy.get('button[aria-label="Close Get Quick Wins modal"]')
        .click();

      cy.contains("h2", "Get Quick Wins").should("not.exist");
    });

    it("starts with all three options available", () => {
      openModal();

      cy.contains("Technology Ownership Audit").should("be.visible");
      cy.contains("Technology Ownership Toolkit").should("be.visible");
      cy.contains("Technology Ownership Learning Circle")
        .should("be.visible");
    });

    it("opens the Technology Ownership Audit introduction", () => {
      openModal();
      selectAudit();

      cy.contains("Step 1 of 5").should("be.visible");
    });

    it("opens the Technology Ownership Toolkit introduction", () => {
      openModal();
      selectToolkit();

      cy.contains("Step 1 of 3").should("be.visible");
      cy.contains("h3", "What is the Toolkit?").should("be.visible");
      cy.contains("h3", "Why use it?").should("be.visible");
      cy.contains("h3", "Who is it for?").should("be.visible");
    });

    it("opens the Learning Circle option", () => {
      openModal();
      selectLearningCircle();

      cy.contains("h2", "Get Quick Wins").should("not.exist");
    });
  });

  describe("Technology Ownership Audit — step 1", () => {
    it("explains what the audit is, why to do it and the benefits", () => {
      openModal();
      selectAudit();

      cy.contains("Step 1 of 5").should("be.visible");

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

      cy.get('button[aria-label^="Technology Ownership Audit:"]')
        .should("be.visible");
    });
  });

  describe("Technology Ownership Audit — step 2: registration", () => {
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

      cy.contains(
        "Please enter your name using at least 2 characters.",
      ).should("be.visible");

      cy.contains("Please enter a valid email address.")
        .should("be.visible");

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

      cy.contains("Please enter a valid email address.")
        .should("be.visible");

      cy.contains(
        "Please enter your name using at least 2 characters.",
      ).should("not.exist");
    });

    it("goes back to the introduction", () => {
      openModal();
      selectAudit();
      continueToRegistration();

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 1 of 5").should("be.visible");
    });

    it("moves to the first question once registration is valid", () => {
      startQuestions();

      cy.contains("Step 3 of 5 · Question 1/9")
        .should("be.visible");

      cy.get('input[name="domain"]').should("exist");
      cy.get('input[name="hosting"]').should("not.exist");
    });
  });

  describe("Technology Ownership Audit — step 3: questions", () => {
    it("shows one question at a time and advances after an answer", () => {
      startQuestions();

      cy.contains("Question 1 of 9").should("be.visible");
      cy.get('input[name="domain"]').should("exist");
      cy.get('input[name="hosting"]').should("not.exist");

      answer("domain", 2, 2);

      cy.get('input[name="domain"]').should("not.exist");
      cy.get('input[name="hosting"]').should("exist");

      answer("hosting", 1, 3);

      cy.get('input[name="source_code"]').should("exist");
      cy.get('input[name="credentials"]').should("not.exist");

      answer("source_code", 0, 4);

      cy.get('input[name="credentials"]').should("exist");
      cy.contains("Question 4 of 9").should("be.visible");
    });

    it("goes back one question and keeps the previous answer", () => {
      startQuestions();

      answer("domain", 2, 2);
      answer("hosting", 1, 3);

      cy.contains("button", /^Previous$/).click();

      cy.contains("Question 2 of 9").should("be.visible");

      cy.get('input[name="hosting"][value="1"]')
        .should("be.checked");

      cy.contains("button", /^Previous$/).click();

      cy.contains("Question 1 of 9").should("be.visible");

      cy.get('input[name="domain"][value="2"]')
        .should("be.checked");
    });

    it("goes back to registration from the first question", () => {
      startQuestions();

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 2 of 5").should("be.visible");

      cy.get('input[name="name"]')
        .should("have.value", visitor.name);

      cy.get('input[name="email"]')
        .should("have.value", visitor.email);
    });

    it("moves directly to the score after the ninth answer", () => {
      startQuestions();

      questionIds.slice(0, 8).forEach((questionId, index) => {
        answer(questionId, 2, index + 2);
      });

      cy.contains("Question 9 of 9").should("be.visible");
      cy.get('input[name="maintenance"]').should("exist");

      answer("maintenance", 2);

      cy.contains("h2", "Your Technology Ownership Score")
        .should("be.visible");
    });
  });

  describe("Technology Ownership Audit — step 4: score", () => {
    it("shows the visitor's name and a perfect score", () => {
      reachScore(allTwos);

      cy.contains("Step 4 of 5").should("be.visible");

      cy.get('[data-testid="quick-wins-name"]')
        .should("have.text", visitor.name);

      scoreElement(100).should("have.text", "100/100");

      cy.get('[data-testid="quick-wins-band"]')
        .should("have.text", "Strong ownership foundations");

      cy.contains(
        "This is a self-assessment based on your answers, not a security audit or certification.",
      ).should("be.visible");
    });

    it("scores a fully dependent setup as 0 and high risk", () => {
      reachScore(allZeros);

      scoreElement(0).should("have.text", "0/100");

      cy.get('[data-testid="quick-wins-band"]')
        .should("have.text", "High dependency risk");
    });

    it("scores a mixed setup as ownership gaps to address", () => {
      reachScore(mixed);

      scoreElement(56).should("have.text", "56/100");

      cy.get('[data-testid="quick-wins-band"]')
        .should("have.text", "Ownership gaps to address");
    });

    it("goes back to the first question of the final audit section", () => {
      reachScore(allTwos);

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 3 of 5 · Question 7/9")
        .should("be.visible");

      cy.get('input[name="backups"][value="2"]')
        .should("be.checked");
    });

    it("recalculates the score after changing earlier answers", () => {
      reachScore(allTwos);

      scoreElement(100).should("be.visible");

      // Returning from the score opens question 7 (backups).
      cy.contains("button", /^Previous$/).click();

      cy.contains("Question 7 of 9").should("be.visible");

      // Change backups from 2 to 0.
      answer("backups", 0, 8);

      // Change renewals from 2 to 1 to trigger advancement.
      answer("renewals", 1, 9);

      // Change maintenance from 2 to 1.
      // The ninth answer finishes the audit immediately.
      answer("maintenance", 1);

      cy.contains("h2", "Your Technology Ownership Score")
        .should("be.visible");

      // New total: 14 out of 18 = 78 when rounded.
      scoreElement(78).should("have.text", "78/100");
    });
  });

  describe("Technology Ownership Audit — step 5: next steps", () => {
    it("describes a strong result and recommends Mentor Me", () => {
      reachNextSteps(allTwos);

      cy.contains("Step 5 of 5").should("be.visible");

      cy.contains(
        `${visitor.name}, you are in a strong position`,
      ).should("be.visible");

      expectRecommended("Mentor Me");
    });

    it("describes a mixed result and recommends Deliver My Project", () => {
      reachNextSteps(mixed);

      cy.contains(
        `${visitor.name}, you have important controls in place`,
      ).should("be.visible");

      expectRecommended("Deliver My Project");
    });

    it("describes a high-risk result and recommends Coffee With Me", () => {
      reachNextSteps(allZeros);

      cy.contains(
        `${visitor.name}, your setup may leave you dependent`,
      ).should("be.visible");

      expectRecommended("Coffee With Me");
    });

    it("offers a link to each of the three paths", () => {
      reachNextSteps(allZeros);

      paths.forEach(({ title }) => {
        cy.contains("button", `Go to ${title}`)
          .should("exist");
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

        cy.contains("h2", "Your next steps").should("not.exist");

        cy.contains("button", "All project paths")
          .should("be.visible");

        cy.wrap(events).should(
          "include",
          "ownership_audit.path_selected",
        );

        cy.wrap(events).should(
          "include",
          "get_quick_wins.closed",
        );

        cy.wrap(events).should("include", selectedEvent);
      });
    });

    it("shows the Mentor Me form when Mentor Me is chosen", () => {
      reachNextSteps(allTwos);

      cy.contains("button", "Go to Mentor Me")
        .should("be.visible")
        .click();

      // The Get Quick Wins link opens Work With Me
      // directly on the Mentor Me package-selection screen.
      cy.contains("h2", "Choose Your Package")
        .should("be.visible");

      cy.contains("button", "Code & Architecture Review")
        .should("be.visible")
        .click();

      // Verify the Mentor Me form.
      cy.contains("h2", "Mentor Me")
        .should("be.visible");

      cy.get('input[name="name"]')
        .should("be.visible");

      cy.get('input[name="email"]')
        .should("be.visible");

      cy.get('input[name="mentoringTopic"]')
        .should("be.visible");

      cy.get('textarea[name="goals"]')
        .scrollIntoView()
        .should("be.visible");

      cy.get('[name="experienceLevel"]')
        .should("exist")
        .and("have.value", "beginner");

      cy.get('[name="preferredFormat"]')
        .should("exist")
        .and("have.value", "online");

      cy.get('textarea[name="additionalContext"]')
        .should("be.visible");

      cy.contains("button", "Submit request")
        .should("be.visible");
    });
  });

  describe("Technology Ownership Toolkit — step 1: introduction", () => {
    it("explains what the toolkit is, why to use it and who it is for", () => {
      startToolkit();

      cy.contains("Step 1 of 3").should("be.visible");

      cy.contains("h3", "What is the Toolkit?")
        .scrollIntoView()
        .should("be.visible");

      cy.contains("h3", "Why use it?")
        .scrollIntoView()
        .should("be.visible");

      cy.contains("h3", "Who is it for?")
        .scrollIntoView()
        .should("be.visible");

      cy.contains("button", "Continue to your details")
        .scrollIntoView()
        .should("be.visible");
    });

    it("returns to the options using Back", () => {
      startToolkit();

      cy.contains("button", /^Back$/).click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");

      cy.get('button[aria-label^="Technology Ownership Toolkit:"]')
        .should("be.visible");
    });

    it("moves to the details form", () => {
      continueToToolkitDetails();

      cy.get('input[name="name"]').should("be.visible");
      cy.get('input[name="email"]').should("be.visible");
      cy.get('input[name="organisation"]').should("be.visible");
    });
  });

  describe("Technology Ownership Toolkit — step 2: details", () => {
    it("shows validation errors when required fields are empty", () => {
      continueToToolkitDetails();

      cy.contains("button", "Open my toolkit").click();

      cy.contains(
        "Please enter your name using at least 2 characters.",
      ).should("be.visible");

      cy.contains("Please enter a valid email address.")
        .should("be.visible");

      cy.get('input[name="name"]').should("have.focus");

      cy.contains("Step 2 of 3").should("be.visible");
    });

    it("rejects an invalid email address", () => {
      continueToToolkitDetails();

      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type("not-an-email");

      cy.contains("button", "Open my toolkit").click();

      cy.contains("Please enter a valid email address.")
        .should("be.visible");

      cy.contains(
        "Please enter your name using at least 2 characters.",
      ).should("not.exist");
    });

    it("allows the organisation field to remain empty", () => {
      continueToToolkitDetails();

      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type(visitor.email);

      cy.contains("button", "Open my toolkit").click();

      cy.contains("Step 3 of 3").should("be.visible");
      cy.contains(toolkitTitle).should("be.visible");
    });

    it("goes back to the introduction", () => {
      continueToToolkitDetails();

      cy.get('input[name="name"]').type(visitor.name);

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 1 of 3").should("be.visible");

      cy.contains(
        "h2",
        "Why the Technology Ownership Toolkit?",
      ).should("be.visible");
    });

    it("preserves registration details when navigating backwards", () => {
      continueToToolkitDetails();

      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type(visitor.email);
      cy.get('input[name="organisation"]').type("E2E Organisation");

      cy.contains("button", /^Previous$/).click();

      cy.contains("button", "Continue to your details").click();

      cy.get('input[name="name"]')
        .should("have.value", visitor.name);

      cy.get('input[name="email"]')
        .should("have.value", visitor.email);

      cy.get('input[name="organisation"]')
        .should("have.value", "E2E Organisation");
    });
  });

  describe("Technology Ownership Toolkit — step 3: content", () => {
    it("opens the toolkit after valid registration", () => {
      reachToolkitContent();

      cy.contains("Step 3 of 3").should("be.visible");
      cy.contains(toolkitTitle).should("be.visible");
    });

    it("opens the toolkit with a valid name and email without requiring an organisation", () => {
      continueToToolkitDetails();

      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type(visitor.email);

      cy.contains("button", "Open my toolkit").click();

      cy.contains("Step 3 of 3").should("be.visible");
      cy.contains(toolkitTitle).should("be.visible");
    });
  });

  describe("state", () => {
    it("starts fresh when the modal is opened again", () => {
      openModal();
      selectAudit();
      continueToRegistration();

      cy.get('input[name="name"]').type(visitor.name);

      cy.get('button[aria-label="Close Get Quick Wins modal"]')
        .click();

      cy.contains("h2", "Register for your audit")
        .should("not.exist");

      cy.contains("button", /^Get Quick Wins$/).click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");

      selectAudit();
      continueToRegistration();

      cy.get('input[name="name"]').should("have.value", "");
    });

    it("resets the toolkit to its introduction when the modal is reopened", () => {
      reachToolkitContent();

      cy.get('button[aria-label="Close Get Quick Wins modal"]')
        .click();

      cy.contains(toolkitTitle).should("not.exist");

      cy.contains("button", /^Get Quick Wins$/).click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");

      selectToolkit();

      cy.contains("Step 1 of 3").should("be.visible");

      cy.contains(
        "h2",
        "Why the Technology Ownership Toolkit?",
      ).should("be.visible");
    });
  });

  describe("analytics", () => {
    it("reports each step of the audit journey as it happens", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectAudit();
      continueToRegistration();
      register();

      cy.contains("Step 3 of 5 · Question 1/9")
        .should("be.visible");

      completeQuestions(allTwos);

      clickScoreNext();

      cy.wrap(events).should(
        "include",
        "ownership_audit.selected",
      );

      cy.wrap(events).should(
        "include",
        "ownership_audit.started",
      );

      cy.wrap(events).should(
        "include",
        "ownership_audit.registration_completed",
      );

      cy.wrap(events).should(
        "include",
        "ownership_audit.answer_selected",
      );

      cy.wrap(events).should(
        "include",
        "ownership_audit.completed",
      );

      cy.wrap(events).should(
        "include",
        "ownership_audit.results_viewed",
      );

      cy.wrap(events).should(
        "include",
        "ownership_audit.next_steps_viewed",
      );
    });

    it("reports toolkit selection, start, registration and content view", () => {
      const events: string[] = [];

      openModal();
      captureEvents(events);

      selectToolkit();

      cy.contains("button", "Continue to your details").click();

      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type(visitor.email);

      cy.contains("button", "Open my toolkit").click();

      cy.contains(toolkitTitle).should("be.visible");

      cy.wrap(events).should(
        "include",
        "ownership_toolkit.selected",
      );

      cy.wrap(events).should(
        "include",
        "ownership_toolkit.started",
      );

      cy.wrap(events).should(
        "include",
        "ownership_toolkit.step_completed",
      );

      cy.wrap(events).should(
        "include",
        "ownership_toolkit.registration_completed",
      );

      cy.wrap(events).should(
        "include",
        "ownership_toolkit.content_viewed",
      );
    });

    it("reports toolkit validation failures", () => {
      const events: string[] = [];

      startToolkit();
      captureEvents(events);

      cy.contains("button", "Continue to your details").click();

      cy.contains("button", "Open my toolkit").click();

      cy.wrap(events).should(
        "include",
        "ownership_toolkit.validation_failed",
      );
    });

    it("reports when the toolkit is closed", () => {
      const events: string[] = [];

      startToolkit();
      captureEvents(events);

      cy.get('button[aria-label="Close Get Quick Wins modal"]')
        .click();

      cy.wrap(events).should(
        "include",
        "get_quick_wins.closed",
      );
    });
  });
});

export {};
