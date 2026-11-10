
const VISITOR_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "33333333-3333-4333-8333-333333333333";
const REFERRAL_ID = "22222222-2222-4222-8222-222222222222";

const REFERRAL_DATA = {
  referrerName: "Alex Tester",
  referrerEmail: "alex@example.com",
  referredName: "Jordan Friend",
  referredEmail: "jordan@example.com",
  relationship: "friend",
  message: "Jordan would be a great addition to your network.",
};

const REFERRAL_API_PATH = "/api/referrals";
const VISITOR_API_PATH = "/api/visitors";

const REFERRAL_BUTTON =
  'button[aria-label="Give Referrals. Help others grow with us."]';

const CLOSE_BUTTON = 'button[aria-label="Close referral modal"]';

/**
 * Stubs visitor registration before the application loads.
 *
 * The pathname matcher works regardless of the analytics API
 * hostname or port.
 */
function stubVisitorConfiguration(): void {
  cy.intercept(
    {
      method: "POST",
      pathname: VISITOR_API_PATH,
    },
    {
      statusCode: 201,
      body: {
        visitor_id: VISITOR_ID,
        session_id: SESSION_ID,
      },
    },
  ).as("visitorSetup");
}

/**
 * Opens the referral modal after visitor registration completes.
 */
function openReferralModal(): void {
  cy.visit("/");

  // The referral form requires the visitor ID configured by main.tsx.
  cy.wait("@visitorSetup", { timeout: 10000 }).then(({ response }) => {
    expect(response?.statusCode).to.equal(201);
    expect(response?.body).to.deep.equal({
      visitor_id: VISITOR_ID,
      session_id: SESSION_ID,
    });
  });

  cy.get(REFERRAL_BUTTON)
    .should("be.visible")
    .scrollIntoView()
    .click();

  cy.contains("h2", "Refer Someone").should("be.visible");
}

/**
 * Completes the referrer's information step.
 */
function completeReferrerStep(): void {
  cy.get("#referrer-name")
    .should("be.visible")
    .clear()
    .type(REFERRAL_DATA.referrerName);

  cy.get("#referrer-email")
    .should("be.visible")
    .clear()
    .type(REFERRAL_DATA.referrerEmail);

  cy.contains("button", "Continue").click();

  cy.contains("h3", "Who are you referring?").should("be.visible");
}

/**
 * Completes the referred person's information step.
 */
function completeFriendStep(
  options: { message?: string } = {},
): void {
  cy.get("#referred-name")
    .should("be.visible")
    .clear()
    .type(REFERRAL_DATA.referredName);

  cy.get("#referred-email")
    .should("be.visible")
    .clear()
    .type(REFERRAL_DATA.referredEmail);

  cy.get("#relationship")
    .should("be.visible")
    .select(REFERRAL_DATA.relationship);

  if (options.message) {
    cy.get("#referral-message")
      .should("be.visible")
      .type(options.message);
  }

  cy.contains("button", "Review referral").click();

  cy.contains("h3", "Review your referral").should("be.visible");
}

/**
 * Stubs a successful referral API response and validates
 * the submitted payload.
 */
function interceptSuccessfulReferral(): void {
  cy.intercept(
    {
      method: "POST",
      pathname: REFERRAL_API_PATH,
    },
    (request) => {
      expect(request.body).to.include({
        visitorId: VISITOR_ID,
        referrerName: REFERRAL_DATA.referrerName,
        referrerEmail: REFERRAL_DATA.referrerEmail,
        referredName: REFERRAL_DATA.referredName,
        referredEmail: REFERRAL_DATA.referredEmail,
        relationship: REFERRAL_DATA.relationship,
      });

      expect(request.headers["idempotency-key"])
        .to.be.a("string")
        .and.have.length.greaterThan(0);

      request.reply({
        statusCode: 201,
        body: {
          data: {
            id: REFERRAL_ID,
            reference: REFERRAL_ID,
            status: "pending",
            createdAt: "2026-11-06T10:00:00.000Z",
          },
        },
      });
    },
  ).as("submitReferral");
}

/**
 * Submits the referral from the review step.
 */
function submitReferral(): void {
  cy.contains("button", "Submit referral")
    .should("be.visible")
    .and("not.be.disabled")
    .click();
}

