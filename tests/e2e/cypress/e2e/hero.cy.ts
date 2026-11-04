describe("Hero Left Section", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("webBaseUrl"));
  });

  it("displays the complete hero content", () => {
    cy.get("#hero").should("be.visible");

    cy.get("#hero").within(() => {
      cy.contains("TECHNOLOGY OWNERSHIP").should("be.visible");

      cy.get("#hero-title")
        .should("be.visible")
        .invoke("text")
        .then((text) => {
          const normalizedText = text.replace(/\s+/g, " ").trim();

          expect(normalizedText).to.equal(
            "Build Better Digital Experiences",
          );
        });

      cy.get("h2")
        .should("be.visible")
        .and(
          "contain.text",
          "Simple, fast, and beautiful platforms that win and get real results",
        );

      cy.contains("p", "Websites and apps that are easy to use").should(
        "be.visible",
      );

      cy.contains("p", "look great, and work fast.").should("be.visible");
      cy.contains("p", "Get more customers with ease.").should("be.visible");
      cy.contains("p", "No stress, no confusion").should("be.visible");
      cy.contains("p", "reliable solutions that help you grow.").should(
        "be.visible",
      );
    });
  });

  it("renders the blue heading emphasis", () => {
    cy.get("#hero-title").should("be.visible");

    cy.get("#hero-title")
      .find("span")
      .should("be.visible")
      .and("contain.text", "Digital Experiences")
      .and("have.css", "color", "rgb(23, 70, 181)")
      .and("have.css", "display", "block");
  });

  it("has the expected accessible section label", () => {
    cy.get("#hero")
      .should("be.visible")
      .and("have.attr", "aria-labelledby", "hero-title");

    cy.get("#hero-title")
      .should("be.visible")
      .and("have.attr", "id", "hero-title")
      .invoke("text")
      .then((text) => {
        expect(text.replace(/\s+/g, " ").trim()).to.equal(
          "Build Better Digital Experiences",
        );
      });
  });

  it("renders without horizontal overflow on mobile", () => {
    cy.viewport(375, 812);

    cy.get("#hero", { timeout: 10000 }).should("be.visible");

    cy.document().should((document) => {
      const { documentElement, body } = document;

      expect(documentElement.scrollWidth).to.be.at.most(
        documentElement.clientWidth,
      );

      expect(body.scrollWidth).to.be.at.most(body.clientWidth);
    });
  });

  it("renders without horizontal overflow on desktop", () => {
    cy.viewport(1440, 900);

    cy.get("#hero").should("be.visible");

    cy.document().should((document) => {
      const { documentElement, body } = document;

      expect(documentElement.scrollWidth).to.be.at.most(
        documentElement.clientWidth,
      );

      expect(body.scrollWidth).to.be.at.most(body.clientWidth);
    });
  });
});
