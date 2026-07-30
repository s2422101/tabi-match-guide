import {
  isValidCoordinates,
  type Coordinates,
} from "../utils/distance";

const LOCATION_SESSION_KEY = "tabi-match-guide:location:v1";
const LOCATION_MAX_AGE_MS = 30 * 60 * 1000;

type StoredLocation = Coordinates & {
  timestamp: number;
};

function isStoredLocation(value: unknown): value is StoredLocation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredLocation>;
  return (
    isValidCoordinates({
      latitude: candidate.latitude ?? Number.NaN,
      longitude: candidate.longitude ?? Number.NaN,
    }) &&
    typeof candidate.timestamp === "number" &&
    Number.isFinite(candidate.timestamp) &&
    candidate.timestamp > 0 &&
    Date.now() - candidate.timestamp <= LOCATION_MAX_AGE_MS &&
    candidate.timestamp - Date.now() < 60_000
  );
}

export function readSessionLocation(): Coordinates | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.sessionStorage.getItem(LOCATION_SESSION_KEY);

    if (!saved) {
      return null;
    }

    const parsed: unknown = JSON.parse(saved);

    if (!isStoredLocation(parsed)) {
      window.sessionStorage.removeItem(LOCATION_SESSION_KEY);
      return null;
    }

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };
  } catch {
    return null;
  }
}

export function writeSessionLocation(coordinates: Coordinates): void {
  if (typeof window === "undefined" || !isValidCoordinates(coordinates)) {
    return;
  }

  try {
    const value: StoredLocation = {
      ...coordinates,
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(LOCATION_SESSION_KEY, JSON.stringify(value));
  } catch {
    // Storage availability must not prevent in-memory distance calculation.
  }
}

export function clearSessionLocation(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(LOCATION_SESSION_KEY);
  } catch {
    // Unavailable storage requires no cleanup action.
  }
}
