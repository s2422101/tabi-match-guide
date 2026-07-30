import type {
  RestaurantFeature,
  RestaurantSort,
  SearchArea,
} from "../types/restaurant";
import { restaurantFeatures } from "./features";

const validAreas: SearchArea[] = ["all", "Asakusa", "Ueno"];
const validSorts: RestaurantSort[] = ["match", "budget", "distance"];

export type ReturnNavigationState = {
  from: string;
  adminReturnTo?: string;
};

export function getAreaFromSearchParams(
  searchParams: URLSearchParams,
): SearchArea {
  const area = searchParams.get("area");
  return validAreas.includes(area as SearchArea) ? (area as SearchArea) : "all";
}

export function getFeaturesFromSearchParams(
  searchParams: URLSearchParams,
): RestaurantFeature[] {
  const features = searchParams.get("features");

  if (!features) {
    return [];
  }

  return features
    .split(",")
    .filter((feature): feature is RestaurantFeature =>
      restaurantFeatures.includes(feature as RestaurantFeature),
    );
}

export function getSortFromSearchParams(
  searchParams: URLSearchParams,
): RestaurantSort {
  const sort = searchParams.get("sort");
  return validSorts.includes(sort as RestaurantSort)
    ? (sort as RestaurantSort)
    : "match";
}

export function getListPath(searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `/?${query}` : "/";
}

export function getReturnPath(state: unknown): string | null {
  if (!state || typeof state !== "object" || !("from" in state)) {
    return null;
  }

  const from = (state as { from?: unknown }).from;
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
    ? from
    : null;
}

export function getAdminReturnPath(state: unknown): string | null {
  const returnPath = getReturnPath(state);

  if (returnPath === "/admin" || returnPath?.startsWith("/admin?")) {
    return returnPath;
  }

  if (!state || typeof state !== "object" || !("adminReturnTo" in state)) {
    return null;
  }

  const adminReturnTo = (state as { adminReturnTo?: unknown }).adminReturnTo;
  return typeof adminReturnTo === "string" &&
    (adminReturnTo === "/admin" || adminReturnTo.startsWith("/admin?"))
    ? adminReturnTo
    : null;
}

export function canNavigateBack(): boolean {
  const state: unknown = window.history.state;

  if (!state || typeof state !== "object" || !("idx" in state)) {
    return false;
  }

  return typeof (state as { idx?: unknown }).idx === "number" &&
    (state as { idx: number }).idx > 0;
}
