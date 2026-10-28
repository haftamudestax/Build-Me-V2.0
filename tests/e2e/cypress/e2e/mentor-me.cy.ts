describe("Mentor Me — end-to-end flow", () => {
  const bookingUrl = "**/api/bookings";
  const visitorUrl = "**/api/visitors";

  const validRequest = {
    name: "E2E Test User",
    email: "mentor-e2e@example.com",
    mentoringTopic: "Frontend architecture",
    goals: "Improve my frontend architecture and testing skills.",
  };

  const bookingReference = "MENTOR-E2E-001";
  const visitorId = "e2e-mentor-visitor";
  const sessionId = "e2e-mentor-session";

  function stubVisitorRegistration() {
    cy.intercept("POST", visitorUrl, {
      statusCode: 201,
      body: {
        visitor_id: visitorId,
        session_id: sessionId,
      },
    }).as("registerVisitor");
  }

  function openMentorMeForm() {
    cy.visit("/");

    // Visitor registration is optional when analytics is not configured.
    // Do not block the mentoring flow waiting for an analytics request.
    cy.get("body").should("be.visible");

    cy.contains("button", /^Work With Me$/i)
      .should("be.visible")
      .click();

    cy.get('button[aria-label^="Mentor Me:"]')
      .should("exist")
      .click({ scrollBehavior: "center" });

    cy.contains("h2", "Mentor Me").should("be.visible");

    cy.get('input[name="mentoringTopic"]').should("exist");
  }

  function fillValidRequest() {
    cy.get('input[name="name"]')
      .clear()
      .type(validRequest.name);

    cy.get('input[name="email"]')
      .clear()
      .type(validRequest.email);

    cy.get('input[name="mentoringTopic"]')
      .clear()
      .type(validRequest.mentoringTopic);

    cy.get('textarea[name="goals"]')
      .clear()
      .type(validRequest.goals);
  }

  function submitMentoringRequest() {
    cy.get('button[type="submit"]')
      .scrollIntoView({ offset: { top: -100, left: 0 } })
      .should("exist")
      .and("be.enabled")
      .click({ scrollBehavior: "center" });
  }

  function stubBookingSuccess() {
    cy.intercept("POST", bookingUrl, (req) => {
      expect(req.headers).to.have.property("idempotency-key");

      expect(req.body).to.include({
        visitorId,
        bookingType: "mentor_me",
        name: validRequest.name,
        email: validRequest.email,
      });

      expect(req.body.requestDetails).to.include({
        mentoringTopic: validRequest.mentoringTopic,
        goals: validRequest.goals,
        experienceLevel: "beginner",
        preferredFormat: "online",
      });

      req.reply({
        statusCode: 201,
        body: {
          data: {
            id: bookingReference,
            reference: bookingReference,
            bookingType: "mentor_me",
            status: "pending",
          },
        },
      });
    }).as("submitMentoringRequest");
  }

  beforeEach(() => {
    stubVisitorRegistration();
  });

  it("opens the Mentor Me form from Work With Me", () => {
    openMentorMeForm();

    cy.get('input[name="name"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="mentoringTopic"]').should("exist");
    cy.get('textarea[name="goals"]').should("exist");

    cy.get('button[type="submit"]')
      .scrollIntoView({ offset: { top: -100, left: 0 } })
      .should("exist")
      .and("contain.text", "Submit request");
  });

  it("validates required fields before submitting", () => {
    cy.intercept("POST", bookingUrl).as("submitMentoringRequest");

    openMentorMeForm();
    submitMentoringRequest();

    cy.get('[role="alert"]')
      .scrollIntoView({ offset: { top: -100, left: 0 } })
      .should("exist")
      .and(
        "contain.text",
        "Please enter your name using at least 2 characters.",
      );

    cy.get("@submitMentoringRequest.all").should("have.length", 0);
  });

  it("submits a mentoring request and displays the confirmation", () => {
    stubBookingSuccess();

    openMentorMeForm();
    fillValidRequest();
    submitMentoringRequest();

    cy.wait("@submitMentoringRequest").then(({ request }) => {
      expect(request.body.visitorId).to.equal(visitorId);
      expect(request.body.bookingType).to.equal("mentor_me");
    });

    cy.contains("h2", "Request submitted").should("be.visible");

    cy.contains(
      "Your mentoring request has been submitted. I'll review your goals and follow up.",
    ).should("be.visible");

    cy.contains(bookingReference).should("be.visible");
  });

  it("displays an error when the mentoring request fails", () => {
    cy.intercept("POST", bookingUrl, {
      statusCode: 500,
      body: {
        error: "Unable to submit mentoring request",
      },
    }).as("submitMentoringRequest");

    openMentorMeForm();
    fillValidRequest();
    submitMentoringRequest();

    cy.wait("@submitMentoringRequest");

    cy.get('[role="alert"]')
      .scrollIntoView({ offset: { top: -100, left: 0 } })
      .should("exist")
      .and("contain.text", "Unable to submit mentoring request");

    cy.contains("h2", "Mentor Me").should("be.visible");
  });

  it("returns to project path selection from the Mentor Me form", () => {
    openMentorMeForm();

    cy.contains("button", "All project paths")
      .scrollIntoView()
      .should("be.visible")
      .click();

    cy.contains("h2", "Work With Me").should("be.visible");

    cy.get('button[aria-label^="Mentor Me:"]')
      .should("exist");

    cy.contains("button", "Deliver My Project")
      .should("exist");
  });
});