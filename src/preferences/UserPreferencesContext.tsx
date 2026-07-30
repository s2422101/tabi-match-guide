import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/useAuth";
import {
  deleteUserPreferences,
  fetchUserPreferences,
  saveUserPreferences as savePreferencesToSupabase,
} from "../services/userData";
import type { UserPreferences } from "../types/userPreferences";
import { UserPreferencesContext } from "./userPreferencesContextValue";

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadPreferences = useCallback(async () => {
    if (!userId) {
      setPreferences(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      setPreferences(await fetchUserPreferences());
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load preferences.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reloadPreferences();
  }, [reloadPreferences]);

  const savePreferences = useCallback(
    async (nextPreferences: UserPreferences) => {
      if (!userId) {
        throw new Error("Please log in to save preferences.");
      }
      setErrorMessage(null);
      const saved = await savePreferencesToSupabase(nextPreferences);
      setPreferences(saved);
    },
    [userId],
  );

  const resetPreferences = useCallback(async () => {
    if (!userId) {
      throw new Error("Please log in to reset preferences.");
    }
    setErrorMessage(null);
    await deleteUserPreferences();
    setPreferences(null);
  }, [userId]);

  const value = useMemo(
    () => ({
      preferences,
      isLoading,
      errorMessage,
      savePreferences,
      resetPreferences,
      reloadPreferences,
    }),
    [
      errorMessage,
      isLoading,
      preferences,
      reloadPreferences,
      resetPreferences,
      savePreferences,
    ],
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}
