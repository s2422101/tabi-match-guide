import type {
  FeatureStatusMap,
  Restaurant,
  SearchArea,
} from "../types/restaurant";
import { createUnknownFeatureStatuses } from "../utils/features";
import { getApiUrl } from "./apiUrl";

type HotpepperShop = {
  id?: string;
  name?: string;
  name_kana?: string;
  address?: string;
  lat?: number;
  lng?: number;
  catch?: string;
  open?: string;
  card?: string;
  non_smoking?: string;
  wifi?: string;
  genre?: { name?: string };
  budget?: { name?: string; average?: string };
  photo?: { pc?: { l?: string; m?: string } };
  urls?: { pc?: string };
};

type HotpepperResponse = {
  restaurants?: Array<{
    area: Exclude<SearchArea, "all">;
    shop: HotpepperShop;
  }>;
  error?: {
    code?: string;
    message?: string;
  };
};

const apiEndpoint = getApiUrl("/api/restaurants");

export class RestaurantApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "RestaurantApiError";
    this.code = code;
  }
}

// Retained only as an internal/cache ID and for resolving previously issued URLs.
// Routes and Supabase use the official Hot Pepper ID in `externalId`.
function createLegacyInternalRestaurantId(externalId: string): number {
  let hash = 0;

  for (const character of externalId) {
    hash = Math.imul(31, hash) + character.charCodeAt(0);
  }

  return 1_000_000 + (hash >>> 0);
}

function getFeatureStatuses(shop: HotpepperShop): FeatureStatusMap {
  const statuses = createUnknownFeatureStatuses();

  if (shop.card === "利用可") {
    statuses.credit_card = "supported";
  } else if (shop.card === "利用不可") {
    statuses.credit_card = "unsupported";
  }

  if (shop.non_smoking?.includes("全面禁煙")) {
    statuses.non_smoking = "supported";
  } else if (
    shop.non_smoking?.includes("一部禁煙") ||
    shop.non_smoking?.includes("禁煙席なし")
  ) {
    statuses.non_smoking = "unsupported";
  }

  if (shop.wifi === "あり") {
    statuses.wifi = "supported";
  } else if (shop.wifi === "なし") {
    statuses.wifi = "unsupported";
  }

  return statuses;
}

function convertShop(
  shop: HotpepperShop,
  area: Exclude<SearchArea, "all">,
): Restaurant | null {
  if (!shop.id || !shop.name) {
    return null;
  }

  return {
    id: createLegacyInternalRestaurantId(shop.id),
    externalId: shop.id,
    nameEn: shop.name,
    nameJa: shop.name_kana || shop.name,
    genre: shop.genre?.name || "Restaurant",
    area,
    description: shop.catch || "Restaurant information from Hot Pepper Gourmet.",
    imageUrl:
      shop.photo?.pc?.l ||
      shop.photo?.pc?.m ||
      "https://placehold.co/600x400?text=Restaurant",
    featureStatuses: getFeatureStatuses(shop),
    address: shop.address,
    latitude: shop.lat,
    longitude: shop.lng,
    openingHours: shop.open,
    budget: shop.budget?.average || shop.budget?.name,
    sourceUrl: shop.urls?.pc,
    isApiRestaurant: true,
  };
}

export async function fetchHotpepperRestaurants(
  area: SearchArea,
  signal?: AbortSignal,
): Promise<Restaurant[]> {
  const parameters = new URLSearchParams({ area });
  const response = await fetch(`${apiEndpoint}?${parameters}`, { signal });
  let data: HotpepperResponse;

  try {
    data = (await response.json()) as HotpepperResponse;
  } catch {
    throw new RestaurantApiError(
      "Restaurant API returned an invalid response.",
      "INVALID_API_RESPONSE",
    );
  }

  if (!response.ok) {
    throw new RestaurantApiError(
      data.error?.message || `Restaurant API request failed (${response.status}).`,
      data.error?.code,
    );
  }

  if (!Array.isArray(data.restaurants)) {
    throw new RestaurantApiError("Restaurant API returned an invalid response.");
  }

  const restaurants = data.restaurants
    .map(({ shop, area: shopArea }) => convertShop(shop, shopArea))
    .filter((restaurant): restaurant is Restaurant => restaurant !== null);

  if (restaurants.length === 0) {
    throw new RestaurantApiError(
      "No restaurants were found for the selected area.",
      "NO_RESTAURANTS_FOUND",
    );
  }

  return restaurants;
}
