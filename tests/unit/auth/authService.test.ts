
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
  },
}));

vi.mock("../../../apps/dashboard/src/lib/supabaseClient", () => ({
  supabase: {
    auth: authMock,
  },
}));

import {
  getCurrentUser,
  isAuthError,
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from "../../../apps/dashboard/src/features/auth/services/authService";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
  });

  describe("signUp", () => {
    it("normalizes the email and display name", async () => {
      authMock.signUp.mockResolvedValue({
        data: { user: { id: "user-1" }, session: null },
        error: null,
      });

      await signUp({
        email: "  PERSON@EXAMPLE.COM ",
        password: "Password123!",
        displayName: "  Example User  ",
      });

      expect(authMock.signUp).toHaveBeenCalledWith({
        email: "person@example.com",
        password: "Password123!",
        options: {
          data: {
            full_name: "Example User",
            display_name: "Example User",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    });

    it("returns the Supabase data object", async () => {
      const result = {
        data: { user: { id: "user-1" }, session: null },
        error: null,
      };

      authMock.signUp.mockResolvedValue(result);

      await expect(
        signUp({
          email: "user@example.com",
          password: "Password123!",
          displayName: "User",
        }),
      ).resolves.toEqual(result.data);
    });

    it("throws when Supabase returns an error", async () => {
      const error = new Error("Registration failed");

      authMock.signUp.mockResolvedValue({
        data: null,
        error,
      });

      await expect(
        signUp({
          email: "user@example.com",
          password: "Password123!",
          displayName: "User",
        }),
      ).rejects.toBe(error);
    });
  });

  describe("signIn", () => {
    it("normalizes email and returns the Supabase data object", async () => {
      const result = {
        data: {
          user: { id: "user-1" },
          session: null,
        },
        error: null,
      };

      authMock.signInWithPassword.mockResolvedValue(result);

      await expect(
        signIn(" USER@EXAMPLE.COM ", "Password123!"),
      ).resolves.toEqual(result.data);

      expect(authMock.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123!",
      });
    });

    it("propagates invalid-credential errors", async () => {
      const error = new Error("Invalid login credentials");

      authMock.signInWithPassword.mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error,
      });

      await expect(
        signIn("user@example.com", "wrong-password"),
      ).rejects.toBe(error);
    });
  });

  describe("signOut", () => {
    it("signs the user out successfully", async () => {
      authMock.signOut.mockResolvedValue({ error: null });

      await expect(signOut()).resolves.toBeUndefined();

      expect(authMock.signOut).toHaveBeenCalledOnce();
    });

    it("propagates sign-out errors", async () => {
      const error = new Error("Sign-out failed");

      authMock.signOut.mockResolvedValue({ error });

      await expect(signOut()).rejects.toBe(error);
    });
  });

  describe("requestPasswordReset", () => {
    it("normalizes email and uses the reset-password route", async () => {
      authMock.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      await requestPasswordReset(" USER@EXAMPLE.COM ");

      expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@example.com",
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        },
      );
    });

    it("propagates password-reset errors", async () => {
      const error = new Error("Reset request failed");

      authMock.resetPasswordForEmail.mockResolvedValue({ error });

      await expect(
        requestPasswordReset("user@example.com"),
      ).rejects.toBe(error);
    });
  });

  describe("updatePassword", () => {
    it("updates the current user's password", async () => {
      authMock.updateUser.mockResolvedValue({ error: null });

      await expect(
        updatePassword("NewPassword123!"),
      ).resolves.toBeUndefined();

      expect(authMock.updateUser).toHaveBeenCalledWith({
        password: "NewPassword123!",
      });
    });

    it("propagates password-update errors", async () => {
      const error = new Error("Password update failed");

      authMock.updateUser.mockResolvedValue({ error });

      await expect(
        updatePassword("NewPassword123!"),
      ).rejects.toBe(error);
    });
  });

  describe("getCurrentUser", () => {
    it("returns the current user", async () => {
      const user = {
        id: "user-1",
        email: "user@example.com",
      };

      authMock.getUser.mockResolvedValue({
        data: { user },
        error: null,
      });

      await expect(getCurrentUser()).resolves.toEqual(user);
    });

    it("propagates errors returned by Supabase", async () => {
      const error = new Error("Unable to retrieve user");

      authMock.getUser.mockResolvedValue({
        data: { user: null },
        error,
      });

      await expect(getCurrentUser()).rejects.toBe(error);
    });
  });

  describe("isAuthError", () => {
    it("recognizes an object with status and message", () => {
      expect(
        isAuthError({
          status: 401,
          message: "Unauthorized",
        }),
      ).toBe(true);
    });

    it("rejects null and unrelated values", () => {
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
      expect(isAuthError("Unauthorized")).toBe(false);
      expect(isAuthError({ message: "Missing status" })).toBe(false);
      expect(isAuthError({ status: 401 })).toBe(false);
    });
  });
});
