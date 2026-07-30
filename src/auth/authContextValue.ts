import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  configurationError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInAdmin: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