describe("Referrals — end-to-end flow", () => {
  beforeEach(() => {
    // Register the intercept before cy.visit().
    stubVisitorConfiguration();
  });

  describe("Modal", () => {
    it("opens the referral modal from the footer", () => {
      openReferralModal();

      cy.get("#referrer-name").should("be.visible");
      cy.get("#referrer-email").should("be.visible");

      cy.contains("h3", "Your information").should("be.visible");
      cy.contains("Step 1 of 3").should("be.visible");
    });

    it("closes and resets the referral modal", () => {
      openReferralModal();

      cy.get("#referrer-name").type(REFERRAL_DATA.referrerName);
      cy.get("#referrer-email").type(REFERRAL_DATA.referrerEmail);

      cy.get(CLOSE_BUTTON)
        .should("be.visible")
        .click();

      cy.contains("h2", "Refer Someone").should("not.exist");

      cy.get(REFERRAL_BUTTON)
        .should("be.visible")
        .click();

      cy.get("#referrer-name")
        .should("be.visible")
        .and("have.value", "");

      cy.get("#referrer-email").should("have.value", "");
    });
  });

  describe("Referrer validation", () => {
    it("requires the referrer's name", () => {
      openReferralModal();

      cy.contains("button", "Continue").click();

      cy.contains("Please enter your full name.")
        .should("be.visible");
    });

    it("validates the referrer's email address", () => {
      openReferralModal();

      cy.get("#referrer-name").type(REFERRAL_DATA.referrerName);
      cy.get("#referrer-email").type("invalid-email");

      cy.contains("button", "Continue").click();

      cy.contains("Please enter a valid email address.")
        .should("be.visible");
    });

    it("allows the user to continue with valid referrer information", () => {
      openReferralModal();

      completeReferrerStep();

      cy.get("#referred-name").should("be.visible");
      cy.get("#referred-email").should("be.visible");
      cy.get("#relationship").should("be.visible");
    });
  });

  describe("Referred person validation", () => {
    beforeEach(() => {
      openReferralModal();
      completeReferrerStep();
    });

    it("requires the referred person's name", () => {
      cy.contains("button", "Review referral").click();

      cy.contains("Please enter the person's name.")
        .should("be.visible");
    });

    it("validates the referred person's email address", () => {
      cy.get("#referred-name").type(REFERRAL_DATA.referredName);
      cy.get("#referred-email").type("invalid-email");
      cy.get("#relationship").select("friend");

      cy.contains("button", "Review referral").click();

      cy.contains("Please enter a valid email address.")
        .should("be.visible");
    });

    it("requires a relationship selection", () => {
      cy.get("#referred-name").type(REFERRAL_DATA.referredName);
      cy.get("#referred-email").type(REFERRAL_DATA.referredEmail);

      cy.contains("button", "Review referral").click();

      cy.contains("Please select your relationship.")
        .should("be.visible");
    });

    it("does not allow a visitor to refer themselves", () => {
      cy.get("#referred-name").type(REFERRAL_DATA.referrerName);
      cy.get("#referred-email").type(REFERRAL_DATA.referrerEmail);
      cy.get("#relationship").select("friend");

      cy.contains("button", "Review referral").click();

      cy.contains("You cannot refer yourself.")
        .should("be.visible");
    });

    it("preserves referral details when navigating backwards from review", () => {
      completeFriendStep();

      cy.contains("button", "Back").click();

      cy.get("#referred-name")
        .should("have.value", REFERRAL_DATA.referredName);

      cy.get("#referred-email")
        .should("have.value", REFERRAL_DATA.referredEmail);

      cy.get("#relationship")
        .should("have.value", REFERRAL_DATA.relationship);

      cy.get("#referral-message")
        .should("have.value", "");

      cy.contains("button", "Review referral").click();

      cy.contains("h3", "Review your referral").should("be.visible");
    });
  });

  describe("Referral submission", () => {
    it("submits a referral and displays confirmation", () => {
      interceptSuccessfulReferral();

      openReferralModal();

      completeReferrerStep();
      completeFriendStep();

      submitReferral();

      cy.wait("@submitReferral").then(({ request, response }) => {
        expect(response?.statusCode).to.equal(201);
        expect(request.body.visitorId).to.equal(VISITOR_ID);

        expect(request.headers["idempotency-key"])
          .to.be.a("string")
          .and.have.length.greaterThan(0);
      });

      cy.contains("h3", "Referral submitted!")
        .should("be.visible");

      cy.contains(REFERRAL_ID).should("be.visible");

      cy.get('button[aria-label="Copy referral reference"]')
        .should("be.visible");

      cy.contains("button", "Done").should("be.visible");
    });

    it("submits an optional referral message", () => {
      interceptSuccessfulReferral();

      openReferralModal();

      completeReferrerStep();

      completeFriendStep({
        message: REFERRAL_DATA.message,
      });

      submitReferral();

      cy.wait("@submitReferral").then(({ request }) => {
        expect(request.body.message).to.equal(REFERRAL_DATA.message);
      });

      cy.contains("h3", "Referral submitted!")
        .should("be.visible");
    });

    it("omits an empty optional message from the request", () => {
      interceptSuccessfulReferral();

      openReferralModal();

      completeReferrerStep();
      completeFriendStep();

      submitReferral();

      cy.wait("@submitReferral").then(({ request }) => {
        expect(request.body).not.to.have.property("message");
      });

      cy.contains("h3", "Referral submitted!")
        .should("be.visible");
    });

    it("displays an error when the referral API fails", () => {
      cy.intercept(
        {
          method: "POST",
          pathname: REFERRAL_API_PATH,
        },
        {
          statusCode: 409,
          body: {
            error: "IDEMPOTENCY_KEY_REUSED",
          },
        },
      ).as("submitReferralFailure");

      openReferralModal();

      completeReferrerStep();
      completeFriendStep();

      submitReferral();

      cy.wait("@submitReferralFailure").then(({ response }) => {
        expect(response?.statusCode).to.equal(409);
      });

      cy.contains("IDEMPOTENCY_KEY_REUSED")
        .should("be.visible");

      cy.contains("h3", "Review your referral")
        .should("be.visible");

      cy.contains("button", "Submit referral")
        .should("be.visible");
    });
  });

  describe("Referral navigation", () => {
    it("allows the user to return from review and edit referral details", () => {
      openReferralModal();

      completeReferrerStep();
      completeFriendStep();

      cy.contains("button", "Back").click();

      cy.get("#referred-name")
        .should("have.value", REFERRAL_DATA.referredName);

      cy.get("#referred-email")
        .should("have.value", REFERRAL_DATA.referredEmail);

      cy.get("#relationship")
        .should("have.value", REFERRAL_DATA.relationship);

      cy.get("#referral-message")
        .clear()
        .type("Updated referral message.");

      cy.contains("button", "Review referral").click();

      cy.contains("h3", "Review your referral")
        .should("be.visible");

      cy.contains("Updated referral message.")
        .should("be.visible");
    });
  });
});
