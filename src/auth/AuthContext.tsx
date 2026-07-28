import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  authConfigurationError,
  getBrowserSupabaseClient,
} from "../services/supabaseAuth";
import { AuthContext } from "./authContextValue";

async function verifyAdminSession(session: Session): Promise<boolean> {
  const response = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) {
    return false;
  }

  const data: unknown = await response.json();
  return Boolean(
    data &&
      typeof data === "object" &&
      "is_admin" in data &&
      (data as { is_admin?: unknown }).is_admin === true,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getBrowserSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const verificationSequence = useRef(0);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let active = true;

    const applySession = async (nextSession: Session | null) => {
      const sequence = ++verificationSequence.current;
      setSession(nextSession);
      setIsAdmin(false);

      if (!nextSession) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const admin = await verifyAdminSession(nextSession).catch(() => false);

      if (active && sequence === verificationSequence.current) {
        setIsAdmin(admin);
        setIsLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(authConfigurationError || "Authentication is unavailable.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session) {
      throw new Error("The email address or password is incorrect.");
    }

    const admin = await verifyAdminSession(data.session);
    if (!admin) {
      await supabase.auth.signOut();
      throw new Error("This account is not authorized as an administrator.");
    }

    setSession(data.session);
    setIsAdmin(true);
    setIsLoading(false);
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setIsAdmin(false);
    setIsLoading(false);
  };

  const getAccessToken = async () => {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase.auth.getSession();
    return error ? null : data.session?.access_token ?? null;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        isLoading,
        configurationError: authConfigurationError,
        signIn,
        signOut,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
