import type {
  Restaurant,
  RestaurantFeature,
} from "../types/restaurant";
import { getFeatureStatus } from "./features";

export type MatchResult = {
  score: number | null;
  matchedCount: number;
  unmatchedCount: number;
  unknownCount: number;
  confirmedCount: number;
  selectedCount: number;
};

export function calculateMatchResult(
  restaurant: Restaurant,
  selectedFeatures: RestaurantFeature[],
): MatchResult {
  let matchedCount = 0;
  let unmatchedCount = 0;
  let unknownCount = 0;

  for (const feature of selectedFeatures) {
    const status = getFeatureStatus(restaurant, feature);

    if (status === "supported") {
      matchedCount += 1;
    } else if (status === "unsupported") {
      unmatchedCount += 1;
    } else {
      unknownCount += 1;
    }
  }

  const confirmedCount = matchedCount + unmatchedCount;

  return {
    score:
      confirmedCount === 0
        ? null
        : Math.round((matchedCount / confirmedCount) * 100),
    matchedCount,
    unmatchedCount,
    unknownCount,
    confirmedCount,
    selectedCount: selectedFeatures.length,
  };
}
