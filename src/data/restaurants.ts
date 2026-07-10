import type { Restaurant } from "../types/restaurant";

export const restaurants: Restaurant[] = [
  {
    id: 1,
    nameJa: "浅草さくら食堂",
    nameEn: "Asakusa Sakura Dining",
    genre: "Japanese Cuisine",
    area: "Asakusa",
    description:
      "A casual Japanese restaurant serving set meals and seasonal dishes.",
    imageUrl: "https://placehold.co/600x400?text=Sakura+Dining",
    features: [
      "credit_card",
      "non_smoking",
      "english_guide",
      "wifi",
      "takeout",
      "pork_free",
    ],
  },
  {
    id: 2,
    nameJa: "江戸前そば 花月",
    nameEn: "Edo Soba Kagetsu",
    genre: "Soba",
    area: "Asakusa",
    description:
      "A traditional soba restaurant with several vegetarian-friendly dishes.",
    imageUrl: "https://placehold.co/600x400?text=Edo+Soba",
    features: [
      "credit_card",
      "non_smoking",
      "english_guide",
      "vegetarian",
      "pork_free",
      "alcohol_free",
    ],
  },
  {
    id: 3,
    nameJa: "東京ラーメン横丁",
    nameEn: "Tokyo Ramen Alley",
    genre: "Ramen",
    area: "Ueno",
    description:
      "A popular ramen restaurant serving rich pork-based ramen.",
    imageUrl: "https://placehold.co/600x400?text=Tokyo+Ramen",
    features: ["wifi", "takeout", "english_guide"],
  },
  {
    id: 4,
    nameJa: "グリーンボウルカフェ",
    nameEn: "Green Bowl Cafe",
    genre: "Vegan Cafe",
    area: "Ueno",
    description:
      "A plant-based cafe offering vegan bowls, desserts and drinks.",
    imageUrl: "https://placehold.co/600x400?text=Green+Bowl",
    features: [
      "credit_card",
      "non_smoking",
      "english_guide",
      "wifi",
      "takeout",
      "vegetarian",
      "vegan",
      "pork_free",
      "alcohol_free",
    ],
  },
  {
    id: 5,
    nameJa: "雷門天ぷら処",
    nameEn: "Kaminarimon Tempura",
    genre: "Tempura",
    area: "Asakusa",
    description:
      "A tempura restaurant located near Kaminarimon Gate.",
    imageUrl: "https://placehold.co/600x400?text=Tempura",
    features: [
      "credit_card",
      "non_smoking",
      "takeout",
      "pork_free",
    ],
  },
];