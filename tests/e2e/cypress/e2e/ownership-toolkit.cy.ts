
describe("Ownership Toolkit — end-to-end flow", () => {
  const visitor = {
    name: "E2E Tester",
    email: "e2e-toolkit@example.com",
  };

  const pdfPath = "/downloads/technology-ownership-toolkit.pdf";
  const pdfFileName = "Technology-Ownership-Toolkit.pdf";

  const parts = [
    {
      title: "Part 1: Know what you own",
      tools: [
        "Domain and DNS checklist",
        "Hosting and cloud checklist",
        "Source code checklist",
      ],
    },
    {
      title: "Part 2: Stay in control of access and providers",
      tools: [
        "Critical accounts register",
        "Handover pack template",
        "Provider exit plan",
      ],
    },
    {
      title: "Part 3: Keep running and recover",
      tools: [
        "Backup and recovery checklist",
        "Renewals and costs calendar",
        "Maintenance and incident plan",
      ],
    },
  ];

  function openModal() {
    cy.visit("/");

    cy.contains("button", /^Get Quick Wins$/)
      .should("be.visible")
      .click();

    cy.contains("h2", "Get Quick Wins").should("be.visible");
  }

  function selectToolkit() {
    cy.get('button[aria-label^="Technology Ownership Toolkit:"]')
      .should("be.visible")
      .click();

    cy.contains("h2", "Why the Technology Ownership Toolkit?").should(
      "be.visible",
    );
  }

  function continueToDetails() {
    cy.contains("button", "Continue to your details")
      .scrollIntoView()
      .should("be.visible")
      .click();

    cy.contains("h2", "Your details").should("be.visible");
  }

  function submitDetails() {
    cy.get('input[name="name"]').type(visitor.name);
    cy.get('input[name="email"]').type(visitor.email);
    cy.contains("button", "Open my toolkit").click();
  }

  function reachToolkit() {
    openModal();
    selectToolkit();
    continueToDetails();
    submitDetails();

    cy.contains("h2", "Your Technology Ownership Toolkit").should(
      "be.visible",
    );
  }

  describe("choosing the toolkit", () => {
    it("offers the toolkit next to the audit", () => {
      openModal();

      cy.get('button[aria-label^="Technology Ownership Audit:"]').should(
        "be.visible",
      );

      cy.get('button[aria-label^="Technology Ownership Toolkit:"]').should(
        "be.visible",
      );
    });

    it("keeps the audit working alongside it", () => {
      openModal();
      selectToolkit();

      cy.contains("button", /^Back$/).scrollIntoView().click();

      cy.get('button[aria-label^="Technology Ownership Audit:"]').click();

      cy.contains("h2", "About the Technology Ownership Audit").should(
        "be.visible",
      );

      cy.contains("Step 1 of 5").should("be.visible");
    });
  });

  describe("step 1: why the toolkit", () => {
    it("explains what the toolkit is, why to use it, what is inside and who it is for", () => {
      openModal();
      selectToolkit();

      cy.contains("Step 1 of 3").should("be.visible");

      [
        "What is the Toolkit?",
        "Why use it?",
        "What is inside?",
        "Who is it for?",
      ].forEach((heading) => {
        cy.contains("h3", heading)
          .scrollIntoView()
          .should("be.visible");
      });
    });

    it("lists every part and tool", () => {
      openModal();
      selectToolkit();

      parts.forEach((part) => {
        cy.contains("h4", part.title)
          .scrollIntoView()
          .should("be.visible");

        part.tools.forEach((tool) => {
          cy.contains("li", tool).should("exist");
        });
      });
    });

    it("goes back to the options", () => {
      openModal();
      selectToolkit();

      cy.contains("button", /^Back$/).scrollIntoView().click();

      cy.contains("h2", "Get Quick Wins").should("be.visible");

      cy.get('button[aria-label^="Technology Ownership Toolkit:"]').should(
        "be.visible",
      );
    });
  });

  describe("step 2: your details", () => {
    it("shows the details form", () => {
      openModal();
      selectToolkit();
      continueToDetails();

      cy.contains("Step 2 of 3").should("be.visible");

      cy.get('input[name="name"]').should("be.visible");
      cy.get('input[name="email"]').should("be.visible");
      cy.get('input[name="organisation"]').should("be.visible");
    });

    it("keeps the toolkit closed until the details are valid, and focuses the first problem", () => {
      openModal();
      selectToolkit();
      continueToDetails();

      cy.contains("button", "Open my toolkit").click();

      cy.contains("Please enter your name using at least 2 characters.")
        .should("be.visible");

      cy.contains("Please enter a valid email address.")
        .should("be.visible");

      cy.get('input[name="name"]').should("have.focus");

      cy.contains("Step 2 of 3").should("be.visible");
      cy.contains("a", "Download PDF").should("not.exist");
    });

    it("rejects an invalid email address", () => {
      openModal();
      selectToolkit();
      continueToDetails();

      cy.get('input[name="name"]').type(visitor.name);
      cy.get('input[name="email"]').type("not-an-email");

      cy.contains("button", "Open my toolkit").click();

      cy.contains("Please enter a valid email address.")
        .should("be.visible");

      cy.contains("Please enter your name using at least 2 characters.")
        .should("not.exist");
    });

    it("goes back to step 1", () => {
      openModal();
      selectToolkit();
      continueToDetails();

      cy.contains("button", /^Previous$/).click();

      cy.contains("Step 1 of 3").should("be.visible");
    });
  });

  describe("step 3: the toolkit online", () => {
    it("shows the toolkit prepared for the visitor", () => {
      reachToolkit();

      cy.contains("Step 3 of 3").should("be.visible");

      cy.contains(`Prepared for ${visitor.name} · Version 1.0`)
        .should("be.visible");

      cy.contains("h3", "How to use this toolkit")
        .scrollIntoView()
        .should("be.visible");
    });

    it("goes back to the details with them kept", () => {
      reachToolkit();

      cy.contains("button", /^Previous$/)
        .scrollIntoView()
        .click();

      cy.contains("Step 2 of 3").should("be.visible");

      cy.get('input[name="name"]').should("have.value", visitor.name);
      cy.get('input[name="email"]').should("have.value", visitor.email);
    });

    it("closes from the Close button and starts fresh when reopened", () => {
      reachToolkit();

      cy.contains("button", /^Close$/)
        .scrollIntoView()
        .click();

      cy.contains("h2", "Your Technology Ownership Toolkit")
        .should("not.exist");

      cy.contains("button", /^Get Quick Wins$/).click();

      selectToolkit();
      continueToDetails();

      cy.get('input[name="name"]').should("have.value", "");
    });
  });

  describe("the PDF", () => {
    it("links to the generated file with a download name", () => {
      reachToolkit();

      cy.contains("a", "Download PDF")
        .should("have.attr", "href", pdfPath)
        .and("have.attr", "download", pdfFileName);
    });

    it("is served as a real PDF by the web app", () => {
      cy.request({
        url: pdfPath,
        encoding: "binary",
      }).then((response) => {
        expect(response.status).to.equal(200);

        expect(response.headers["content-type"]).to.include(
          "application/pdf",
        );

        expect(String(response.body).slice(0, 5)).to.equal("%PDF-");

        expect(String(response.body).length).to.be.greaterThan(5000);
      });
    });

    it("downloads the file when the visitor clicks Download PDF", () => {
      reachToolkit();

      cy.contains("a", "Download PDF")
        .scrollIntoView()
        .click();

      cy.readFile(
        `${Cypress.config("downloadsFolder")}/${pdfFileName}`,
        null,
        { timeout: 15000 },
      ).should("have.length.greaterThan", 5000);
    });
  });
});

export {};
