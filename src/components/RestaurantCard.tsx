import { Link } from "react-router-dom";
import type {
  Restaurant,
  RestaurantFeature,
} from "../types/restaurant";
import { featureLabels } from "../utils/features";

type Props = {
  restaurant: Restaurant;
  selectedFeatures: RestaurantFeature[];
  matchScore: number;
};

export function RestaurantCard({
  restaurant,
  selectedFeatures,
  matchScore,
}: Props) {
  const detailPath =
    selectedFeatures.length > 0
      ? `/restaurants/${restaurant.id}?features=${selectedFeatures.join(",")}`
      : `/restaurants/${restaurant.id}`;

  return (
    <article className="restaurant-card">
      <img
        src={restaurant.imageUrl}
        alt={restaurant.nameEn}
        className="restaurant-image"
      />

      <div className="restaurant-content">
        <div className="restaurant-heading">
          <div>
            <p className="restaurant-area">
              {restaurant.area} · {restaurant.genre}
            </p>

            <h3>{restaurant.nameEn}</h3>

            <p className="restaurant-name-ja">
              {restaurant.nameJa}
            </p>
          </div>

          <div className="match-score">
            <strong>{matchScore}%</strong>
            <span>Match</span>
          </div>
        </div>

        <p>{restaurant.description}</p>

        <div className="match-details">
          {selectedFeatures.map((feature) => {
            const isMatched =
              restaurant.features.includes(feature);

            return (
              <span
                className={
                  isMatched
                    ? "feature matched"
                    : "feature unmatched"
                }
                key={feature}
              >
                {isMatched ? "✓" : "△"} {featureLabels[feature]}
              </span>
            );
          })}
        </div>

        <Link to={detailPath} className="details-button">
          View restaurant
        </Link>
      </div>
    </article>
  );
}
