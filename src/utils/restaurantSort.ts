import type { Restaurant, RestaurantSort } from "../types/restaurant";
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

const comparators: Record<
  RestaurantSort,
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
): RestaurantResult[] {
  const comparator = comparators[sort];

  return results
    .map((result, originalIndex) => ({ result, originalIndex }))
    .sort(
      (first, second) =>
        comparator(first, second) || first.originalIndex - second.originalIndex,
    )
    .map(({ result }) => result);
}
