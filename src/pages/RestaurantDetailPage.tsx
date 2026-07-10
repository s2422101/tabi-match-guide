import { Link, useParams, useSearchParams } from "react-router-dom";
import { restaurants } from "../data/restaurants";
import type { RestaurantFeature } from "../types/restaurant";
import {
  featureLabels,
  featureLabelsJa,
} from "../utils/features";
import { calculateMatchScore } from "../utils/match";

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
  const restaurant = restaurants.find(
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
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.nameEn} ${restaurant.area} Japan`,
  )}`;

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

        <a
          href={mapUrl}
          className="map-button"
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps
          <span>Googleマップで開く</span>
        </a>
      </section>
    </main>
  );
}
