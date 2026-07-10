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
  nameJa: string;
  nameEn: string;
  genre: string;
  area: string;
  description: string;
  imageUrl: string;
  features: RestaurantFeature[];
};