import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/useAuth";
import {
  addUserFavorite,
  addUserFavorites,
  fetchUserFavoriteIds,
  removeUserFavorite,
} from "../services/userData";
import { FavoritesContext } from "./favoritesContextValue";
import {
  FAVORITES_STORAGE_KEY,
  markFavoritesMigrated,
  readFavoriteRestaurantIds,
  writeFavoriteRestaurantIds,
} from "./favoritesStorage";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteRestaurantIds);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!userId && (event.key === FAVORITES_STORAGE_KEY || event.key === null)) {
        setFavoriteIds(readFavoriteRestaurantIds());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [userId]);

  useEffect(() => {
    let active = true;

    if (!userId) {
      setFavoriteIds(readFavoriteRestaurantIds());
      setIsLoading(false);
      setIsSyncing(false);
      setErrorMessage(null);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setErrorMessage(null);
    void (async () => {
      const localIds = readFavoriteRestaurantIds();
      let cloudIds: string[] = [];

      try {
        cloudIds = await fetchUserFavoriteIds();
        const mergedIds = [...new Set([...cloudIds, ...localIds])];

        if (localIds.length > 0) {
          setIsSyncing(true);
          await addUserFavorites(localIds);
          writeFavoriteRestaurantIds([]);
          markFavoritesMigrated(userId);
        }

        if (active) {
          setFavoriteIds(mergedIds);
        }
      } catch (error: unknown) {
        if (active) {
          setFavoriteIds([...new Set([...cloudIds, ...localIds])]);
          setErrorMessage(
            error instanceof Error ? error.message : "Could not sync favorites.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setIsSyncing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const isFavorite = useCallback(
    (restaurantId: string) => favoriteIdSet.has(restaurantId),
    [favoriteIdSet],
  );
  const toggleFavorite = useCallback(
    async (restaurantId: string) => {
      const wasFavorite = favoriteIdSet.has(restaurantId);
      const nextIds = wasFavorite
        ? favoriteIds.filter((id) => id !== restaurantId)
        : [...favoriteIds, restaurantId];

      setFavoriteIds(nextIds);
      setErrorMessage(null);

      if (!userId) {
        writeFavoriteRestaurantIds(nextIds);
        return;
      }

      setIsSyncing(true);
      try {
        if (wasFavorite) {
          await removeUserFavorite(restaurantId);
        } else {
          await addUserFavorite(restaurantId);
        }
      } catch (error: unknown) {
        setFavoriteIds(favoriteIds);
        setErrorMessage(
          error instanceof Error ? error.message : "Could not update favorites.",
        );
      } finally {
        setIsSyncing(false);
      }
    },
    [favoriteIdSet, favoriteIds, userId],
  );
  const clearError = useCallback(() => setErrorMessage(null), []);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoriteCount: favoriteIds.length,
        isLoading,
        isSyncing,
        errorMessage,
        isFavorite,
        toggleFavorite,
        clearError,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
