import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("../../../apps/dashboard/src/hooks/useAuth/useAuth", () => ({
  useAuth: useAuthMock,
}));

import { ProtectedRoute } from "../../../apps/dashboard/src/features/auth/components/ProtectedRoute";

function LoginPage() {
  const location = useLocation();
  const from = location.state?.from as { pathname?: string } | undefined;

  return (
    <div>
      <h1>Login page</h1>
      <output data-testid="redirect-from">{from?.pathname ?? ""}</output>
    </div>
  );
}

function renderProtectedRoute(
  auth: { user: unknown; loading: boolean },
  initialEntry = "/dashboard",
) {
  useAuthMock.mockReturnValue(auth);

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<h1>Dashboard content</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading indicator while the session is being checked", () => {
    renderProtectedRoute({ user: null, loading: true });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your session...",
    );
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Login page" }),
    ).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to login and preserves the requested route", () => {
    renderProtectedRoute({ user: null, loading: false });

    expect(
      screen.getByRole("heading", { name: "Login page" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("redirect-from")).toHaveTextContent("/dashboard");
  });

  it("renders protected content for an authenticated user", () => {
    renderProtectedRoute({
      user: { id: "user-1", email: "user@example.com" },
      loading: false,
    });

    expect(
      screen.getByRole("heading", { name: "Dashboard content" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Login page" }),
    ).not.toBeInTheDocument();
  });
});
