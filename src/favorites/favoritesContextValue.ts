import { createContext } from "react";

export type FavoritesContextValue = {
  favoriteIds: string[];
  favoriteCount: number;
  isFavorite: (restaurantId: string) => boolean;
  toggleFavorite: (restaurantId: string) => void;
};

export const FavoritesContext = createContext<FavoritesContextValue | null>(
  null,
);
