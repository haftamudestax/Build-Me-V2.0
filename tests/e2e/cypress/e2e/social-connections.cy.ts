
describe("Social Connections", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.get('section[aria-labelledby="social-connections-heading"]')
      .scrollIntoView()
      .should("be.visible");
  });

  it("displays the Follow Me heading", () => {
    cy.get("#social-connections-heading")
      .should("be.visible")
      .and("contain.text", "Follow Me");
  });

  it("renders all five social platforms", () => {
    const platforms = [
      "LinkedIn",
      "X",
      "Facebook",
      "Instagram",
    ];

    cy.get('section[aria-labelledby="social-connections-heading"]')
      .within(() => {
        platforms.forEach((platform) => {
          cy.get(`a[aria-label="${platform}"]`)
            .should("exist")
            .and("be.visible");
        });
      });
  });

  it("renders the correct number of social links", () => {
    cy.get('section[aria-labelledby="social-connections-heading"]')
      .find("a")
      .should("have.length", 4);
  });

  it("provides valid external link attributes", () => {
    cy.get('section[aria-labelledby="social-connections-heading"]')
      .find("a")
      .each(($link) => {
        cy.wrap($link)
          .should("have.attr", "href")
          .and("not.be.empty");

        cy.wrap($link)
          .should("have.attr", "target", "_blank");

        cy.wrap($link)
          .should("have.attr", "rel", "noopener noreferrer");
      });
  });

  it("provides accessible labels and titles", () => {
    cy.get('section[aria-labelledby="social-connections-heading"]')
      .find("a")
      .each(($link) => {
        const label = $link.attr("aria-label");

        expect(label).to.be.a("string").and.not.be.empty;

        cy.wrap($link).should("have.attr", "title", label);
      });
  });

  it("renders an SVG icon for every social platform", () => {
    cy.get('section[aria-labelledby="social-connections-heading"]')
      .find("a")
      .each(($link) => {
        cy.wrap($link)
          .find("svg")
          .should("exist")
          .and("have.attr", "aria-hidden", "true");
      });
  });

  it("applies circular styling to the social icons", () => {
    cy.get('section[aria-labelledby="social-connections-heading"]')
      .find("a")
      .each(($link) => {
        cy.wrap($link)
          .should("have.class", "h-10")
          .and("have.class", "w-10")
          .and("have.class", "rounded-full");
      });
  });

  it("displays the vertical divider on the right side", () => {
    cy.get('section[aria-labelledby="social-connections-heading"]')
      .should("have.class", "border-r")
      .and("have.class", "border-gray-200")
      .and("have.class", "pr-8");
  });

  it("keeps social connections visible alongside the Share button", () => {
    cy.get('section[aria-labelledby="social-connections-heading"]')
      .should("be.visible");

    cy.contains("button", "Share This Page")
      .should("be.visible");
  });

  it("keeps social connections available when the Share modal opens", () => {
    cy.contains("button", "Share This Page").click();

    cy.get('[role="dialog"]').should("be.visible");

    cy.get('section[aria-labelledby="social-connections-heading"]')
      .should("be.visible");

    cy.get('section[aria-labelledby="social-connections-heading"]')
      .find("a")
      .should("have.length", 5);
  });
});
