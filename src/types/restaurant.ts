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

export type Restaurant = {
  id: number;
  externalId?: string;
  nameJa: string;
  nameEn: string;
  genre: string;
  area: string;
  description: string;
  imageUrl: string;
  features: RestaurantFeature[];
  address?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  budget?: string;
  sourceUrl?: string;
  isApiRestaurant?: boolean;
};
