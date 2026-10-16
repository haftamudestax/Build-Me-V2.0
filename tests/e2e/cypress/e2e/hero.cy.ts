
describe("Hero Left Section", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("displays the complete hero content", () => {
    cy.get("#hero").should("be.visible");

    cy.contains("#hero", "TECHNOLOGY OWNERSHIP")
      .should("be.visible");

    cy.get("#hero h1")
      .should("be.visible")
      .and("contain.text", "Build Better")
      .and("contain.text", "Digital Experiences");

    cy.get("#hero h2")
      .should("be.visible")
      .and(
        "contain.text",
        "Simple, fast, and beautiful platforms that win and get real results",
      );

    cy.get("#hero p")
      .should("contain.text", "Websites and apps that are easy to use,")
      .and("contain.text", "look great, and work fast.")
      .and("contain.text", "Get more customers with ease.")
      .and("contain.text", "No stress, no confusion")
      .and("contain.text", "reliable solutions that help you grow.");
  });

  it("renders the blue heading emphasis", () => {
    cy.get("#hero h1")
      .find("span")
      .should("contain.text", "Digital Experiences")
      .and("have.css", "color", "rgb(23, 70, 181)");
  });

  it("has the expected accessible section label", () => {
    cy.get("#hero")
      .should("have.attr", "aria-labelledby", "hero-title");

    cy.get("#hero-title")
      .should("have.prop", "tagName", "H1")
      .and("contain.text", "Build Better Digital Experiences");
  });

  it("renders without horizontal overflow on mobile", () => {
    cy.viewport(375, 812);

    cy.get("#hero").should("be.visible");
    cy.get("#hero h1").should("be.visible");
    cy.get("#hero h2").should("be.visible");

    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(
        doc.documentElement.clientWidth,
      );
    });
  });

  it("renders without horizontal overflow on desktop", () => {
    cy.viewport(1440, 900);

    cy.get("#hero").should("be.visible");
    cy.get("#hero h1").should("be.visible");
    cy.get("#hero h2").should("be.visible");

    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(
        doc.documentElement.clientWidth,
      );
    });
  });
});
