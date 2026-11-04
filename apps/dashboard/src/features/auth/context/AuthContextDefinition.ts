
import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

import type { SignUpInput } from "../services/authService";
import type { AppRole, AppUserProfile } from "../types/auth";

export interface AuthContextValue {
  user: User | null;
  profile: AppUserProfile | null;
  role: AppRole | null;
  session: Session | null;
  loading: boolean;
  signUp: (input: SignUpInput) => ReturnType<
    typeof import("../services/authService").signUp
  >;
  signIn: (
    email: string,
    password: string,
  ) => ReturnType<typeof import("../services/authService").signIn>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  refreshProfile: () => Promise<AppUserProfile | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
