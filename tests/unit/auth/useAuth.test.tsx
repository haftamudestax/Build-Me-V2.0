import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { authMock, fromMock, serviceMock } = vi.hoisted(() => ({
  authMock: {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
  },
  fromMock: {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  },
  serviceMock: {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock("../../../apps/dashboard/src/lib/supabaseClient", () => ({
  supabase: {
    auth: authMock,
    from: vi.fn(() => fromMock),
  },
}));

vi.mock(
  "../../../apps/dashboard/src/features/auth/services/authService",
  () => serviceMock,
);

import { AuthProvider } from "../../../apps/dashboard/src/features/auth/context/AuthContext";
import { useAuth } from "../../../apps/dashboard/src/hooks/useAuth/useAuth";

function AuthConsumer() {
  const { user, profile, role, loading } = useAuth();

  return (
    <div>
      <output data-testid="user">{user?.id ?? "none"}</output>
      <output data-testid="profile">{profile?.id ?? "none"}</output>
      <output data-testid="role">{role ?? "none"}</output>
      <output data-testid="loading">{String(loading)}</output>
    </div>
  );
}

describe("useAuth", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws when used outside AuthProvider", () => {
    expect(() => render(<AuthConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider.",
    );
  });

  it("returns the auth context inside AuthProvider", async () => {
    authMock.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    authMock.getSession.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });

    fromMock.select.mockReturnValue(fromMock);
    fromMock.eq.mockReturnValue(fromMock);
    fromMock.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
      expect(screen.getByTestId("profile")).toHaveTextContent("none");
      expect(screen.getByTestId("role")).toHaveTextContent("none");
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(authMock.onAuthStateChange).toHaveBeenCalledOnce();
    expect(authMock.getSession).toHaveBeenCalledOnce();
  });
});
