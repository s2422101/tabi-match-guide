import { createContext } from "react";
import type { UserPreferences } from "../types/userPreferences";

export type UserPreferencesContextValue = {
  preferences: UserPreferences | null;
  isLoading: boolean;
  errorMessage: string | null;
  savePreferences: (preferences: UserPreferences) => Promise<void>;
  resetPreferences: () => Promise<void>;
  reloadPreferences: () => Promise<void>;
};

export const UserPreferencesContext =
  createContext<UserPreferencesContextValue | null>(null);
