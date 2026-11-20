
describe("About page — end-to-end flow", () => {
  beforeEach(() => {
    cy.visit("/about");
  });

  describe("page content", () => {
    it("loads the About page successfully", () => {
      cy.location("pathname").should("eq", "/about");

      cy.contains("h1", "Turning Ideas into Impact").should("be.visible");

      cy.contains("TECHNOLOGY OWNERSHIP").should("be.visible");
      cy.contains("ABOUT ME").should("be.visible");

      cy.contains("h2", "My Story").should("be.visible");
      cy.contains("h2", "Principles That Drive Me").should("be.visible");
      cy.contains("h2", "My Journey").should("be.visible");

      cy.contains("h2", "Ready to Create Something Great?").should(
        "be.visible",
      );
    });

    it("displays the professional portrait", () => {
      cy.get(
        'img[alt="Portrait of an electrical engineer and full-stack developer"]',
      )
        .should("be.visible")
        .and("have.attr", "src", "/images/haftamu_d.jpg");
    });

    it("displays all six professional principles", () => {
      const principles = [
        "User-Centered Approach",
        "Code Quality & Security",
        "Performance & Efficiency",
        "Attention to Detail",
        "Modern Technology",
        "Problem Solving",
      ];

      principles.forEach((principle) => {
        cy.contains("h3", principle).should("be.visible");
      });
    });

    it("displays all seven professional milestones", () => {
      const milestones = [
        "2012",
        "2013",
        "2015",
        "2022",
        "2023",
        "2024",
        "2026",
      ];

      milestones.forEach((year) => {
        cy.contains(year).should("exist");
      });

      cy.contains(
        "h3",
        "Bachelor's Degree — Electrical Engineering",
      ).should("exist");

      cy.contains("h3", "Resident Engineer — EEP").should("exist");
    });
  });

  describe("navigation", () => {
    it("navigates back to Home", () => {
      cy.findByRole("link", { name: "Back to Home" }).click();

      cy.location("pathname").should("eq", "/");
    });

    it("navigates to the work section", () => {
      cy.findByRole("link", { name: "View My Work" }).click();

      cy.location("pathname").should("eq", "/");
      cy.location("hash").should("eq", "#main-works");
    });

    it("provides a secure resume link", () => {
      cy.findByRole("link", { name: "View Resume" })
        .should("have.attr", "href", "/pdf/Resume.pdf")
        .and("have.attr", "target", "_blank")
        .and("have.attr", "rel", "noopener noreferrer");
    });
  });

  
describe("Work With Me actions", () => {
  it("dispatches the Coffee With Me action", () => {
    let receivedEvent: CustomEvent | undefined;

    cy.window().then((win) => {
      win.addEventListener(
        "build-me:open-work-with-me",
        (event) => {
          receivedEvent = event as CustomEvent;
        },
        { once: true },
      );
    });

    // Cypress executes the click after registering the listener.
    cy.findByRole("button", { name: "Get in Touch" }).click();

    // Assert after the click has completed.
    cy.then(() => {
      expect(receivedEvent, "Coffee With Me custom event").to.exist;
      expect(receivedEvent?.type).to.equal("build-me:open-work-with-me");
      expect(receivedEvent?.detail).to.deep.equal({ path: "coffee" });
    });
  });

  it("dispatches the Delivery Project action", () => {
    let receivedEvent: CustomEvent | undefined;

    cy.window().then((win) => {
      win.addEventListener(
        "build-me:open-work-with-me",
        (event) => {
          receivedEvent = event as CustomEvent;
        },
        { once: true },
      );
    });

    // Cypress executes the click after registering the listener.
    cy.findByRole("button", { name: "Work With Me" }).click();

    // Assert after the click has completed.
    cy.then(() => {
      expect(receivedEvent, "Delivery Project custom event").to.exist;
      expect(receivedEvent?.type).to.equal("build-me:open-work-with-me");
      expect(receivedEvent?.detail).to.deep.equal({ path: "delivery" });
    });
  });
});


  describe("responsive layout", () => {
    it("renders the About page on a mobile viewport", () => {
      cy.viewport(375, 812);

      cy.contains("h1", "Turning Ideas into Impact").should("be.visible");

      cy.contains("h2", "My Story").should("be.visible");
      cy.contains("h2", "Principles That Drive Me").should("be.visible");
      cy.contains("h2", "My Journey").should("be.visible");

      cy.findByRole("button", { name: "Get in Touch" }).should("be.visible");
      cy.findByRole("button", { name: "Work With Me" }).should("be.visible");
    });

    it("renders the About page on a desktop viewport", () => {
      cy.viewport(1440, 900);

      cy.contains("h1", "Turning Ideas into Impact").should("be.visible");

      cy.get(
        'img[alt="Portrait of an electrical engineer and full-stack developer"]',
      ).should("be.visible");

      cy.contains("h2", "My Journey").should("be.visible");
    });
  });
});
