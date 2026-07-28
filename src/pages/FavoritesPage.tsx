import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminAuthActions } from "../components/AdminAuthActions";
import { HotpepperAttribution } from "../components/HotpepperAttribution";
import { RestaurantCard } from "../components/RestaurantCard";
import { useFavorites } from "../favorites/useFavorites";
import { translateRestaurants } from "../services/deeplApi";
import { fetchHotpepperRestaurants } from "../services/hotpepperApi";
import { hydrateRestaurantsWithSupport } from "../services/restaurantSupportApi";
import type { Restaurant } from "../types/restaurant";
import { getRestaurantCanonicalId } from "../utils/restaurantId";
import {
  cacheApiRestaurants,
  getRestaurants,
} from "../utils/restaurantStorage";
import {
  getFeaturesFromSearchParams,
  getListPath,
} from "../utils/restaurantSearch";
import { calculateMatchResult } from "../utils/match";

export function FavoritesPage() {
  const { favoriteIds } = useFavorites();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(favoriteIds.length > 0);
  const [usedCachedData, setUsedCachedData] = useState(false);
  const hasFavorites = favoriteIds.length > 0;
  const selectedFeatures = useMemo(
    () => getFeaturesFromSearchParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    const controller = new AbortController();

    if (!hasFavorites) {
      setRestaurants([]);
      setIsLoading(false);
      setUsedCachedData(false);
      return () => controller.abort();
    }

    setIsLoading(true);
    setUsedCachedData(false);

    void (async () => {
      try {
        const fetched = await fetchHotpepperRestaurants("all", controller.signal);
        const translated = await translateRestaurants(fetched, controller.signal);
        cacheApiRestaurants(translated);
        const hydrated = await hydrateRestaurantsWithSupport(
          getRestaurants(),
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setRestaurants(hydrated);
        }
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        const hydrated = await hydrateRestaurantsWithSupport(
          getRestaurants(),
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setRestaurants(hydrated);
          setUsedCachedData(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [hasFavorites]);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const favoriteRestaurants = useMemo(
    () =>
      restaurants
        .filter((restaurant) =>
          favoriteIdSet.has(getRestaurantCanonicalId(restaurant)),
        )
        .map((restaurant) => ({
          restaurant,
          matchResult: calculateMatchResult(restaurant, selectedFeatures),
        })),
    [favoriteIdSet, restaurants, selectedFeatures],
  );
  const unavailableCount = Math.max(
    0,
    favoriteIds.length - favoriteRestaurants.length,
  );
  const hasApiRestaurants = favoriteRestaurants.some(
    ({ restaurant }) => restaurant.isApiRestaurant,
  );

  return (
    <main className="favorites-page">
      <header className="favorites-header">
        <nav className="favorites-top-navigation" aria-label="Favorites navigation">
          <Link to={getListPath(searchParams)} className="detail-back-button">
            <strong>Back to restaurant search</strong>
            <span>店舗検索へ戻る</span>
          </Link>
          <AdminAuthActions />
        </nav>

        <p className="eyebrow">Saved restaurants</p>
        <h1>Favorite restaurants</h1>
        <p className="section-title-ja">お気に入りの店舗</p>
      </header>

      <section className="favorites-content">
        {isLoading ? (
          <div className="results-status" aria-live="polite">
            <strong>Loading favorite restaurants...</strong>
            <span>お気に入りの店舗を読み込んでいます…</span>
          </div>
        ) : favoriteIds.length === 0 ? (
          <div className="favorites-empty">
            <span className="favorites-empty-heart" aria-hidden="true">♡</span>
            <strong>No favorite restaurants yet.</strong>
            <span>お気に入りの店舗はまだありません</span>
            <Link to={getListPath(searchParams)} className="details-button">
              Find restaurants
            </Link>
          </div>
        ) : (
          <>
            <div className="favorites-result-summary" aria-live="polite">
              <strong>{favoriteRestaurants.length} favorites available</strong>
              <span>{favoriteRestaurants.length}件のお気に入りを表示</span>
              {unavailableCount > 0 && (
                <small>
                  {unavailableCount} saved restaurant
                  {unavailableCount === 1 ? " is" : "s are"} currently unavailable.
                  <span>{unavailableCount}件の店舗情報を現在取得できません。</span>
                </small>
              )}
              {usedCachedData && (
                <small>
                  Showing available cached restaurant data.
                  <span>取得済みの店舗情報を表示しています。</span>
                </small>
              )}
            </div>

            {favoriteRestaurants.length > 0 ? (
              <div className="restaurant-list">
                {favoriteRestaurants.map(({ restaurant, matchResult }) => (
                  <RestaurantCard
                    key={getRestaurantCanonicalId(restaurant)}
                    restaurant={restaurant}
                    selectedFeatures={selectedFeatures}
                    matchResult={matchResult}
                  />
                ))}
              </div>
            ) : (
              <div className="favorites-empty">
                <strong>Saved restaurants are currently unavailable.</strong>
                <span>保存した店舗情報を現在取得できません。</span>
              </div>
            )}
          </>
        )}

        {hasApiRestaurants && <HotpepperAttribution />}
      </section>
    </main>
  );
}
