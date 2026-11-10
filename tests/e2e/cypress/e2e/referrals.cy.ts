
const VISITOR_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "33333333-3333-4333-8333-333333333333";
const REFERRAL_ID = "22222222-2222-4222-8222-222222222222";

const REFERRAL_DATA = {
  referrerName: "Alex Tester",
  referrerEmail: "alex@example.com",
  referredName: "Jordan Friend",
  referredEmail: "jordan@example.com",
};

function registerVisitor() {
  cy.intercept("POST", "**/visitors", {
    statusCode: 201,
    body: {
      visitor_id: VISITOR_ID,
      session_id: SESSION_ID,
    },
  }).as("registerVisitor");
}

function openReferralModal() {
  cy.visit("/");

  cy.wait("@registerVisitor");

  cy.contains("button", "Refer Someone")
    .scrollIntoView()
    .should("be.visible")
    .click();

  cy.contains("h2", "Refer Someone").should("be.visible");
}

function completeReferrerStep() {
  cy.get("#referrer-name")
    .should("be.visible")
    .type(REFERRAL_DATA.referrerName);

  cy.get("#referrer-email")
    .type(REFERRAL_DATA.referrerEmail);

  cy.contains("button", "Continue").click();

  cy.contains("h2", "Who are you referring?").should("be.visible");
}

function completeFriendStep() {
  cy.get("#referred-name")
    .type(REFERRAL_DATA.referredName);

  cy.get("#referred-email")
    .type(REFERRAL_DATA.referredEmail);

  cy.get("#referral-relationship")
    .select("friend");

  cy.contains("button", "Review referral").click();

  cy.contains("h2", "Review your referral").should("be.visible");
}

describe("Referrals — end-to-end flow", () => {
  beforeEach(() => {
    registerVisitor();
  });

  it("opens the referral modal from the footer", () => {
    openReferralModal();

    cy.get("#referrer-name").should("be.visible");
    cy.get("#referrer-email").should("be.visible");
  });

  it("validates the referrer's required information", () => {
    openReferralModal();

    cy.contains("button", "Continue").click();

    cy.contains("Please enter your name.").should("be.visible");

    cy.get("#referrer-name").type("Alex Tester");

    cy.get("#referrer-email").type("invalid-email");

    cy.contains("button", "Continue").click();

    cy.contains("Please enter a valid email address.")
      .should("be.visible");
  });

  it("validates the referred person's information", () => {
    openReferralModal();

    completeReferrerStep();

    cy.contains("button", "Review referral").click();

    cy.contains("Please enter your friend's name.")
      .should("be.visible");
  });

  it("does not allow a visitor to refer themselves", () => {
    openReferralModal();

    completeReferrerStep();

    cy.get("#referred-name").type("Alex Tester");

    cy.get("#referred-email").type("alex@example.com");

    cy.get("#referral-relationship").select("friend");

    cy.contains("button", "Review referral").click();

    cy.contains("You cannot refer yourself.")
      .should("be.visible");
  });

  it("preserves referral details when navigating backwards", () => {
    openReferralModal();

    completeReferrerStep();
    completeFriendStep();

    cy.contains("button", "Back").click();

    cy.get("#referred-name")
      .should("have.value", REFERRAL_DATA.referredName);

    cy.get("#referred-email")
      .should("have.value", REFERRAL_DATA.referredEmail);
  });

  it("submits a referral and displays confirmation", () => {
    cy.intercept("POST", "**/api/referrals", (request) => {
      expect(request.body).to.include({
        visitorId: VISITOR_ID,
        referrerName: REFERRAL_DATA.referrerName,
        referrerEmail: REFERRAL_DATA.referrerEmail,
        referredName: REFERRAL_DATA.referredName,
        referredEmail: REFERRAL_DATA.referredEmail,
        relationship: "friend",
      });

      expect(request.headers["idempotency-key"]).to.be.a("string");

      expect(request.body.idempotencyKey).to.equal(
        request.headers["idempotency-key"],
      );

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
    }).as("submitReferral");

    openReferralModal();

    completeReferrerStep();
    completeFriendStep();

    cy.contains("button", "Submit referral").click();

    cy.wait("@submitReferral");

    cy.contains("h2", "Referral submitted")
      .should("be.visible");

    cy.contains(REFERRAL_ID).should("be.visible");

    cy.contains("button", "Copy reference")
      .should("be.visible");

    cy.contains("button", "Done").should("be.visible");
  });

  it("displays an error when the referral API fails", () => {
    cy.intercept("POST", "**/api/referrals", {
      statusCode: 409,
      body: {
        error: "IDEMPOTENCY_KEY_REUSED",
      },
    }).as("submitReferralFailure");

    openReferralModal();

    completeReferrerStep();
    completeFriendStep();

    cy.contains("button", "Submit referral").click();

    cy.wait("@submitReferralFailure");

    cy.contains("IDEMPOTENCY_KEY_REUSED")
      .should("be.visible");

    cy.contains("h2", "Review your referral")
      .should("be.visible");
  });

  it("closes and resets the referral modal", () => {
    openReferralModal();

    cy.get("#referrer-name").type("Alex Tester");

    cy.contains("button", "Cancel").click();

    cy.contains("button", "Refer Someone").click();

    cy.get("#referrer-name").should("have.value", "");
  });
});
