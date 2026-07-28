import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { FeatureStatusItem } from "../components/FeatureStatusItem";
import { HotpepperAttribution } from "../components/HotpepperAttribution";
import { MatchSummary } from "../components/MatchSummary";
import { getFeatureStatus } from "../utils/features";
import { calculateMatchResult } from "../utils/match";
import { getRestaurants } from "../utils/restaurantStorage";
import { hydrateRestaurantsWithSupport } from "../services/restaurantSupportApi";
import {
  findRestaurantByRouteId,
  getRestaurantCanonicalId,
} from "../utils/restaurantId";
import {
  canNavigateBack,
  getFeaturesFromSearchParams,
  getListPath,
  getReturnPath,
  type ReturnNavigationState,
} from "../utils/restaurantSearch";

export function RestaurantDetailPage() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(() =>
    findRestaurantByRouteId(getRestaurants(), restaurantId),
  );
  const listFallbackPath = getListPath(searchParams);
  const returnPath = getReturnPath(location.state);

  useEffect(() => {
    const controller = new AbortController();
    const baseRestaurant = findRestaurantByRouteId(
      getRestaurants(),
      restaurantId,
    );
    setRestaurant(baseRestaurant);

    if (baseRestaurant) {
      const canonicalId = getRestaurantCanonicalId(baseRestaurant);
      if (restaurantId !== canonicalId) {
        navigate(`/restaurants/${canonicalId}${location.search}`, {
          replace: true,
          state: location.state,
        });
      }

      void hydrateRestaurantsWithSupport([baseRestaurant], controller.signal).then(
        ([hydratedRestaurant]) => {
          if (!controller.signal.aborted && hydratedRestaurant) {
            setRestaurant(hydratedRestaurant);
          }
        },
      );
    }

    return () => controller.abort();
  }, [location.search, location.state, navigate, restaurantId]);

  const handleBackToList = () => {
    if (returnPath && canNavigateBack()) {
      navigate(-1);
      return;
    }

    navigate(listFallbackPath);
  };

  if (!restaurant) {
    return (
      <main className="detail-page">
        <section className="detail-not-found">
          <p className="eyebrow">Restaurant not found</p>
          <h1>We could not find this restaurant.</h1>
          <p className="detail-ja">
            指定された飲食店が見つかりませんでした。
          </p>
          <button
            type="button"
            className="detail-back-button"
            onClick={handleBackToList}
          >
            <strong>Back to restaurant list</strong>
            <span>店舗一覧へ戻る</span>
          </button>
        </section>
      </main>
    );
  }

  const selectedFeatures = getFeaturesFromSearchParams(searchParams);
  const matchResult = calculateMatchResult(
    restaurant,
    selectedFeatures,
  );
  const mapQuery =
    typeof restaurant.latitude === "number" &&
    typeof restaurant.longitude === "number"
      ? `${restaurant.latitude},${restaurant.longitude}`
      : restaurant.address || `${restaurant.nameEn} ${restaurant.area} Japan`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const canonicalRestaurantId = getRestaurantCanonicalId(restaurant);
  const editPath = `/restaurants/${canonicalRestaurantId}/edit${
    searchParams.size > 0 ? `?${searchParams.toString()}` : ""
  }`;
  const detailPath = `${location.pathname}${location.search}`;
  const editReturnState: ReturnNavigationState = { from: detailPath };

  return (
    <main className="detail-page">
      <nav className="detail-top-navigation" aria-label="Restaurant navigation">
        <button
          type="button"
          className="detail-back-button"
          onClick={handleBackToList}
        >
          <strong>Back to restaurant list</strong>
          <span>店舗一覧へ戻る</span>
        </button>
      </nav>

      <section className="detail-hero">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.nameEn}
          className="detail-image"
        />

        <div className="detail-summary">
          <p className="restaurant-area">
            {restaurant.area} · {restaurant.genre}
          </p>

          <h1>{restaurant.nameEn}</h1>
          <p className="detail-name-ja">{restaurant.nameJa}</p>

          <div className="detail-score">
            <MatchSummary result={matchResult} />
          </div>

          <Link
            to={editPath}
            state={editReturnState}
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
          <p className="detail-description translated-content">
            <span>{restaurant.description}</span>
            {restaurant.descriptionJa &&
              restaurant.descriptionJa !== restaurant.description && (
                <small>{restaurant.descriptionJa}</small>
              )}
          </p>
        </div>

        {(restaurant.address || restaurant.openingHours || restaurant.budget) && (
          <dl className="detail-info-grid">
            {restaurant.address && (
              <div>
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
              <div>
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
              <div>
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
          </dl>
        )}

        <div>
          <p className="eyebrow">Condition verification</p>
          <h2>Selected condition status</h2>
          <p className="section-title-ja">選択条件の確認状況</p>

          <div className="detail-feature-list">
            {selectedFeatures.length > 0 ? (
              selectedFeatures.map((feature) => (
                <FeatureStatusItem
                  feature={feature}
                  status={getFeatureStatus(restaurant, feature)}
                  key={feature}
                />
              ))
            ) : (
              <p className="no-selected-conditions">
                No conditions selected
                <small>条件が選択されていません</small>
              </p>
            )}
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
