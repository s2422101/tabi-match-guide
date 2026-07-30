import { type ReactNode, useCallback, useState } from "react";
import { isValidCoordinates, type Coordinates } from "../utils/distance";
import {
  LocationContext,
  type LocationStatus,
} from "./locationContextValue";
import {
  clearSessionLocation,
  readSessionLocation,
  writeSessionLocation,
} from "./locationStorage";

function isGeolocationAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    typeof navigator.geolocation?.getCurrentPosition === "function"
  );
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    readSessionLocation,
  );
  const [status, setStatus] = useState<LocationStatus>(() => {
    if (coordinates) {
      return "success";
    }

    return isGeolocationAvailable() ? "idle" : "unavailable";
  });

  const requestLocation = useCallback(() => {
    if (!isGeolocationAvailable()) {
      setStatus("unavailable");
      return;
    }

    setStatus("loading");
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextCoordinates: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          if (!isValidCoordinates(nextCoordinates)) {
            setCoordinates(null);
            setStatus("error");
            clearSessionLocation();
            return;
          }

          setCoordinates(nextCoordinates);
          setStatus("success");
          writeSessionLocation(nextCoordinates);
        },
        (error) => {
          setCoordinates(null);
          clearSessionLocation();

          if (error.code === error.PERMISSION_DENIED) {
            setStatus("denied");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setStatus("unavailable");
          } else {
            setStatus("error");
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 5 * 60 * 1000,
        },
      );
    } catch {
      setCoordinates(null);
      clearSessionLocation();
      setStatus("error");
    }
  }, []);

  return (
    <LocationContext.Provider value={{ status, coordinates, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}
