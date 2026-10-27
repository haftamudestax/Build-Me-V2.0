
describe("Hero Right — End-to-End", () => {
  const expectedMetrics = [
    "99.9%",
    "System Reliability",
    "Faster",
    "Time to Market",
    "Lower",
    "Operational Costs",
    "Stronger",
    "Security & Trust",
  ];

  function expectVisibleImpactCard() {
    cy.get("#hero p:visible").then(($paragraphs) => {
      const visibleText = [...$paragraphs]
        .map((element) => element.textContent ?? "")
        .join(" ");

      expect(visibleText).to.include("My Impact in Action ↘");

      for (const metric of expectedMetrics) {
        expect(visibleText).to.include(metric);
      }
    });
  }

  beforeEach(() => {
   cy.visit(Cypress.env("webBaseUrl"));;
  });

  it("displays the profile image and impact card on desktop", () => {
    cy.viewport(1920, 1080);

    cy.get("#hero")
      .find('img[alt="Haftamu Desta"]')
      .should("be.visible");

    expectVisibleImpactCard();
  });

  it("displays the compact impact card on an iPad-sized viewport", () => {
    cy.viewport(1024, 1366);

    cy.get("#hero")
      .find('img[alt="Haftamu Desta"]')
      .should("be.visible");

    expectVisibleImpactCard();
  });

  it("displays the compact impact card on an iPhone 16 Pro-sized viewport", () => {
    cy.viewport(402, 874);

    cy.get("#hero")
      .find('img[alt="Haftamu Desta"]')
      .should("be.visible");

    expectVisibleImpactCard();
  });

  it("renders the impact heading with emerald styling", () => {
    cy.viewport(1920, 1080);

    cy.get("#hero p:visible")
      .filter((_, element) =>
        element.textContent?.includes("My Impact in Action"),
      )
      .should("have.length.greaterThan", 0)
      .each(($heading) => {
        cy.wrap($heading).should(
          "have.css",
          "color",
          "rgb(5, 150, 105)",
        );

        cy.wrap($heading).should(
          "have.css",
          "font-weight",
          "700",
        );
      });
  });
});
