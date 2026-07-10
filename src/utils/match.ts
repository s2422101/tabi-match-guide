import type {
  Restaurant,
  RestaurantFeature,
} from "../types/restaurant";

export function calculateMatchScore(
  restaurant: Restaurant,
  selectedFeatures: RestaurantFeature[],
): number {
  if (selectedFeatures.length === 0) {
    return 100;
  }

  const matchedCount = selectedFeatures.filter((feature) =>
    restaurant.features.includes(feature),
  ).length;

  return Math.round(
    (matchedCount / selectedFeatures.length) * 100,
  );
}
