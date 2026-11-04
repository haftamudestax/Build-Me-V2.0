import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, fromMock, serviceMock } = vi.hoisted(() => {
  const auth = {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
  };

  const from = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };

  return {
    authMock: auth,
    fromMock: from,
    serviceMock: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      getCurrentUser: vi.fn(),
    },
  };
});

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

const user = {
  id: "user-1",
  email: "user@example.com",
};

const session = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 1_900_000_000,
  user,
};

function AuthStateDisplay() {
  const { user: currentUser, profile, role, loading } = useAuth();

  return (
    <div>
      <output data-testid="loading">{String(loading)}</output>
      <output data-testid="user-id">{currentUser?.id ?? "none"}</output>
      <output data-testid="profile-id">{profile?.id ?? "none"}</output>
      <output data-testid="role">{role ?? "none"}</output>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthStateDisplay />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  let authStateCallback:
    | ((event: string, currentSession: typeof session | null) => void)
    | undefined;

  beforeEach(() => {
    vi.clearAllMocks();

    authStateCallback = undefined;

    authMock.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    authMock.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    fromMock.select.mockReturnValue(fromMock);
    fromMock.eq.mockReturnValue(fromMock);
    fromMock.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    serviceMock.getCurrentUser.mockResolvedValue(user);
  });

  it("clears authentication state when there is no session", async () => {
    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("user-id")).toHaveTextContent("none");
    expect(screen.getByTestId("profile-id")).toHaveTextContent("none");
    expect(screen.getByTestId("role")).toHaveTextContent("none");
  });

  it("loads the authenticated user and their valid profile", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session },
      error: null,
    });

    fromMock.maybeSingle.mockResolvedValue({
      data: {
        id: user.id,
        email: user.email,
        role: "admin",
      },
      error: null,
    });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("user-1");
      expect(screen.getByTestId("profile-id")).toHaveTextContent("user-1");
      expect(screen.getByTestId("role")).toHaveTextContent("admin");
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(fromMock.select).toHaveBeenCalledWith("id, email, role");
    expect(fromMock.eq).toHaveBeenCalledWith("id", user.id);
  });

  it("does not assign an invalid application role", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session },
      error: null,
    });

    fromMock.maybeSingle.mockResolvedValue({
      data: {
        id: user.id,
        email: user.email,
        role: "unknown_role",
      },
      error: null,
    });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("user-1");
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("profile-id")).toHaveTextContent("none");
    expect(screen.getByTestId("role")).toHaveTextContent("none");
  });

  it("clears the user and profile after a signed-out auth event", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session },
      error: null,
    });

    fromMock.maybeSingle.mockResolvedValue({
      data: {
        id: user.id,
        email: user.email,
        role: "user",
      },
      error: null,
    });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("role")).toHaveTextContent("user");
    });

    await act(async () => {
      authStateCallback?.("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("none");
      expect(screen.getByTestId("profile-id")).toHaveTextContent("none");
      expect(screen.getByTestId("role")).toHaveTextContent("none");
    });
  });
});
