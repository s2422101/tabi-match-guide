import type {
  RestaurantFeature,
  SearchArea,
} from "../types/restaurant";
import { restaurantFeatures } from "./features";

const validAreas: SearchArea[] = ["all", "Asakusa", "Ueno"];

export type ReturnNavigationState = {
  from: string;
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

export function canNavigateBack(): boolean {
  const state: unknown = window.history.state;

  if (!state || typeof state !== "object" || !("idx" in state)) {
    return false;
  }

  return typeof (state as { idx?: unknown }).idx === "number" &&
    (state as { idx: number }).idx > 0;
}
