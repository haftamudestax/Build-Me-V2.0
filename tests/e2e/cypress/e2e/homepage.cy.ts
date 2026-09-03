describe("Homepage", () => {
  it("loads successfully", () => {
    cy.visit("/");
    cy.get("body").should("be.visible");
  });
});