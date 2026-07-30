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
import { getApiUrl } from "../services/apiUrl";

async function verifyAdminSession(session: Session): Promise<boolean> {
  const response = await fetch(getApiUrl("/api/auth/me"), {
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

function getSignInErrorMessage(message?: string): string {
  return message?.toLocaleLowerCase().includes("email not confirmed")
    ? "Please confirm your email address before logging in."
    : "The email address or password is incorrect.";
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
      throw new Error(getSignInErrorMessage(error?.message));
    }

    setSession(data.session);
    setIsLoading(true);
    const admin = await verifyAdminSession(data.session).catch(() => false);
    setIsAdmin(admin);
    setIsLoading(false);
  };

  const signInAdmin = async (email: string, password: string) => {
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

    const admin = await verifyAdminSession(data.session).catch(() => false);
    if (!admin) {
      await supabase.auth.signOut();
      setSession(null);
      setIsAdmin(false);
      setIsLoading(false);
      throw new Error("This account is not authorized as an administrator.");
    }

    setSession(data.session);
    setIsAdmin(true);
    setIsLoading(false);
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(authConfigurationError || "Authentication is unavailable.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/mypage`,
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || "Could not create the account.");
    }

    if (data.session) {
      setSession(data.session);
      setIsLoading(true);
      const admin = await verifyAdminSession(data.session).catch(() => false);
      setIsAdmin(admin);
      setIsLoading(false);
    }

    return { requiresEmailConfirmation: !data.session };
  };

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      setSession(null);
      setIsAdmin(false);
      setIsLoading(false);
    }
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
        signInAdmin,
        signUp,
        signOut,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
