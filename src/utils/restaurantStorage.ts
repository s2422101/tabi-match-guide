import { restaurants as initialRestaurants } from "../data/restaurants";
import type { Restaurant } from "../types/restaurant";

const storageKey = "tabi-match-guide:restaurants";

export function getRestaurants(): Restaurant[] {
  try {
    const savedRestaurants = localStorage.getItem(storageKey);

    if (!savedRestaurants) {
      return initialRestaurants;
    }

    const parsedRestaurants = JSON.parse(savedRestaurants) as Restaurant[];
    const savedById = new Map(
      parsedRestaurants.map((restaurant) => [restaurant.id, restaurant]),
    );

    return initialRestaurants.map(
      (restaurant) => savedById.get(restaurant.id) ?? restaurant,
    );
  } catch {
    return initialRestaurants;
  }
}

export function saveRestaurant(updatedRestaurant: Restaurant): void {
  const updatedRestaurants = getRestaurants().map((restaurant) =>
    restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant,
  );

  localStorage.setItem(storageKey, JSON.stringify(updatedRestaurants));
}
