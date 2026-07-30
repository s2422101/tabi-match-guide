import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./errors.js";
import { fetchWithTimeout } from "./fetchWithTimeout.js";

export type RestaurantSupportRow = {
  restaurant_id: string;
  name_en: string;
  name_ja: string;
  feature_statuses: Record<string, "supported" | "unsupported" | "unknown">;
  created_at: string;
  updated_at: string;
};

export type RestaurantSupportInput = Pick<
  RestaurantSupportRow,
  "restaurant_id" | "name_en" | "name_ja" | "feature_statuses"
>;

let client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new ApiError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Restaurant support storage is not configured.",
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: { fetch: fetchWithTimeout },
  });

  return client;
}

const supportColumns =
  "restaurant_id,name_en,name_ja,feature_statuses,created_at,updated_at";

function throwQueryError(): never {
  throw new ApiError(
    502,
    "SUPABASE_QUERY_FAILED",
    "Could not access restaurant support information.",
  );
}

export async function getRestaurantSupport(
  restaurantId: string,
): Promise<RestaurantSupportRow | null> {
  const { data, error } = await getSupabaseClient()
    .from("restaurant_support")
    .select(supportColumns)
    .eq("restaurant_id", restaurantId)
    .maybeSingle<RestaurantSupportRow>();

  if (error) {
    throwQueryError();
  }

  return data;
}

export async function getRestaurantSupports(
  restaurantIds: string[],
): Promise<RestaurantSupportRow[]> {
  if (restaurantIds.length === 0) {
    return [];
  }

  const { data, error } = await getSupabaseClient()
    .from("restaurant_support")
    .select(supportColumns)
    .in("restaurant_id", restaurantIds)
    .returns<RestaurantSupportRow[]>();

  if (error) {
    throwQueryError();
  }

  return data ?? [];
}

export async function upsertRestaurantSupport(
  input: RestaurantSupportInput,
): Promise<RestaurantSupportRow> {
  const { data, error } = await getSupabaseClient()
    .from("restaurant_support")
    .upsert(
      {
        ...input,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "restaurant_id" },
    )
    .select(supportColumns)
    .single<RestaurantSupportRow>();

  if (error || !data) {
    throwQueryError();
  }

  return data;
}

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export async function getAuthenticatedUser(
  accessToken: string,
): Promise<AuthenticatedUser> {
  try {
    const {
      data: { user },
      error,
    } = await getSupabaseClient().auth.getUser(accessToken);

    if (error || !user) {
      throw new ApiError(
        401,
        "AUTHENTICATION_REQUIRED",
        "A valid administrator session is required.",
      );
    }

    return { id: user.id, email: user.email };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      401,
      "AUTHENTICATION_REQUIRED",
      "A valid administrator session is required.",
    );
  }
}
