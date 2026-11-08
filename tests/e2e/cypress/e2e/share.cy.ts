
describe("Share feature", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("displays the Share button in the footer", () => {
    cy.contains("button", "Share This Page")
      .should("be.visible");

    cy.contains("Spread value. Inspire others.")
      .should("be.visible");
  });

  it("opens the share modal", () => {
    cy.contains("button", "Share This Page").click();

    cy.get('[role="dialog"]')
      .should("be.visible")
      .and("contain.text", "Share this page");
  });

  it("displays all supported sharing channels", () => {
    cy.contains("button", "Share This Page").click();

    cy.get('[role="dialog"]').within(() => {
      cy.get('a[aria-label="Share on X"]')
        .should("be.visible")
        .and("have.attr", "href")
        .and("include", "twitter.com/intent/tweet");

      cy.get('a[aria-label="Share on Facebook"]')
        .should("be.visible")
        .and("have.attr", "href")
        .and("include", "facebook.com/sharer/sharer.php");

      cy.get('a[aria-label="Share on LinkedIn"]')
        .should("be.visible")
        .and("have.attr", "href")
        .and("include", "linkedin.com/sharing/share-offsite");

      cy.get('a[aria-label="Share on WhatsApp"]')
        .should("be.visible")
        .and("have.attr", "href")
        .and("include", "wa.me");

      cy.get('a[aria-label="Share on Telegram"]')
        .should("be.visible")
        .and("have.attr", "href")
        .and("include", "t.me/share/url");
    });
  });

  it("closes the modal using the close button", () => {
    cy.contains("button", "Share This Page").click();

    cy.get('[role="dialog"]').should("be.visible");

    cy.get('[role="dialog"]')
      .find('button[aria-label="Close share dialog"]')
      .click();

    cy.get('[role="dialog"]').should("not.exist");
  });

  it("closes the modal when Escape is pressed", () => {
    cy.contains("button", "Share This Page").click();

    cy.get('[role="dialog"]').should("be.visible");

    cy.get("body").type("{esc}");

    cy.get('[role="dialog"]').should("not.exist");
  });

  it("closes the modal when the overlay is clicked", () => {
    cy.contains("button", "Share This Page").click();

    cy.get('[role="dialog"]').should("be.visible");

    cy.get('[role="dialog"]')
      .parent()
      .click(5, 5);

    cy.get('[role="dialog"]').should("not.exist");
  });
});
