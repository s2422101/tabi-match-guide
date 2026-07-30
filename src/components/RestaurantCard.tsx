import { useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FeatureStatusItem } from "./FeatureStatusItem";
import { MatchSummary } from "./MatchSummary";
import type {
  Restaurant,
  RestaurantFeature,
} from "../types/restaurant";
import { getFeatureStatus } from "../utils/features";
import type { MatchResult } from "../utils/match";
import type { ReturnNavigationState } from "../utils/restaurantSearch";
import { getRestaurantCanonicalId } from "../utils/restaurantId";
import { FavoriteButton } from "./FavoriteButton";
import { RestaurantDistance } from "./RestaurantDistance";

type Props = {
  restaurant: Restaurant;
  selectedFeatures: RestaurantFeature[];
  matchResult: MatchResult;
};

export function RestaurantCard({
  restaurant,
  selectedFeatures,
  matchResult,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandableContentId = useId();
  const location = useLocation();
  const listPath = `${location.pathname}${location.search}`;
  const restaurantId = getRestaurantCanonicalId(restaurant);
  const detailPath = `/restaurants/${restaurantId}${location.search}`;
  const returnState: ReturnNavigationState = { from: listPath };

  return (
    <article
      className={`restaurant-card${isExpanded ? " is-card-expanded" : ""}`}
    >
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

          <div className="restaurant-card-actions">
            <FavoriteButton restaurant={restaurant} />
            <MatchSummary result={matchResult} />
          </div>
        </div>

        {(restaurant.budget ||
          (typeof restaurant.latitude === "number" &&
            typeof restaurant.longitude === "number")) && (
          <dl className="mobile-compact-info">
            {restaurant.budget && (
              <div>
                <dt>Budget <small>予算</small></dt>
                <dd>{restaurant.budget}</dd>
              </div>
            )}
            <RestaurantDistance restaurant={restaurant} />
          </dl>
        )}

        <div id={expandableContentId} className="restaurant-expandable-content">
          <p className="translated-content restaurant-description">
            <span>{restaurant.description}</span>
            {restaurant.descriptionJa &&
              restaurant.descriptionJa !== restaurant.description && (
                <small>{restaurant.descriptionJa}</small>
              )}
          </p>

          {(restaurant.address ||
            restaurant.openingHours ||
            restaurant.budget ||
            (typeof restaurant.latitude === "number" &&
              typeof restaurant.longitude === "number")) && (
            <dl className="restaurant-info-grid">
              {restaurant.address && (
                <div className="restaurant-info-address">
                  <dt>Address <small>住所</small></dt>
                  <dd className="translated-content">
                    <span>{restaurant.address}</span>
                    {restaurant.addressJa &&
                      restaurant.addressJa !== restaurant.address && (
                        <small>{restaurant.addressJa}</small>
                      )}
                  </dd>
                </div>
              )}
              {restaurant.openingHours && (
                <div className="restaurant-info-opening-hours">
                  <dt>Opening hours <small>営業時間</small></dt>
                  <dd className="translated-content">
                    <span>{restaurant.openingHours}</span>
                    {restaurant.openingHoursJa &&
                      restaurant.openingHoursJa !== restaurant.openingHours && (
                        <small>{restaurant.openingHoursJa}</small>
                      )}
                  </dd>
                </div>
              )}
              {restaurant.budget && (
                <div className="restaurant-info-budget">
                  <dt>Budget <small>予算</small></dt>
                  <dd className="translated-content">
                    <span>{restaurant.budget}</span>
                    {restaurant.budgetJa &&
                      restaurant.budgetJa !== restaurant.budget && (
                        <small>{restaurant.budgetJa}</small>
                      )}
                  </dd>
                </div>
              )}
              <RestaurantDistance restaurant={restaurant} />
            </dl>
          )}

          <div className="match-details">
            {selectedFeatures.map((feature) => (
              <FeatureStatusItem
                feature={feature}
                status={getFeatureStatus(restaurant, feature)}
                key={feature}
              />
            ))}
          </div>
        </div>

        <div className="restaurant-card-footer-actions">
          <button
            type="button"
            className="card-expand-button"
            aria-expanded={isExpanded}
            aria-controls={expandableContentId}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            <strong>
              {isExpanded ? "Hide information" : "Show more information"}
            </strong>
            <span>{isExpanded ? "詳細情報を閉じる" : "詳細情報を表示"}</span>
          </button>

          <Link
            to={detailPath}
            state={returnState}
            className="details-button"
          >
            View restaurant
          </Link>
        </div>
      </div>
    </article>
  );
}
