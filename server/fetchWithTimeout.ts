import { ApiError } from "./errors.js";

const defaultTimeoutMs = 10_000;
const minimumTimeoutMs = 1_000;
const maximumTimeoutMs = 30_000;

export function getApiTimeoutMs(): number {
  const configuredTimeout = Number(process.env.API_TIMEOUT_MS);

  if (
    Number.isFinite(configuredTimeout) &&
    configuredTimeout >= minimumTimeoutMs &&
    configuredTimeout <= maximumTimeoutMs
  ) {
    return configuredTimeout;
  }

  return defaultTimeoutMs;
}

export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, getApiTimeoutMs());
  const requestSignal = init.signal;
  const abortFromRequest = () => controller.abort();

  if (requestSignal?.aborted) {
    controller.abort();
  } else {
    requestSignal?.addEventListener("abort", abortFromRequest, { once: true });
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error: unknown) {
    if (timedOut) {
      throw new ApiError(
        504,
        "UPSTREAM_TIMEOUT",
        "The external API request timed out.",
      );
    }

    if (requestSignal?.aborted) {
      throw error;
    }

    throw new ApiError(
      502,
      "UPSTREAM_UNAVAILABLE",
      "Could not connect to the external API.",
    );
  } finally {
    clearTimeout(timeout);
    requestSignal?.removeEventListener("abort", abortFromRequest);
  }
}
