export type RestaurantFeature =
  | "credit_card"
  | "non_smoking"
  | "english_guide"
  | "wifi"
  | "takeout"
  | "vegetarian"
  | "vegan"
  | "pork_free"
  | "alcohol_free";

export type FeatureStatus = "supported" | "unsupported" | "unknown";

export type FeatureStatusMap = Record<RestaurantFeature, FeatureStatus>;

export type SearchArea = "all" | "Asakusa" | "Ueno";

export type Restaurant = {
  id: number;
  externalId?: string;
  nameJa: string;
  nameEn: string;
  genre: string;
  area: string;
  description: string;
  descriptionJa?: string;
  imageUrl: string;
  featureStatuses: FeatureStatusMap;
  /** Legacy localStorage field. Read only during migration. */
  features?: RestaurantFeature[];
  address?: string;
  addressJa?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  openingHoursJa?: string;
  budget?: string;
  budgetJa?: string;
  sourceUrl?: string;
  isApiRestaurant?: boolean;
};
