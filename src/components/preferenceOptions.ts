import type { RestaurantFeature } from "../types/restaurant";

export type PreferenceOption = {
  id: RestaurantFeature;
  labelJa: string;
  labelEn: string;
};

export const preferenceOptions: PreferenceOption[] = [
  {
    id: "pork_free",
    labelJa: "豚肉不使用メニューあり",
    labelEn: "Pork-free options",
  },
  {
    id: "alcohol_free",
    labelJa: "アルコール不使用メニューあり",
    labelEn: "Alcohol-free options",
  },
  {
    id: "vegetarian",
    labelJa: "ベジタリアン対応",
    labelEn: "Vegetarian options",
  },
  {
    id: "vegan",
    labelJa: "ヴィーガン対応",
    labelEn: "Vegan options",
  },
  {
    id: "credit_card",
    labelJa: "クレジットカード利用可能",
    labelEn: "Credit card available",
  },
  {
    id: "non_smoking",
    labelJa: "全面禁煙",
    labelEn: "Non-smoking",
  },
  {
    id: "english_guide",
    labelJa: "英語案内あり",
    labelEn: "English guide available",
  },
  {
    id: "wifi",
    labelJa: "Wi-Fiあり",
    labelEn: "Wi-Fi available",
  },
  {
    id: "takeout",
    labelJa: "テイクアウト可能",
    labelEn: "Takeout available",
  },
];
