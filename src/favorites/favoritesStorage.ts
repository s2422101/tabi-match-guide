export const FAVORITES_STORAGE_KEY = "tabi-match-guide:favorites:v1";
const FAVORITES_MIGRATION_PREFIX = "tabi-match-guide:favorites-migrated:";

type StoredFavorites = {
  version: 1;
  restaurantIds: string[];
};

const validRestaurantIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

function normalizeRestaurantIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = value
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter((id) => validRestaurantIdPattern.test(id));

  return [...new Set(validIds)];
}

export function readFavoriteRestaurantIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (Array.isArray(parsed)) {
      return normalizeRestaurantIds(parsed);
    }

    if (!parsed || typeof parsed !== "object") {
      return [];
    }

    const candidate = parsed as Partial<StoredFavorites>;
    return candidate.version === 1
      ? normalizeRestaurantIds(candidate.restaurantIds)
      : [];
  } catch {
    return [];
  }
}

export function writeFavoriteRestaurantIds(restaurantIds: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const value: StoredFavorites = {
    version: 1,
    restaurantIds: normalizeRestaurantIds(restaurantIds),
  };

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage restrictions or quota errors must not break restaurant browsing.
  }
}

export function getFavoritesMigrationKey(userId: string): string {
  return `${FAVORITES_MIGRATION_PREFIX}${userId}`;
}

export function markFavoritesMigrated(userId: string): void {
  try {
    window.localStorage.setItem(getFavoritesMigrationKey(userId), "true");
  } catch {
    // A missing marker only causes a safe retry on the next session.
  }
}
