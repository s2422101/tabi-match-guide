import { ApiError } from "./errors.js";
import { fetchWithTimeout } from "./fetchWithTimeout.js";

type DeepLResponse = {
  translations?: Array<{
    detected_source_language?: string;
    text?: string;
  }>;
  message?: string;
};

export async function translateTexts(
  texts: string[],
  signal?: AbortSignal,
): Promise<DeepLResponse> {
  const apiKey = process.env.DEEPL_API_KEY?.trim();

  if (!apiKey) {
    throw new ApiError(
      503,
      "DEEPL_API_KEY_MISSING",
      "DeepL API key is not configured on the server.",
    );
  }

  const host = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";
  const response = await fetchWithTimeout(`${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texts,
      source_lang: "JA",
      target_lang: "EN-US",
    }),
    signal,
  });

  let data: DeepLResponse;

  try {
    data = (await response.json()) as DeepLResponse;
  } catch {
    throw new ApiError(
      502,
      "DEEPL_INVALID_RESPONSE",
      "DeepL API returned invalid JSON.",
    );
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      "DEEPL_UPSTREAM_ERROR",
      data.message || `DeepL API request failed (${response.status}).`,
    );
  }

  if (!data.translations || data.translations.length !== texts.length) {
    throw new ApiError(
      502,
      "DEEPL_INVALID_RESPONSE",
      "DeepL API returned an invalid translation response.",
    );
  }

  return data;
}
