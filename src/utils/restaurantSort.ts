import type { Restaurant, RestaurantSort } from "../types/restaurant";
import {
  calculateDistanceKm,
  type Coordinates,
} from "./distance";
import type { MatchResult } from "./match";

export type RestaurantResult = {
  restaurant: Restaurant;
  matchResult: MatchResult;
};

type IndexedRestaurantResult = {
  result: RestaurantResult;
  originalIndex: number;
};

export function parseBudgetAmount(value?: string): number | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.normalize("NFKC").replaceAll(",", "");

  if (/free|無料/i.test(normalized)) {
    return 0;
  }

  const firstAmount = normalized.match(/\d+(?:\.\d+)?/)?.[0];

  if (!firstAmount) {
    return null;
  }

  const amount = Number(firstAmount);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function getRestaurantBudgetAmount(
  restaurant: Restaurant,
): number | null {
  return parseBudgetAmount(restaurant.budgetJa ?? restaurant.budget);
}

function compareByMatch(
  first: IndexedRestaurantResult,
  second: IndexedRestaurantResult,
): number {
  const scoreDifference =
    (second.result.matchResult.score ?? -1) -
    (first.result.matchResult.score ?? -1);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  return (
    second.result.matchResult.confirmedCount -
    first.result.matchResult.confirmedCount
  );
}

function compareByBudget(
  first: IndexedRestaurantResult,
  second: IndexedRestaurantResult,
): number {
  const firstBudget = getRestaurantBudgetAmount(first.result.restaurant);
  const secondBudget = getRestaurantBudgetAmount(second.result.restaurant);

  if (firstBudget === null && secondBudget === null) {
    return 0;
  }

  if (firstBudget === null) {
    return 1;
  }

  if (secondBudget === null) {
    return -1;
  }

  return firstBudget - secondBudget;
}

function compareByDistance(
  first: IndexedRestaurantResult,
  second: IndexedRestaurantResult,
  coordinates: Coordinates | null,
): number {
  const firstDistance = calculateDistanceKm(coordinates, {
    latitude: first.result.restaurant.latitude ?? Number.NaN,
    longitude: first.result.restaurant.longitude ?? Number.NaN,
  });
  const secondDistance = calculateDistanceKm(coordinates, {
    latitude: second.result.restaurant.latitude ?? Number.NaN,
    longitude: second.result.restaurant.longitude ?? Number.NaN,
  });

  if (firstDistance === null && secondDistance === null) {
    return 0;
  }

  if (firstDistance === null) {
    return 1;
  }

  if (secondDistance === null) {
    return -1;
  }

  return firstDistance - secondDistance;
}

const comparators: Record<
  Exclude<RestaurantSort, "distance">,
  (
    first: IndexedRestaurantResult,
    second: IndexedRestaurantResult,
  ) => number
> = {
  match: compareByMatch,
  budget: compareByBudget,
};

export function sortRestaurantResults(
  results: RestaurantResult[],
  sort: RestaurantSort,
  coordinates: Coordinates | null = null,
): RestaurantResult[] {
  const comparator =
    sort === "distance"
      ? (first: IndexedRestaurantResult, second: IndexedRestaurantResult) =>
          compareByDistance(first, second, coordinates)
      : comparators[sort];

  return results
    .map((result, originalIndex) => ({ result, originalIndex }))
    .sort(
      (first, second) =>
        comparator(first, second) || first.originalIndex - second.originalIndex,
    )
    .map(({ result }) => result);
}
