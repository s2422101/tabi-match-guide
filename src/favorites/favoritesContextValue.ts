import { createContext } from "react";

export type FavoritesContextValue = {
  favoriteIds: string[];
  favoriteCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  errorMessage: string | null;
  isFavorite: (restaurantId: string) => boolean;
  toggleFavorite: (restaurantId: string) => Promise<void>;
  clearError: () => void;
};

export const FavoritesContext = createContext<FavoritesContextValue | null>(
  null,
);
