
describe("Hero Left Section", () => {
  const WEB_BASE_URL = Cypress.env("webBaseUrl");

  beforeEach(() => {
    cy.visit(WEB_BASE_URL);
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

      cy.contains("p", "Websites and apps that are easy to use")
        .should("be.visible");

      cy.contains("p", "look great, and work fast.")
        .should("be.visible");

      cy.contains("p", "Get more customers with ease.")
        .should("be.visible");

      cy.contains("p", "No stress, no confusion")
        .should("be.visible");

      cy.contains("p", "reliable solutions that help you grow.")
        .should("be.visible");
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
      .and("have.prop", "tagName", "H1")
      .invoke("text")
      .then((text) => {
        expect(text.replace(/\s+/g, " ").trim()).to.equal(
          "Build Better Digital Experiences",
        );
      });
  });

  it("renders without horizontal overflow on mobile", () => {
    cy.viewport(375, 812);
    cy.visit(WEB_BASE_URL);

    cy.get("#hero", { timeout: 10000 }).should("be.visible");

    cy.document().then((document) => {
      const { documentElement, body } = document;
      const viewportWidth = documentElement.clientWidth;

      const overflowingElements = Array.from(
        body.querySelectorAll("*"),
      )
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);

          return {
            tag: element.tagName.toLowerCase(),
            id: element.id || "(no id)",
            className:
              typeof element.className === "string"
                ? element.className
                : "",
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
            overflowX: styles.overflowX,
            position: styles.position,
          };
        })
        .filter(
          (element) =>
            element.right > viewportWidth + 1 ||
            element.left < -1 ||
            element.scrollWidth > element.clientWidth + 1,
        );

      const diagnostics = JSON.stringify(
        {
          viewportWidth,
          documentScrollWidth: documentElement.scrollWidth,
          bodyScrollWidth: body.scrollWidth,
          overflowingElements,
        },
        null,
        2,
      );

      cy.log(
        `Mobile viewport: ${viewportWidth}px`,
      );

      cy.log(
        `Document scroll width: ${documentElement.scrollWidth}px`,
      );

      cy.log(
        `Body scroll width: ${body.scrollWidth}px`,
      );

      // Detailed diagnostic output in the browser console.
      console.group("Mobile Horizontal Overflow Diagnostics");

      console.log("Viewport width:", viewportWidth);
      console.log(
        "Document scroll width:",
        documentElement.scrollWidth,
      );
      console.log("Body scroll width:", body.scrollWidth);

      console.table(overflowingElements);

      console.groupEnd();

      expect(
        documentElement.scrollWidth,
        `Mobile horizontal overflow detected:\n${diagnostics}`,
      ).to.be.at.most(viewportWidth);

      expect(
        body.scrollWidth,
        `Body horizontal overflow detected:\n${diagnostics}`,
      ).to.be.at.most(body.clientWidth);
    });
  });

  it("renders without horizontal overflow on desktop", () => {
    cy.viewport(1440, 900);
    cy.visit(WEB_BASE_URL);

    cy.get("#hero").should("be.visible");

    cy.document().should((document) => {
      const { documentElement, body } = document;

      expect(
        documentElement.scrollWidth,
        "Document should not exceed desktop viewport width",
      ).to.be.at.most(documentElement.clientWidth);

      expect(
        body.scrollWidth,
        "Body should not exceed desktop viewport width",
      ).to.be.at.most(body.clientWidth);
    });
  });
});
