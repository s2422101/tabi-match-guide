import type { Restaurant } from "../types/restaurant";
import { getApiUrl } from "./apiUrl";

type DeepLResponse = {
  translations?: Array<{
    detected_source_language?: string;
    text?: string;
  }>;
  error?: {
    code?: string;
    message?: string;
  };
};

type TranslatableRestaurantFields = {
  description: string;
  address?: string;
  openingHours?: string;
  budget?: string;
};

const apiEndpoint = getApiUrl("/api/translate");
const cacheKey = "tabi-match-guide:deepl-translations:en-us";
const maximumTextsPerRequest = 50;

function readTranslationCache(): Record<string, string> {
  try {
    const savedCache = localStorage.getItem(cacheKey);

    if (!savedCache) {
      return {};
    }

    const parsedCache: unknown = JSON.parse(savedCache);
    return parsedCache && typeof parsedCache === "object"
      ? (parsedCache as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function saveTranslationCache(cache: Record<string, string>): void {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch {
    // A full or unavailable storage must not prevent Japanese fallback content.
  }
}

function getOriginalFields(restaurant: Restaurant): TranslatableRestaurantFields {
  return {
    description: restaurant.descriptionJa ?? restaurant.description,
    address: restaurant.addressJa ?? restaurant.address,
    openingHours: restaurant.openingHoursJa ?? restaurant.openingHours,
    budget: restaurant.budgetJa ?? restaurant.budget,
  };
}

function getUniqueTexts(restaurants: Restaurant[]): string[] {
  const texts = new Set<string>();

  for (const restaurant of restaurants) {
    const fields = getOriginalFields(restaurant);

    for (const text of [
      fields.description,
      fields.address,
      fields.openingHours,
      fields.budget,
    ]) {
      if (text?.trim()) {
        texts.add(text);
      }
    }
  }

  return [...texts];
}

async function requestTranslations(
  texts: string[],
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: texts,
      source_lang: "JA",
      target_lang: "EN-US",
    }),
    signal,
  });
  const data = (await response.json()) as DeepLResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Translation API request failed (${response.status}).`,
    );
  }

  const translations = data.translations?.map((translation) => translation.text);

  if (
    !translations ||
    translations.length !== texts.length ||
    translations.some((translation) => !translation)
  ) {
    throw new Error("DeepL API returned an invalid translation response.");
  }

  return translations as string[];
}

function applyTranslations(
  restaurant: Restaurant,
  cache: Record<string, string>,
): Restaurant {
  const original = getOriginalFields(restaurant);

  return {
    ...restaurant,
    description: cache[original.description] ?? original.description,
    descriptionJa: original.description,
    address: original.address
      ? cache[original.address] ?? original.address
      : undefined,
    addressJa: original.address,
    openingHours: original.openingHours
      ? cache[original.openingHours] ?? original.openingHours
      : undefined,
    openingHoursJa: original.openingHours,
    budget: original.budget ? cache[original.budget] ?? original.budget : undefined,
    budgetJa: original.budget,
  };
}

export async function translateRestaurants(
  restaurants: Restaurant[],
  signal?: AbortSignal,
): Promise<Restaurant[]> {
  const cache = readTranslationCache();
  const missingTexts = getUniqueTexts(restaurants).filter((text) => !cache[text]);

  for (let index = 0; index < missingTexts.length; index += maximumTextsPerRequest) {
    const batch = missingTexts.slice(index, index + maximumTextsPerRequest);

    try {
      const translations = await requestTranslations(batch, signal);

      batch.forEach((text, translationIndex) => {
        cache[text] = translations[translationIndex];
      });
      saveTranslationCache(cache);
    } catch (error: unknown) {
      if (signal?.aborted) {
        throw error;
      }

      // Keep cached translations and use Japanese for every failed text.
      break;
    }
  }

  return restaurants.map((restaurant) => applyTranslations(restaurant, cache));
}
