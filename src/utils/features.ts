import type { RestaurantFeature } from "../types/restaurant";

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
