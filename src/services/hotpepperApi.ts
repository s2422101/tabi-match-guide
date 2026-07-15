import type {
  Restaurant,
  RestaurantFeature,
} from "../types/restaurant";

export type SearchArea = "all" | "Asakusa" | "Ueno";

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

type HotpepperError = {
  code?: number;
  message?: string;
};

type HotpepperResponse = {
  results?: {
    results_available?: number;
    shop?: HotpepperShop[];
    error?: HotpepperError | HotpepperError[];
  };
};

const apiEndpoint = "/hotpepper-api/hotpepper/gourmet/v1/";
const areaKeywords = {
  Asakusa: "浅草",
  Ueno: "上野",
} as const;

// VITE_ variables are embedded in the browser bundle. This proxy setup is only
// for prototyping; production must move the API request and key to a backend.
export function isHotpepperApiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_HOTPEPPER_API_KEY?.trim());
}

function createStableRestaurantId(externalId: string): number {
  let hash = 0;

  for (const character of externalId) {
    hash = Math.imul(31, hash) + character.charCodeAt(0);
  }

  return 1_000_000 + (hash >>> 0);
}

function getFeatures(shop: HotpepperShop): RestaurantFeature[] {
  const features: RestaurantFeature[] = [];

  if (shop.card === "利用可") {
    features.push("credit_card");
  }

  if (shop.non_smoking?.includes("全面禁煙")) {
    features.push("non_smoking");
  }

  if (shop.wifi === "あり") {
    features.push("wifi");
  }

  return features;
}

function convertShop(
  shop: HotpepperShop,
  area: Exclude<SearchArea, "all">,
): Restaurant | null {
  if (!shop.id || !shop.name) {
    return null;
  }

  return {
    id: createStableRestaurantId(shop.id),
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
    features: getFeatures(shop),
    address: shop.address,
    latitude: shop.lat,
    longitude: shop.lng,
    openingHours: shop.open,
    budget: shop.budget?.average || shop.budget?.name,
    sourceUrl: shop.urls?.pc,
    isApiRestaurant: true,
  };
}

function getApiError(response: HotpepperResponse): string | null {
  const errors = response.results?.error;

  if (!errors) {
    return null;
  }

  const firstError = Array.isArray(errors) ? errors[0] : errors;
  return firstError?.message || "Hot Pepper Gourmet API returned an error.";
}

async function fetchAreaRestaurants(
  area: Exclude<SearchArea, "all">,
  signal?: AbortSignal,
): Promise<Restaurant[]> {
  const apiKey = import.meta.env.VITE_HOTPEPPER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Hot Pepper Gourmet API key is not configured.");
  }

  const parameters = new URLSearchParams({
    key: apiKey,
    keyword: areaKeywords[area],
    count: "30",
    format: "json",
  });
  const response = await fetch(`${apiEndpoint}?${parameters}`, { signal });

  if (!response.ok) {
    throw new Error(`Hot Pepper Gourmet API request failed (${response.status}).`);
  }

  const data = (await response.json()) as HotpepperResponse;
  const apiError = getApiError(data);

  if (apiError) {
    throw new Error(apiError);
  }

  return (data.results?.shop ?? [])
    .map((shop) => convertShop(shop, area))
    .filter((restaurant): restaurant is Restaurant => restaurant !== null);
}

export async function fetchHotpepperRestaurants(
  area: SearchArea,
  signal?: AbortSignal,
): Promise<Restaurant[]> {
  const targetAreas: Exclude<SearchArea, "all">[] =
    area === "all" ? ["Asakusa", "Ueno"] : [area];
  const areaResults = await Promise.all(
    targetAreas.map((targetArea) => fetchAreaRestaurants(targetArea, signal)),
  );
  const uniqueRestaurants = new Map<string, Restaurant>();

  for (const restaurant of areaResults.flat()) {
    if (restaurant.externalId) {
      uniqueRestaurants.set(restaurant.externalId, restaurant);
    }
  }

  const restaurants = [...uniqueRestaurants.values()];

  if (restaurants.length === 0) {
    throw new Error("No restaurants were found for the selected area.");
  }

  return restaurants;
}
