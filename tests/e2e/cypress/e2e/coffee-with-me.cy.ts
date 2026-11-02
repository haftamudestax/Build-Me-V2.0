
describe("Work With Me — Coffee With Me E2E", () => {
  const visitorUrl = "**/api/visitors";
  const bookingUrl = "**/api/bookings";

  const visitorResponse = {
    visitor_id: "coffee-e2e-visitor-123",
    session_id: "coffee-e2e-session-123",
  };

  const bookingResponse = {
    data: {
      id: "coffee-booking-e2e-123",
      reference: "coffee-booking-e2e-123",
      bookingType: "coffee_with_me",
      status: "pending",
      createdAt: "2026-10-29T12:00:00.000Z",
    },
  };

  function registerVisitor(): void {
    cy.intercept("POST", visitorUrl, (req) => {
      Cypress.log({
        name: "Visitor registration",
        message: req.url,
      });

      req.reply({
        statusCode: 201,
        body: visitorResponse,
      });
    }).as("registerVisitor");
  }

  function verifyVisitorRegistration(): void {
    cy.wait("@registerVisitor", { timeout: 10000 }).then(
      ({ request, response }) => {
        expect(request.method).to.equal("POST");
        expect(request.url).to.include("/api/visitors");

        expect(response, "visitor registration response").to.exist;
        expect(response!.statusCode).to.equal(201);
        expect(response!.body).to.deep.equal(visitorResponse);
      },
    );
  }

  function openCoffeeWithMe(
    bookingAlias = "createBooking",
  ): void {
    registerVisitor();

    // Register booking intercept before visiting the application.
    if (bookingAlias === "successfulBooking") {
      cy.intercept("POST", bookingUrl, {
        statusCode: 201,
        body: bookingResponse,
      }).as("successfulBooking");
    } else if (bookingAlias === "failedBooking") {
      cy.intercept("POST", bookingUrl, {
        statusCode: 500,
        body: {
          error: "Booking service unavailable.",
        },
      }).as("failedBooking");
    } else {
      cy.intercept("POST", bookingUrl).as("createBooking");
    }

    cy.visit("/");

    cy.location("pathname").should("eq", "/");

    // Do not continue until the application has registered its visitor.
    verifyVisitorRegistration();

    cy.findByRole("button", { name: /work with me/i })
      .should("be.visible")
      .click();

    cy.findByRole("dialog")
      .should("be.visible")
      .within(() => {
        cy.findByRole("button", { name: /coffee with me/i })
          .should("be.visible")
          .click();
      });

    cy.findByRole("heading", { name: /coffee with me/i })
      .should("be.visible");

    cy.findByRole("textbox", { name: /full name/i })
      .should("be.visible");
  }

  function fillCoffeeWithMeForm(): void {
    const futureDate = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    futureDate.setSeconds(0, 0);
    futureDate.setMilliseconds(0);

    const localDateTime =
      [
        futureDate.getFullYear(),
        String(futureDate.getMonth() + 1).padStart(2, "0"),
        String(futureDate.getDate()).padStart(2, "0"),
      ].join("-") +
      "T" +
      String(futureDate.getHours()).padStart(2, "0") +
      ":" +
      String(futureDate.getMinutes()).padStart(2, "0");

    cy.findByRole("textbox", { name: /full name/i })
      .clear()
      .type("E2E Coffee Test");

    cy.findByRole("textbox", { name: /email address/i })
      .clear()
      .type("coffee.e2e@example.com");

    cy.findByLabelText(/preferred meeting date and time/i)
      .clear()
      .type(localDateTime);

    cy.findByRole("combobox", {
      name: /preferred meeting format/i,
    })
      .should("be.visible")
      .click();

    cy.findByRole("option", { name: /^online$/i })
      .should("be.visible")
      .click();

    cy.findByRole("textbox", {
      name: /what would you like to discuss/i,
    }).type("Discuss a potential collaboration.");
  }

  function submitBooking(): void {
    cy.findByRole("button", { name: /submit request/i })
      .scrollIntoView()
      .should("be.visible")
      .and("be.enabled")
      .click();
  }

  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it("opens the Coffee With Me form from the Work With Me modal", () => {
    openCoffeeWithMe("createBooking");

    cy.findByRole("textbox", { name: /full name/i })
      .should("be.visible");

    cy.findByRole("textbox", { name: /email address/i })
      .should("be.visible");

    cy.findByRole("combobox", {
      name: /preferred meeting format/i,
    }).should("exist");

    cy.findByRole("button", { name: /submit request/i })
      .scrollIntoView()
      .should("exist");
  });

  it("validates required fields before submitting", () => {
    openCoffeeWithMe("createBooking");

    submitBooking();

    cy.findByRole("alert")
      .should("be.visible")
      .and("contain.text", "Please enter your name");

    cy.get("@createBooking.all").should("have.length", 0);
  });

  it("submits a Coffee With Me booking and displays confirmation", () => {
    openCoffeeWithMe("successfulBooking");

    fillCoffeeWithMeForm();

    submitBooking();

    cy.wait("@successfulBooking").then(({ request, response }) => {
      expect(request.method).to.equal("POST");
      expect(request.url).to.include("/api/bookings");
      expect(response?.statusCode).to.equal(201);

      expect(request.headers).to.have.property("idempotency-key");

      expect(request.body).to.include({
        name: "E2E Coffee Test",
        email: "coffee.e2e@example.com",
        bookingType: "coffee_with_me",
        meetingDurationMinutes: 30,
      });

      expect(request.body.visitorId).to.equal(
        visitorResponse.visitor_id,
      );

      expect(request.body.visitorId)
        .to.be.a("string")
        .and.not.be.empty;

      expect(request.body.meetingStartAt).to.be.a("string");

      expect(
        Number.isNaN(Date.parse(request.body.meetingStartAt)),
      ).to.equal(false);

      expect(request.body.requestDetails).to.include({
        preferredFormat: "online",
      });

      expect(request.body.requestDetails.timezone)
        .to.be.a("string")
        .and.not.be.empty;

      expect(request.body.requestDetails.additionalContext).to.equal(
        "Discuss a potential collaboration.",
      );
    });

    cy.findByRole("dialog").should("be.visible");

    cy.contains("coffee-booking-e2e-123").should("be.visible");
  });

  it("displays an error when the booking API fails", () => {
    openCoffeeWithMe("failedBooking");

    fillCoffeeWithMeForm();

    submitBooking();

    cy.wait("@failedBooking").then(({ request, response }) => {
      expect(request.method).to.equal("POST");
      expect(request.url).to.include("/api/bookings");
      expect(response?.statusCode).to.equal(500);

      expect(request.body.visitorId).to.equal(
        visitorResponse.visitor_id,
      );
    });

    cy.findByRole("alert")
      .should("be.visible")
      .and("contain.text", "Booking service unavailable.");

    cy.findByRole("dialog").should("be.visible");
  });
});

export {};
