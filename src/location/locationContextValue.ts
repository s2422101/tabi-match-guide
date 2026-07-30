import { createContext } from "react";
import type { Coordinates } from "../utils/distance";

export type LocationStatus =
  | "idle"
  | "loading"
  | "success"
  | "denied"
  | "unavailable"
  | "error";

export type LocationContextValue = {
  status: LocationStatus;
  coordinates: Coordinates | null;
  requestLocation: () => void;
};

export const LocationContext = createContext<LocationContextValue | null>(null);
