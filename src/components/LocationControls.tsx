import type { RestaurantSort } from "../types/restaurant";
import { useLocation } from "../location/useLocation";

type Props = {
  selectedSort: RestaurantSort;
};

export function LocationControls({ selectedSort }: Props) {
  const { status, requestLocation } = useLocation();
  const isLoading = status === "loading";
  const isUnavailable = status === "unavailable";

  const buttonLabel = isLoading
    ? ["Getting location...", "現在地を取得しています…"]
    : status === "success"
      ? ["Update location", "現在地を再取得する"]
      : isUnavailable
        ? ["Location unavailable", "位置情報を利用できません"]
        : ["Use my location", "現在地を使用する"];

  return (
    <div className="location-controls">
      <button
        type="button"
        className="location-button"
        onClick={requestLocation}
        disabled={isLoading || isUnavailable}
      >
        <strong>{buttonLabel[0]}</strong>
        <span>{buttonLabel[1]}</span>
      </button>

      <div className="location-message" aria-live="polite">
        {status === "success" && (
          <p className="location-success">
            <strong>Location available</strong>
            <span>現在地を取得済み</span>
          </p>
        )}
        {status === "denied" && (
          <p className="location-guidance">
            <strong>Location permission was not granted.</strong>
            <span>位置情報の使用が許可されませんでした。</span>
            <small>
              You can continue using other sorting options.
              <span>他の並べ替え機能は引き続き利用できます。</span>
            </small>
          </p>
        )}
        {status === "unavailable" && (
          <p className="location-guidance">
            <strong>Location is not available in this browser.</strong>
            <span>このブラウザでは位置情報を利用できません。</span>
          </p>
        )}
        {status === "error" && (
          <p className="location-guidance">
            <strong>Could not get your location. Please try again.</strong>
            <span>現在地を取得できませんでした。もう一度お試しください。</span>
          </p>
        )}
        {selectedSort === "distance" && status === "idle" && (
          <p className="location-guidance">
            <strong>Enable location to sort by distance.</strong>
            <span>距離順を利用するには現在地を取得してください。</span>
          </p>
        )}
        {selectedSort === "distance" && status === "loading" && (
          <p className="location-guidance">
            <strong>Distance sorting will start when your location is ready.</strong>
            <span>現在地を取得後、自動的に距離順へ並べ替えます。</span>
          </p>
        )}
      </div>

      <p className="location-privacy-note">
        Straight-line distance. Your location is used only on this device.
        <span>直線距離の目安です。現在地はこの端末内の距離計算にのみ使用します。</span>
      </p>
    </div>
  );
}
