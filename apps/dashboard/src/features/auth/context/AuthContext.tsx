import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import {
  getCurrentUser,
  requestPasswordReset,
  signIn as signInService,
  signOut as signOutService,
  signUp as signUpService,
  updatePassword as updatePasswordService,
  type SignUpInput,
} from "../services/authService";
import { supabase } from "../../../lib/supabaseClient";
import type { AppRole, AppUserProfile } from "../types/auth";
import { AuthContext } from "./AuthContextDefinition";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] =
    useState<
      Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
    >(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error("[Auth] Failed to load application role:", error.message);
      setProfile(null);
      throw error;
    }

    if (!data) {
      setProfile(null);
      return null;
    }

    const validRoles: AppRole[] = ["user", "moderator", "admin", "super_admin"];

    if (!validRoles.includes(data.role as AppRole)) {
      console.error("[Auth] Database returned an unrecognized role.");
      setProfile(null);
      return null;
    }

    const nextProfile: AppUserProfile = {
      id: data.id,
      email: data.email,
      role: data.role as AppRole,
    };

    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    let mounted = true;
    let latestAuthEvent = 0;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      const eventId = ++latestAuthEvent;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Defer the profile query until after the synchronous auth callback.
      Promise.resolve().then(async () => {
        try {
          await loadProfile(nextSession.user);
        } catch {
          // Keep role-based access closed if the profile cannot be loaded.
        } finally {
          if (mounted && eventId === latestAuthEvent) {
            setLoading(false);
          }
        }
      });
    });

    void supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error("[Auth] Failed to restore session:", error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const currentSession = data.session;
        const currentUser = currentSession?.user ?? null;

        // An auth event may already have delivered a newer session.
        if (latestAuthEvent > 0) return;

        setSession(currentSession);
        setUser(currentUser);

        try {
          await loadProfile(currentUser);
        } catch {
          // Keep role-based access closed if the profile cannot be loaded.
        } finally {
          if (mounted && latestAuthEvent === 0) {
            setLoading(false);
          }
        }
      })
      .catch((error: unknown) => {
        if (!mounted) return;

        console.error("[Auth] Session restoration failed:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback((input: SignUpInput) => signUpService(input), []);

  const signIn = useCallback(
    (email: string, password: string) => signInService(email, password),
    [],
  );

  const signOut = useCallback(() => signOutService(), []);

  const resetPassword = useCallback(
    (email: string) => requestPasswordReset(email),
    [],
  );

  const updatePassword = useCallback(
    (password: string) => updatePasswordService(password),
    [],
  );

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    await loadProfile(currentUser);
    return currentUser;
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return loadProfile(currentUser);
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        requestPasswordReset: resetPassword,
        updatePassword,
        refreshUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
