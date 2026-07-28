import type { Restaurant } from "../types/restaurant";

/**
 * API restaurants use their official Hot Pepper ID. Sample restaurants, which
 * have no upstream ID, keep their existing numeric ID.
 */
export function getRestaurantCanonicalId(restaurant: Restaurant): string {
  return restaurant.externalId || String(restaurant.id);
}

export function findRestaurantByRouteId(
  restaurants: Restaurant[],
  routeId: string | undefined,
): Restaurant | undefined {
  if (!routeId) {
    return undefined;
  }

  return (
    restaurants.find(
      (restaurant) => getRestaurantCanonicalId(restaurant) === routeId,
    ) ??
    restaurants.find((restaurant) => String(restaurant.id) === routeId)
  );
}
