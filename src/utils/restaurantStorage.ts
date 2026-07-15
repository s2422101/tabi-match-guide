import { restaurants as initialRestaurants } from "../data/restaurants";
import type { Restaurant } from "../types/restaurant";

const storageKey = "tabi-match-guide:restaurants";
const apiCacheKey = "tabi-match-guide:hotpepper-restaurants";

function readRestaurants(key: string): Restaurant[] {
  try {
    const savedRestaurants = localStorage.getItem(key);

    if (!savedRestaurants) {
      return [];
    }

    const parsedRestaurants: unknown = JSON.parse(savedRestaurants);
    return Array.isArray(parsedRestaurants)
      ? (parsedRestaurants as Restaurant[])
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
      features: savedRestaurant.features,
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
  savedById.set(updatedRestaurant.id, updatedRestaurant);

  localStorage.setItem(storageKey, JSON.stringify([...savedById.values()]));
}
