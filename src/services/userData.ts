import { getBrowserSupabaseClient } from "./supabaseAuth";
import type { RestaurantFeature, RestaurantSort, SearchArea } from "../types/restaurant";
import type { UserPreferences } from "../types/userPreferences";
import { restaurantFeatures } from "../utils/features";

const validAreas: SearchArea[] = ["all", "Asakusa", "Ueno"];
const validSorts: RestaurantSort[] = ["match", "budget", "distance"];
const validRestaurantIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

type UserPreferenceRow = {
  user_id: string;
  preferred_area: string;
  preferred_features: unknown;
  preferred_sort: string;
};

async function getAuthenticatedClientAndUser() {
  const client = getBrowserSupabaseClient();
  if (!client) {
    throw new Error("User data storage is not configured.");
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new Error("Your session has expired. Please log in again.");
  }

  return { client, userId: data.user.id };
}

function parsePreferences(row: UserPreferenceRow): UserPreferences | null {
  if (
    !validAreas.includes(row.preferred_area as SearchArea) ||
    !validSorts.includes(row.preferred_sort as RestaurantSort) ||
    !Array.isArray(row.preferred_features)
  ) {
    return null;
  }

  const preferredFeatures = row.preferred_features.filter(
    (feature): feature is RestaurantFeature =>
      typeof feature === "string" &&
      restaurantFeatures.includes(feature as RestaurantFeature),
  );

  return {
    preferredArea: row.preferred_area as SearchArea,
    preferredFeatures: [...new Set(preferredFeatures)],
    preferredSort: row.preferred_sort as RestaurantSort,
  };
}

export async function fetchUserPreferences(): Promise<UserPreferences | null> {
  const { client, userId } = await getAuthenticatedClientAndUser();
  const { data, error } = await client
    .from("user_preferences")
    .select("user_id,preferred_area,preferred_features,preferred_sort")
    .eq("user_id", userId)
    .maybeSingle<UserPreferenceRow>();

  if (error) {
    throw new Error("Could not load saved preferences.");
  }

  return data ? parsePreferences(data) : null;
}

export async function saveUserPreferences(
  preferences: UserPreferences,
): Promise<UserPreferences> {
  const { client, userId } = await getAuthenticatedClientAndUser();
  const { data, error } = await client
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        preferred_area: preferences.preferredArea,
        preferred_features: preferences.preferredFeatures,
        preferred_sort: preferences.preferredSort,
      },
      { onConflict: "user_id" },
    )
    .select("user_id,preferred_area,preferred_features,preferred_sort")
    .single<UserPreferenceRow>();

  const parsed = data ? parsePreferences(data) : null;
  if (error || !parsed) {
    throw new Error("Could not save preferences.");
  }

  return parsed;
}

export async function deleteUserPreferences(): Promise<void> {
  const { client, userId } = await getAuthenticatedClientAndUser();
  const { error } = await client
    .from("user_preferences")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error("Could not reset preferences.");
  }
}

export async function fetchUserFavoriteIds(): Promise<string[]> {
  const { client, userId } = await getAuthenticatedClientAndUser();
  const { data, error } = await client
    .from("user_favorites")
    .select("restaurant_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) {
    throw new Error("Could not load favorites.");
  }

  return [
    ...new Set(
      data
        .map((row) => row.restaurant_id)
        .filter(
          (id): id is string =>
            typeof id === "string" && validRestaurantIdPattern.test(id),
        ),
    ),
  ];
}

export async function addUserFavorite(restaurantId: string): Promise<void> {
  if (!validRestaurantIdPattern.test(restaurantId)) {
    throw new Error("This restaurant cannot be saved to cloud favorites.");
  }

  const { client, userId } = await getAuthenticatedClientAndUser();
  const { error } = await client
    .from("user_favorites")
    .upsert(
      { user_id: userId, restaurant_id: restaurantId },
      { onConflict: "user_id,restaurant_id", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error("Could not add the favorite.");
  }
}

export async function addUserFavorites(restaurantIds: string[]): Promise<void> {
  const validIds = [...new Set(restaurantIds)].filter((id) =>
    validRestaurantIdPattern.test(id),
  );

  if (validIds.length === 0) {
    return;
  }

  const { client, userId } = await getAuthenticatedClientAndUser();
  const { error } = await client.from("user_favorites").upsert(
    validIds.map((restaurantId) => ({ user_id: userId, restaurant_id: restaurantId })),
    { onConflict: "user_id,restaurant_id", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error("Could not migrate local favorites.");
  }
}

export async function removeUserFavorite(restaurantId: string): Promise<void> {
  const { client, userId } = await getAuthenticatedClientAndUser();
  const { error } = await client
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId);

  if (error) {
    throw new Error("Could not remove the favorite.");
  }
}
