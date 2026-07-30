import type {
  RestaurantFeature,
  RestaurantSort,
  SearchArea,
} from "../types/restaurant";
import { restaurantFeatures } from "./features";
import type { UserPreferences } from "../types/userPreferences";

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

export function getSafeUserReturnPath(
  state: unknown,
  fallback: string,
): string {
  const returnPath = getReturnPath(state);
  if (!returnPath) {
    return fallback;
  }

  const pathname = returnPath.split(/[?#]/, 1)[0];
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    /^\/restaurants\/[^/]+\/edit\/?$/.test(pathname)
  ) {
    return fallback;
  }

  return returnPath;
}

export function getSafePublicReturnPath(state: unknown): string {
  const returnPath = getSafeUserReturnPath(state, "/");
  const pathname = returnPath.split(/[?#]/, 1)[0];
  return pathname === "/mypage" ? "/" : returnPath;
}

export function getSearchPathFromPreferences(
  preferences: UserPreferences,
): string {
  const parameters = new URLSearchParams();

  if (preferences.preferredArea !== "all") {
    parameters.set("area", preferences.preferredArea);
  }
  if (preferences.preferredFeatures.length > 0) {
    parameters.set("features", preferences.preferredFeatures.join(","));
  }
  if (preferences.preferredSort !== "match") {
    parameters.set("sort", preferences.preferredSort);
  }

  const query = parameters.toString();
  return query ? `/?${query}` : "/";
}

export function canNavigateBack(): boolean {
  const state: unknown = window.history.state;

  if (!state || typeof state !== "object" || !("idx" in state)) {
    return false;
  }

  return typeof (state as { idx?: unknown }).idx === "number" &&
    (state as { idx: number }).idx > 0;
}
