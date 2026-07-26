import type {
  FeatureStatus,
  FeatureStatusMap,
  Restaurant,
  RestaurantFeature,
} from "../types/restaurant";

export const restaurantFeatures: RestaurantFeature[] = [
  "credit_card",
  "non_smoking",
  "english_guide",
  "wifi",
  "takeout",
  "vegetarian",
  "vegan",
  "pork_free",
  "alcohol_free",
];

export const featureLabels: Record<RestaurantFeature, string> = {
  credit_card: "Credit card",
  non_smoking: "Non-smoking",
  english_guide: "English guide",
  wifi: "Wi-Fi",
  takeout: "Takeout",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pork_free: "Pork-free options",
  alcohol_free: "Alcohol-free options",
};

export const featureLabelsJa: Record<RestaurantFeature, string> = {
  credit_card: "クレジットカード利用可能",
  non_smoking: "全面禁煙",
  english_guide: "英語案内あり",
  wifi: "Wi-Fiあり",
  takeout: "テイクアウト可能",
  vegetarian: "ベジタリアン対応",
  vegan: "ヴィーガン対応",
  pork_free: "豚肉不使用メニューあり",
  alcohol_free: "アルコール不使用メニューあり",
};

export const featureStatusLabels: Record<FeatureStatus, string> = {
  supported: "Matched",
  unsupported: "Not matched",
  unknown: "Not registered",
};

export const featureStatusLabelsJa: Record<FeatureStatus, string> = {
  supported: "対応あり",
  unsupported: "非対応",
  unknown: "情報未登録",
};

export const featureEditStatusLabels: Record<FeatureStatus, string> = {
  supported: "Available",
  unsupported: "Not available",
  unknown: "Not registered",
};

export function createUnknownFeatureStatuses(): FeatureStatusMap {
  return Object.fromEntries(
    restaurantFeatures.map((feature) => [feature, "unknown"]),
  ) as FeatureStatusMap;
}

export function createFeatureStatuses(
  supportedFeatures: RestaurantFeature[] = [],
  unsupportedFeatures: RestaurantFeature[] = [],
): FeatureStatusMap {
  const statuses = createUnknownFeatureStatuses();

  for (const feature of supportedFeatures) {
    statuses[feature] = "supported";
  }

  for (const feature of unsupportedFeatures) {
    statuses[feature] = "unsupported";
  }

  return statuses;
}

export function normalizeFeatureStatuses(
  statusesValue: unknown,
  legacyFeaturesValue?: unknown,
): FeatureStatusMap {
  const statuses = createUnknownFeatureStatuses();

  if (Array.isArray(legacyFeaturesValue)) {
    for (const feature of legacyFeaturesValue) {
      if (restaurantFeatures.includes(feature as RestaurantFeature)) {
        statuses[feature as RestaurantFeature] = "supported";
      }
    }
  }

  if (!statusesValue || typeof statusesValue !== "object") {
    return statuses;
  }

  const savedStatuses = statusesValue as Record<string, unknown>;

  for (const feature of restaurantFeatures) {
    const savedStatus = savedStatuses[feature];

    if (
      savedStatus === "supported" ||
      savedStatus === "unsupported" ||
      savedStatus === "unknown"
    ) {
      statuses[feature] = savedStatus;
    } else if (savedStatus === true) {
      statuses[feature] = "supported";
    } else if (savedStatus === false) {
      statuses[feature] = "unknown";
    }
  }

  return statuses;
}

export function getFeatureStatus(
  restaurant: Restaurant,
  feature: RestaurantFeature,
): FeatureStatus {
  return restaurant.featureStatuses[feature] ?? "unknown";
}
