import { ApiError } from "./errors.js";
import { fetchWithTimeout } from "./fetchWithTimeout.js";

export type SearchArea = "all" | "Asakusa" | "Ueno";
type SpecificArea = Exclude<SearchArea, "all">;

type HotpepperShop = {
  id?: string;
  [key: string]: unknown;
};

type HotpepperError = {
  message?: string;
};

type HotpepperResponse = {
  results?: {
    shop?: HotpepperShop[];
    error?: HotpepperError | HotpepperError[];
  };
};

export type AreaShop = {
  area: SpecificArea;
  shop: HotpepperShop;
};

const endpoint = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";
const areaKeywords: Record<SpecificArea, string> = {
  Asakusa: "浅草",
  Ueno: "上野",
};

function getHotpepperError(data: HotpepperResponse): string | null {
  const errors = data.results?.error;

  if (!errors) {
    return null;
  }

  const firstError = Array.isArray(errors) ? errors[0] : errors;
  return firstError?.message || "Hot Pepper Gourmet API returned an error.";
}

async function fetchArea(
  area: SpecificArea,
  signal?: AbortSignal,
): Promise<AreaShop[]> {
  const apiKey = process.env.HOTPEPPER_API_KEY?.trim();

  if (!apiKey) {
    throw new ApiError(
      503,
      "HOTPEPPER_API_KEY_MISSING",
      "Hot Pepper Gourmet API key is not configured on the server.",
    );
  }

  const parameters = new URLSearchParams({
    key: apiKey,
    keyword: areaKeywords[area],
    count: "30",
    format: "json",
  });
  const response = await fetchWithTimeout(`${endpoint}?${parameters}`, {
    signal,
  });

  if (!response.ok) {
    throw new ApiError(
      502,
      "HOTPEPPER_UPSTREAM_ERROR",
      `Hot Pepper Gourmet API request failed (${response.status}).`,
    );
  }

  let data: HotpepperResponse;

  try {
    data = (await response.json()) as HotpepperResponse;
  } catch {
    throw new ApiError(
      502,
      "HOTPEPPER_INVALID_RESPONSE",
      "Hot Pepper Gourmet API returned invalid JSON.",
    );
  }

  const apiError = getHotpepperError(data);

  if (apiError) {
    throw new ApiError(502, "HOTPEPPER_UPSTREAM_ERROR", apiError);
  }

  return (data.results?.shop ?? [])
    .filter((shop) => typeof shop.id === "string" && shop.id.length > 0)
    .map((shop) => ({ area, shop }));
}

export async function getRestaurants(
  area: SearchArea,
  signal?: AbortSignal,
): Promise<AreaShop[]> {
  const areas: SpecificArea[] =
    area === "all" ? ["Asakusa", "Ueno"] : [area];
  const results = await Promise.all(
    areas.map((targetArea) => fetchArea(targetArea, signal)),
  );
  const uniqueShops = new Map<string, AreaShop>();

  for (const item of results.flat()) {
    if (item.shop.id) {
      uniqueShops.set(item.shop.id, item);
    }
  }

  return [...uniqueShops.values()];
}
