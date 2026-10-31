describe("Technology Ownership Audit — end-to-end flow", () => {
  // The modal's path cards are buttons labelled "<title>: <description>".
  const auditPathSelector =
    'button[aria-label^="Technology Ownership Audit:"]';

  function auditPathCard() {
    return cy.get(auditPathSelector);
  }

  // After Continue or Previous step, the modal's scroll position can leave the
  // step label above the fold. Cypress treats content clipped by a scrolling
  // ancestor as hidden, so scroll it into view before asserting.
  function expectStep(stepNumber: number) {
    cy.contains(`Step ${stepNumber} of 3`)
      .scrollIntoView()
      .should("be.visible");
  }

  const questionIdsByStep = [
    ["domain", "hosting", "source_code"],
    ["credentials", "documentation", "providers"],
    ["backups", "renewals", "maintenance"],
  ];

  const allTwos = Array<number>(9).fill(2);
  const allZeros = Array<number>(9).fill(0);

  function stubVisitorRegistration() {
    cy.intercept("POST", "**/api/visitors", {
      statusCode: 201,
      body: {
        visitor_id: "e2e-audit-visitor",
        session_id: "e2e-audit-session",
      },
    }).as("registerVisitor");
  }

  function openAudit() {
    cy.visit("/");

    cy.contains("button", /^Work With Me$/i)
      .should("be.visible")
      .click();

    // The fourth card can sit below the fold of the modal's scrolling list.
    auditPathCard()
      .scrollIntoView()
      .should("be.visible")
      .click();

    cy.contains("h2", "Technology Ownership Audit").should("be.visible");
    expectStep(1);
  }

  function answer(questionId: string, points: number) {
    cy.get(`input[name="${questionId}"][value="${points}"]`).check();
  }

  function answerStep(stepIndex: number, points: number[]) {
    questionIdsByStep[stepIndex].forEach((questionId, index) => {
      answer(questionId, points[index]);
    });
  }

  function completeAudit(points: number[]) {
    [0, 1, 2].forEach((stepIndex) => {
      answerStep(stepIndex, points.slice(stepIndex * 3, stepIndex * 3 + 3));

      cy.contains(
        "button",
        stepIndex === 2 ? "Calculate my score" : "Continue",
      ).click();
    });
  }

  function scoreElement(score: number) {
    return cy.get(`[aria-label="Score: ${score} out of 100"]`);
  }

  beforeEach(() => {
    stubVisitorRegistration();
  });

  it("opens the audit from Work With Me", () => {
    openAudit();

    cy.contains("Technology ownership").should("be.visible");
    cy.contains("Who controls your domain name?").should("be.visible");
    cy.get('input[type="radio"]').should("have.length", 9);
    cy.get('input[type="radio"]:checked').should("not.exist");
  });

  it("returns to the paths from step 1", () => {
    openAudit();

    cy.contains("button", "Back to paths").click();

    cy.contains("h2", "Work With Me").should("be.visible");
    auditPathCard().should("exist");
  });

  it("asks for every answer before continuing", () => {
    openAudit();

    cy.contains("button", "Continue").click();

    cy.get('[role="alert"]')
      .should("be.visible")
      .and("contain.text", "Please answer every question before continuing.");
    expectStep(1);

    // Two of three answered is still not enough.
    answer("domain", 2);
    answer("hosting", 1);
    cy.contains("button", "Continue").click();
    cy.get('[role="alert"]').should("be.visible");

    // The last answer lets the visitor continue.
    answer("source_code", 0);
    cy.contains("button", "Continue").click();

    expectStep(2);
    cy.contains("Access and independence")
      .scrollIntoView()
      .should("be.visible");
  });

  it("keeps answers when going back a step", () => {
    openAudit();

    answerStep(0, [2, 1, 0]);
    cy.contains("button", "Continue").click();
    expectStep(2);

    cy.contains("button", "Previous step").click();

    expectStep(1);
    cy.get('input[name="domain"][value="2"]').should("be.checked");
    cy.get('input[name="hosting"][value="1"]').should("be.checked");
    cy.get('input[name="source_code"][value="0"]').should("be.checked");
  });

  it("scores a fully owned setup as 100 and strong", () => {
    const events: string[] = [];

    openAudit();

    cy.window().then((win) => {
      win.addEventListener("build-me:analytics", (event) => {
        events.push((event as CustomEvent).detail.eventName);
      });
    });

    completeAudit(allTwos);

    cy.contains("h2", "Your Technology Ownership Score").should("be.visible");
    scoreElement(100).should("have.text", "100/100");
    cy.contains("h3", "Strong ownership foundations").should("be.visible");

    cy.contains("Review these controls regularly").should("be.visible");
    cy.contains("Verify backups and document how to restore").should(
      "not.exist",
    );
    cy.contains(
      "This is a self-assessment based on your answers, not a security audit or certification.",
    ).should("be.visible");

    cy.wrap(events).should("include", "ownership_audit.completed");
    cy.wrap(events).should("include", "ownership_audit.results_viewed");
  });

  it("scores a fully dependent setup as 0 and high risk", () => {
    openAudit();

    completeAudit(allZeros);

    scoreElement(0).should("have.text", "0/100");
    cy.contains("h3", "High dependency risk").should("be.visible");

    cy.contains("Review ownership and administrator access").should(
      "be.visible",
    );
    cy.contains("Document your technology setup").should("be.visible");
    cy.contains("Verify backups and document how to restore").should(
      "be.visible",
    );
  });

  it("scores a mixed setup as ownership gaps to address", () => {
    openAudit();

    // 10 of 18 points is 56/100.
    completeAudit([2, 2, 2, 2, 2, 0, 0, 0, 0]);

    scoreElement(56).should("have.text", "56/100");
    cy.contains("h3", "Ownership gaps to address").should("be.visible");
  });

  it("lets the visitor retake the audit with a clean form", () => {
    openAudit();

    completeAudit(allTwos);
    scoreElement(100).should("be.visible");

    cy.contains("button", "Retake audit").click();

    expectStep(1);
    cy.get('input[type="radio"]:checked').should("not.exist");

    completeAudit(allZeros);
    scoreElement(0).should("be.visible");
  });

  it("returns to Work With Me from the results", () => {
    openAudit();

    completeAudit(allTwos);
    cy.contains("button", "Back to Work With Me").click();

    cy.contains("h2", "Work With Me").should("be.visible");
    auditPathCard().should("exist");
  });
});

export {};