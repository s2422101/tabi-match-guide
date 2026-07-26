import { restaurants as initialRestaurants } from "../data/restaurants";
import type { Restaurant } from "../types/restaurant";
import { normalizeFeatureStatuses } from "./features";

const storageKey = "tabi-match-guide:restaurants";
const apiCacheKey = "tabi-match-guide:hotpepper-restaurants";

function normalizeRestaurant(value: unknown): Restaurant | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Restaurant> & {
    featureStatuses?: unknown;
    features?: unknown;
  };

  if (
    typeof candidate.id !== "number" ||
    typeof candidate.nameEn !== "string" ||
    typeof candidate.nameJa !== "string"
  ) {
    return null;
  }

  const savedStatusSource =
    candidate.featureStatuses ??
    (!Array.isArray(candidate.features) ? candidate.features : undefined) ??
    candidate;

  return {
    ...(candidate as Restaurant),
    featureStatuses: normalizeFeatureStatuses(
      savedStatusSource,
      candidate.features,
    ),
  };
}

function readRestaurants(key: string): Restaurant[] {
  try {
    const savedRestaurants = localStorage.getItem(key);

    if (!savedRestaurants) {
      return [];
    }

    const parsedRestaurants: unknown = JSON.parse(savedRestaurants);
    return Array.isArray(parsedRestaurants)
      ? parsedRestaurants
          .map(normalizeRestaurant)
          .filter((restaurant): restaurant is Restaurant => restaurant !== null)
      : [];
  } catch {
    return [];
  }
}

export function mergeRestaurantsWithSaved(
  restaurants: Restaurant[],
): Restaurant[] {
  const savedById = new Map(
    readRestaurants(storageKey).map((restaurant) => [restaurant.id, restaurant]),
  );

  return restaurants.map((restaurant) => {
    const savedRestaurant = savedById.get(restaurant.id);

    if (!savedRestaurant) {
      return restaurant;
    }

    return {
      ...restaurant,
      nameEn: savedRestaurant.nameEn,
      nameJa: savedRestaurant.nameJa,
      featureStatuses: savedRestaurant.featureStatuses,
    };
  });
}

export function getSampleRestaurants(): Restaurant[] {
  return mergeRestaurantsWithSaved(initialRestaurants);
}

export function getRestaurants(): Restaurant[] {
  const restaurantsById = new Map<number, Restaurant>();

  for (const restaurant of [
    ...initialRestaurants,
    ...readRestaurants(apiCacheKey),
  ]) {
    restaurantsById.set(restaurant.id, restaurant);
  }

  return mergeRestaurantsWithSaved([...restaurantsById.values()]);
}

export function cacheApiRestaurants(restaurants: Restaurant[]): void {
  const cachedById = new Map(
    readRestaurants(apiCacheKey).map((restaurant) => [restaurant.id, restaurant]),
  );

  for (const restaurant of restaurants) {
    cachedById.set(restaurant.id, restaurant);
  }

  localStorage.setItem(apiCacheKey, JSON.stringify([...cachedById.values()]));
}

export function saveRestaurant(updatedRestaurant: Restaurant): void {
  const savedById = new Map(
    readRestaurants(storageKey).map((restaurant) => [restaurant.id, restaurant]),
  );
  const normalizedRestaurant = {
    ...updatedRestaurant,
    featureStatuses: normalizeFeatureStatuses(
      updatedRestaurant.featureStatuses,
      updatedRestaurant.features,
    ),
  };
  delete normalizedRestaurant.features;
  savedById.set(updatedRestaurant.id, normalizedRestaurant);

  localStorage.setItem(storageKey, JSON.stringify([...savedById.values()]));
}
