import { ApiError } from "./errors.js";
import type { RestaurantSupportInput } from "./supabase.js";

const features = [
  "credit_card",
  "non_smoking",
  "english_guide",
  "wifi",
  "takeout",
  "vegetarian",
  "vegan",
  "pork_free",
  "alcohol_free",
] as const;
const statuses = ["supported", "unsupported", "unknown"] as const;
const restaurantIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

export function validateRestaurantId(value: string): string {
  const restaurantId = value.trim();

  if (!restaurantIdPattern.test(restaurantId)) {
    throw new ApiError(
      400,
      "INVALID_RESTAURANT_ID",
      "restaurantId must contain 1 to 128 letters, numbers, underscores, or hyphens.",
    );
  }

  return restaurantId;
}

export function validateRestaurantSupportInput(
  restaurantIdValue: string,
  body: unknown,
): RestaurantSupportInput {
  const restaurantId = validateRestaurantId(restaurantIdValue);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "INVALID_SUPPORT_INPUT", "A JSON object is required.");
  }

  const candidate = body as Record<string, unknown>;
  const nameEn = typeof candidate.name_en === "string" ? candidate.name_en.trim() : "";
  const nameJa = typeof candidate.name_ja === "string" ? candidate.name_ja.trim() : "";
  const featureStatuses = candidate.feature_statuses;

  if (!nameEn || nameEn.length > 200 || !nameJa || nameJa.length > 200) {
    throw new ApiError(
      400,
      "INVALID_RESTAURANT_NAME",
      "name_en and name_ja must each contain between 1 and 200 characters.",
    );
  }

  if (
    !featureStatuses ||
    typeof featureStatuses !== "object" ||
    Array.isArray(featureStatuses)
  ) {
    throw new ApiError(
      400,
      "INVALID_FEATURE_STATUSES",
      "feature_statuses must be an object.",
    );
  }

  const values = featureStatuses as Record<string, unknown>;
  const invalidKey = Object.keys(values).find(
    (feature) => !features.includes(feature as (typeof features)[number]),
  );
  const invalidValue = Object.values(values).find(
    (status) => !statuses.includes(status as (typeof statuses)[number]),
  );

  if (invalidKey || invalidValue !== undefined) {
    throw new ApiError(
      400,
      "INVALID_FEATURE_STATUSES",
      "feature_statuses may only contain known features with supported, unsupported, or unknown values.",
    );
  }

  return {
    restaurant_id: restaurantId,
    name_en: nameEn,
    name_ja: nameJa,
    feature_statuses: values as RestaurantSupportInput["feature_statuses"],
  };
}
