import type {
  FeatureStatus,
  Restaurant,
  RestaurantFeature,
} from "../types/restaurant";
import { restaurantFeatures } from "../utils/features";
import { getRestaurantCanonicalId } from "../utils/restaurantId";
import {
  clearLegacyRestaurantEdits,
  getLegacyRestaurantEdits,
} from "../utils/restaurantStorage";
import { getApiUrl } from "./apiUrl";

export type RestaurantSupportRecord = {
  restaurant_id: string;
  name_en: string;
  name_ja: string;
  feature_statuses: Partial<Record<RestaurantFeature, FeatureStatus>>;
  created_at: string;
  updated_at: string;
};

type SupportResponse = {
  support?: RestaurantSupportRecord | null;
  error?: { code?: string; message?: string };
};

type SupportsResponse = {
  supports?: RestaurantSupportRecord[];
  error?: { code?: string; message?: string };
};

export class RestaurantSupportApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "RestaurantSupportApiError";
    this.code = code;
  }
}

export function getRestaurantSupportId(restaurant: Restaurant): string {
  return getRestaurantCanonicalId(restaurant);
}

function isFeatureStatus(value: unknown): value is FeatureStatus {
  return value === "supported" || value === "unsupported" || value === "unknown";
}

function parseResponse(data: unknown): SupportResponse {
  if (!data || typeof data !== "object") {
    throw new RestaurantSupportApiError("Support API returned an invalid response.");
  }

  return data as SupportResponse;
}

async function readResponse(response: Response): Promise<SupportResponse> {
  let data: SupportResponse;

  try {
    data = parseResponse(await response.json());
  } catch (error: unknown) {
    if (error instanceof RestaurantSupportApiError) {
      throw error;
    }
    throw new RestaurantSupportApiError("Support API returned an invalid response.");
  }

  if (!response.ok) {
    throw new RestaurantSupportApiError(
      data.error?.message || `Support API request failed (${response.status}).`,
      data.error?.code,
    );
  }

  return data;
}

export function applyRestaurantSupport(
  restaurant: Restaurant,
  support: RestaurantSupportRecord | null,
): Restaurant {
  if (!support) {
    return restaurant;
  }

  const featureStatuses = { ...restaurant.featureStatuses };

  for (const feature of restaurantFeatures) {
    const status = support.feature_statuses[feature];
    if (isFeatureStatus(status)) {
      featureStatuses[feature] = status;
    }
  }

  return {
    ...restaurant,
    nameEn: support.name_en || restaurant.nameEn,
    nameJa: support.name_ja || restaurant.nameJa,
    featureStatuses,
  };
}

export async function fetchRestaurantSupport(
  restaurant: Restaurant,
  signal?: AbortSignal,
): Promise<RestaurantSupportRecord | null> {
  const restaurantId = encodeURIComponent(getRestaurantSupportId(restaurant));
  const response = await fetch(
    getApiUrl(`/api/restaurants/${restaurantId}/support`),
    {
      signal,
    },
  );
  const data = await readResponse(response);
  return data.support ?? null;
}

export async function fetchRestaurantSupports(
  restaurants: Restaurant[],
  signal?: AbortSignal,
): Promise<Map<string, RestaurantSupportRecord>> {
  const restaurantIds = [
    ...new Set(restaurants.map(getRestaurantSupportId)),
  ];

  if (restaurantIds.length === 0) {
    return new Map();
  }

  const parameters = new URLSearchParams({ ids: restaurantIds.join(",") });
  const response = await fetch(
    getApiUrl(`/api/restaurant-support?${parameters.toString()}`),
    { signal },
  );
  let data: SupportsResponse;

  try {
    data = (await response.json()) as SupportsResponse;
  } catch {
    throw new RestaurantSupportApiError(
      "Support API returned an invalid response.",
    );
  }

  if (!response.ok) {
    throw new RestaurantSupportApiError(
      data.error?.message || `Support API request failed (${response.status}).`,
      data.error?.code,
    );
  }

  if (!Array.isArray(data.supports)) {
    throw new RestaurantSupportApiError(
      "Support API returned an invalid response.",
    );
  }

  return new Map(
    data.supports.map((support) => [support.restaurant_id, support]),
  );
}

export async function saveRestaurantSupport(
  restaurant: Restaurant,
  accessToken: string,
  signal?: AbortSignal,
): Promise<RestaurantSupportRecord> {
  const restaurantId = encodeURIComponent(getRestaurantSupportId(restaurant));
  const response = await fetch(
    getApiUrl(`/api/restaurants/${restaurantId}/support`),
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name_en: restaurant.nameEn,
        name_ja: restaurant.nameJa,
        feature_statuses: restaurant.featureStatuses,
      }),
      signal,
    },
  );
  const data = await readResponse(response);

  if (!data.support) {
    throw new RestaurantSupportApiError("Support API returned no saved data.");
  }

  return data.support;
}

async function migrateLegacyRestaurantEdits(
  accessToken: string,
  signal?: AbortSignal,
): Promise<void> {
  const legacyRestaurants = getLegacyRestaurantEdits();

  if (legacyRestaurants.length === 0) {
    return;
  }

  await Promise.all(
    legacyRestaurants.map((restaurant) =>
      saveRestaurantSupport(restaurant, accessToken, signal),
    ),
  );
  clearLegacyRestaurantEdits();
}

export async function hydrateRestaurantsWithSupport(
  restaurants: Restaurant[],
  signal?: AbortSignal,
  accessToken?: string,
): Promise<Restaurant[]> {
  if (accessToken) {
    try {
      await migrateLegacyRestaurantEdits(accessToken, signal);
    } catch {
      // Keep old localStorage edits as a read fallback and retry next time.
    }
  }

  return Promise.all(
    restaurants.map(async (restaurant) => {
      try {
        const support = await fetchRestaurantSupport(restaurant, signal);
        return applyRestaurantSupport(restaurant, support);
      } catch {
        // The Hot Pepper or cached base record remains usable when Supabase is down.
        return restaurant;
      }
    }),
  );
}
