import { useLocation } from "../location/useLocation";
import type { Restaurant } from "../types/restaurant";
import { calculateDistanceKm, formatDistance } from "../utils/distance";

export function RestaurantDistance({ restaurant }: { restaurant: Restaurant }) {
  const { coordinates, status } = useLocation();

  if (status !== "success" || !coordinates) {
    return null;
  }

  const distanceKm = calculateDistanceKm(coordinates, {
    latitude: restaurant.latitude ?? Number.NaN,
    longitude: restaurant.longitude ?? Number.NaN,
  });
  const formattedDistance =
    distanceKm === null ? null : formatDistance(distanceKm);

  if (!formattedDistance) {
    return null;
  }

  return (
    <div className="distance-info-item">
      <dt>
        Distance <small>現在地からの距離</small>
      </dt>
      <dd className="distance-value">
        <strong>Approx. {formattedDistance} away</strong>
        <small>現在地から約{formattedDistance}</small>
      </dd>
    </div>
  );
}
