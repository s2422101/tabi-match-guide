import { Link, useParams, useSearchParams } from "react-router-dom";
import { HotpepperAttribution } from "../components/HotpepperAttribution";
import type { RestaurantFeature } from "../types/restaurant";
import {
  featureLabels,
  featureLabelsJa,
} from "../utils/features";
import { calculateMatchScore } from "../utils/match";
import { getRestaurants } from "../utils/restaurantStorage";

const validFeatures: RestaurantFeature[] = [
  "credit_card",
  "non_smoking",
  "english_guide",
  "wifi",
  "takeout",
  "vegetarian",
  "vegan",
  "pork_free",
  "alcohol_free",
];

function getSelectedFeaturesFromSearchParams(
  featuresParam: string | null,
): RestaurantFeature[] {
  if (!featuresParam) {
    return [];
  }

  return featuresParam
    .split(",")
    .filter((feature): feature is RestaurantFeature =>
      validFeatures.includes(feature as RestaurantFeature),
    );
}

export function RestaurantDetailPage() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const restaurant = getRestaurants().find(
    (item) => item.id === Number(restaurantId),
  );

  if (!restaurant) {
    return (
      <main className="detail-page">
        <section className="detail-not-found">
          <p className="eyebrow">Restaurant not found</p>
          <h1>We could not find this restaurant.</h1>
          <p className="detail-ja">
            指定された飲食店が見つかりませんでした。
          </p>
          <Link to="/" className="back-link">
            Back to restaurant list
          </Link>
        </section>
      </main>
    );
  }

  const selectedFeatures = getSelectedFeaturesFromSearchParams(
    searchParams.get("features"),
  );
  const matchScore = calculateMatchScore(
    restaurant,
    selectedFeatures,
  );
  const mapQuery =
    typeof restaurant.latitude === "number" &&
    typeof restaurant.longitude === "number"
      ? `${restaurant.latitude},${restaurant.longitude}`
      : restaurant.address || `${restaurant.nameEn} ${restaurant.area} Japan`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const editPath = `/restaurants/${restaurant.id}/edit${
    searchParams.size > 0 ? `?${searchParams.toString()}` : ""
  }`;

  return (
    <main className="detail-page">
      <section className="detail-hero">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.nameEn}
          className="detail-image"
        />

        <div className="detail-summary">
          <Link to="/" className="back-link">
            Back to restaurant list
          </Link>

          <p className="restaurant-area">
            {restaurant.area} · {restaurant.genre}
          </p>

          <h1>{restaurant.nameEn}</h1>
          <p className="detail-name-ja">{restaurant.nameJa}</p>

          <div className="match-score detail-score">
            <strong>{matchScore}%</strong>
            <span>Match</span>
          </div>

          <Link
            to={editPath}
            className="edit-button"
          >
            Edit restaurant information
            <span>店舗情報を編集</span>
          </Link>
        </div>
      </section>

      <section className="detail-content">
        <div>
          <p className="eyebrow">About</p>
          <h2>Restaurant information</h2>
          <p className="section-title-ja">店舗情報</p>
          <p className="detail-description">
            {restaurant.description}
          </p>
        </div>

        {(restaurant.address || restaurant.openingHours || restaurant.budget) && (
          <dl className="detail-info-grid">
            {restaurant.address && (
              <div>
                <dt>Address <small>住所</small></dt>
                <dd>{restaurant.address}</dd>
              </div>
            )}
            {restaurant.openingHours && (
              <div>
                <dt>Opening hours <small>営業時間</small></dt>
                <dd>{restaurant.openingHours}</dd>
              </div>
            )}
            {restaurant.budget && (
              <div>
                <dt>Budget <small>予算</small></dt>
                <dd>{restaurant.budget}</dd>
              </div>
            )}
          </dl>
        )}

        <div>
          <p className="eyebrow">Available conditions</p>
          <h2>Supported needs</h2>
          <p className="section-title-ja">対応条件</p>

          <div className="detail-feature-list">
            {restaurant.features.map((feature) => (
              <span className="feature matched" key={feature}>
                {featureLabels[feature]}
                <small>{featureLabelsJa[feature]}</small>
              </span>
            ))}
          </div>
        </div>

        <div className="detail-link-actions">
          <a
            href={mapUrl}
            className="map-button"
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
            <span>Googleマップで開く</span>
          </a>

          {restaurant.sourceUrl && (
            <a
              href={restaurant.sourceUrl}
              className="hotpepper-button"
              target="_blank"
              rel="noreferrer"
            >
              Open in Hot Pepper Gourmet
              <span>ホットペッパーグルメで開く</span>
            </a>
          )}
        </div>

        {restaurant.isApiRestaurant && <HotpepperAttribution />}
      </section>
    </main>
  );
}
