const adminBaseUrl =
  (Cypress.env("adminBaseUrl") as string | undefined) ??
  "http://localhost:5174";

const adminUser = {
  id: "e2e-admin-user",
  aud: "authenticated",
  role: "authenticated",
  email: "admin@example.com",
  app_metadata: {
    provider: "email",
    providers: ["email"],
  },
  user_metadata: {},
  created_at: "2026-01-01T00:00:00.000Z",
};

const adminSession = {
  access_token: "e2e-access-token",
  refresh_token: "e2e-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: adminUser,
};

const adminProfile = {
  id: adminUser.id,
  email: adminUser.email,
  role: "admin",
};

function getSupabaseStorageKey(): string {
  const supabaseUrl = Cypress.env("supabaseUrl") as string | undefined;

  if (!supabaseUrl) {
    throw new Error(
      "Missing supabaseUrl in Cypress configuration. " +
        "Set VITE_SUPABASE_URL in the CI environment or in " +
        "apps/dashboard/.env.local, and expose it as Cypress env 'supabaseUrl'.",
    );
  }

  let projectRef: string;

  try {
    projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  } catch {
    throw new Error(
      `Invalid supabaseUrl: "${supabaseUrl}". Expected a valid Supabase project URL.`,
    );
  }

  if (!projectRef) {
    throw new Error("Could not determine the Supabase project reference.");
  }

  return `sb-${projectRef}-auth-token`;
}

describe("Admin dashboard layout", () => {
  beforeEach(() => {
    const storageKey = getSupabaseStorageKey();

    cy.intercept("GET", "**/auth/v1/user*", {
      statusCode: 200,
      body: adminUser,
    }).as("getAuthUser");

    cy.intercept("GET", "**/rest/v1/users*", {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: [adminProfile],
    }).as("getAdminProfile");

    cy.visit(`${adminBaseUrl}/dashboard`, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          storageKey,
          JSON.stringify(adminSession),
        );
      },
    });
  });

  it("renders the dashboard layout", () => {
    cy.contains("Build Me Admin").should("be.visible");
    cy.contains("Overview").should("be.visible");
    cy.contains("Dashboard").should("be.visible");
    cy.contains("Welcome to your Build Me dashboard.").should("be.visible");
  });

  it("shows the Overview navigation link", () => {
    cy.contains("Overview").should("be.visible").click();

    cy.location("pathname").should("eq", "/dashboard");
    cy.contains("Welcome to your Build Me dashboard.").should("be.visible");
  });

  it("shows the Users navigation link for an admin", () => {
    cy.contains("Users").should("be.visible");
  });

  it("displays the authenticated user's email and role", () => {
    cy.contains(adminUser.email).should("be.visible");
    cy.contains("admin").should("be.visible");
  });

  it("navigates to the Users page", () => {
    cy.contains("Users").should("be.visible").click();

    cy.location("pathname").should("eq", "/dashboard/users");
    cy.contains("User management").should("be.visible");
  });

  it("signs out and redirects to the login page", () => {
    cy.intercept("POST", "**/auth/v1/logout*", {
      statusCode: 204,
      body: "",
    }).as("signOut");

    cy.contains("Sign out").should("be.visible").click();

    cy.wait("@signOut");
    cy.location("pathname").should("eq", "/login");
  });
});
export {};
