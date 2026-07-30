import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { divIcon, latLngBounds } from "leaflet";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates } from "../utils/distance";
import {
  calculateDistanceKm,
  formatDistance,
  isValidCoordinates,
} from "../utils/distance";
import { getRestaurantCanonicalId } from "../utils/restaurantId";
import type { RestaurantResult } from "../utils/restaurantSort";
import type { ReturnNavigationState } from "../utils/restaurantSearch";

type Props = {
  results: RestaurantResult[];
  userCoordinates: Coordinates | null;
  detailQuery: string;
  returnPath: string;
};

type RestaurantPin = RestaurantResult & {
  position: [number, number];
};

const defaultCenter: [number, number] = [35.705, 139.79];
const restaurantIcon = divIcon({
  className: "restaurant-map-marker",
  html: '<span aria-hidden="true">●</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -13],
});
const userLocationIcon = divIcon({
  className: "user-location-map-marker",
  html: '<span aria-hidden="true">●</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -14],
});

function MapViewport({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 15, { animate: false });
      return;
    }

    if (positions.length > 1) {
      map.fitBounds(latLngBounds(positions), {
        animate: false,
        maxZoom: 15,
        padding: [28, 28],
      });
    }
  }, [map, positions]);

  return null;
}

export function RestaurantResultsMap({
  results,
  userCoordinates,
  detailQuery,
  returnPath,
}: Props) {
  const pins = useMemo<RestaurantPin[]>(
    () =>
      results.flatMap((result) => {
        const coordinates = {
          latitude: result.restaurant.latitude ?? Number.NaN,
          longitude: result.restaurant.longitude ?? Number.NaN,
        };

        return isValidCoordinates(coordinates)
          ? [{ ...result, position: [coordinates.latitude, coordinates.longitude] }]
          : [];
      }),
    [results],
  );
  const validUserCoordinates = isValidCoordinates(userCoordinates)
    ? userCoordinates
    : null;
  const positions = useMemo<[number, number][]>(() => {
    const restaurantPositions = pins.map(({ position }) => position);

    return validUserCoordinates
      ? [
          ...restaurantPositions,
          [validUserCoordinates.latitude, validUserCoordinates.longitude],
        ]
      : restaurantPositions;
  }, [pins, validUserCoordinates]);

  if (pins.length === 0) {
    return (
      <div className="map-empty-state" role="status">
        <strong>No restaurant location data is available.</strong>
        <span>表示できる店舗位置がありません。</span>
      </div>
    );
  }

  const returnState: ReturnNavigationState = { from: returnPath };

  return (
    <div
      className="restaurant-results-map"
      role="region"
      aria-label="Restaurant locations map / 店舗位置の地図"
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        attributionControl={false}
        className="leaflet-results-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AttributionControl position="bottomleft" prefix={false} />
        <MapViewport positions={positions} />

        {pins.map(({ restaurant, matchResult, position }) => {
          const restaurantId = getRestaurantCanonicalId(restaurant);
          const detailsPath = `/restaurants/${restaurantId}${
            detailQuery ? `?${detailQuery}` : ""
          }`;
          const distanceKm = validUserCoordinates
            ? calculateDistanceKm(validUserCoordinates, {
                latitude: position[0],
                longitude: position[1],
              })
            : null;
          const formattedDistance =
            distanceKm === null ? null : formatDistance(distanceKm);

          return (
            <Marker
              position={position}
              icon={restaurantIcon}
              title={restaurant.nameEn}
              alt={`${restaurant.nameEn} restaurant location`}
              key={restaurantId}
            >
              <Popup maxWidth={270} minWidth={210}>
                <div className="map-popup-content">
                  <strong>{restaurant.nameEn}</strong>
                  <small>{restaurant.nameJa}</small>
                  <span>{restaurant.genre}</span>
                  <dl>
                    <div>
                      <dt>Confirmed match</dt>
                      <dd>
                        {matchResult.score === null
                          ? "Not enough information"
                          : `${matchResult.score}%`}
                      </dd>
                    </div>
                    <div>
                      <dt>Information coverage</dt>
                      <dd>
                        {matchResult.informationCoverage === null
                          ? "Not calculated"
                          : `${matchResult.informationCoverage}%`}
                      </dd>
                    </div>
                  </dl>
                  {formattedDistance && (
                    <p>
                      Approx. {formattedDistance} away
                      <small>現在地から約{formattedDistance}</small>
                    </p>
                  )}
                  <Link
                    to={detailsPath}
                    state={returnState}
                    className="map-details-link"
                  >
                    <strong>View details</strong>
                    <span>詳細を見る</span>
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {validUserCoordinates && (
          <Marker
            position={[
              validUserCoordinates.latitude,
              validUserCoordinates.longitude,
            ]}
            icon={userLocationIcon}
            title="Your location"
            alt="Your current location"
            zIndexOffset={1000}
          >
            <Popup>
              <div className="map-user-location-popup">
                <strong>Your location</strong>
                <span>現在地</span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
