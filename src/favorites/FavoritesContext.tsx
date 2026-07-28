import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FavoritesContext } from "./favoritesContextValue";
import {
  FAVORITES_STORAGE_KEY,
  readFavoriteRestaurantIds,
  writeFavoriteRestaurantIds,
} from "./favoritesStorage";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteRestaurantIds);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY || event.key === null) {
        setFavoriteIds(readFavoriteRestaurantIds());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const isFavorite = useCallback(
    (restaurantId: string) => favoriteIdSet.has(restaurantId),
    [favoriteIdSet],
  );
  const toggleFavorite = useCallback((restaurantId: string) => {
    setFavoriteIds((currentIds) => {
      const nextIds = currentIds.includes(restaurantId)
        ? currentIds.filter((id) => id !== restaurantId)
        : [...currentIds, restaurantId];
      writeFavoriteRestaurantIds(nextIds);
      return nextIds;
    });
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoriteCount: favoriteIds.length,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
