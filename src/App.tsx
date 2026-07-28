import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./App.css";
import { HotpepperAttribution } from "./components/HotpepperAttribution";
import { PreferenceForm } from "./components/PreferenceForm";
import { RestaurantCard } from "./components/RestaurantCard";
import { AdminAuthActions } from "./components/AdminAuthActions";
import { FavoritesLink } from "./components/FavoritesLink";
import { translateRestaurants } from "./services/deeplApi";
import {
  fetchHotpepperRestaurants,
  RestaurantApiError,
} from "./services/hotpepperApi";
import { hydrateRestaurantsWithSupport } from "./services/restaurantSupportApi";
import type {
  RestaurantFeature,
  SearchArea,
} from "./types/restaurant";
import { calculateMatchResult } from "./utils/match";
import {
  cacheApiRestaurants,
  getSampleRestaurants,
} from "./utils/restaurantStorage";
import {
  getAreaFromSearchParams,
  getFeaturesFromSearchParams,
} from "./utils/restaurantSearch";
import { getRestaurantCanonicalId } from "./utils/restaurantId";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState(getSampleRestaurants);
  const selectedFeatures = useMemo(
    () => getFeaturesFromSearchParams(searchParams),
    [searchParams],
  );
  const selectedArea = useMemo(
    () => getAreaFromSearchParams(searchParams),
    [searchParams],
  );
  const [loadingState, setLoadingState] = useState<
    "restaurants" | "translation" | "support" | null
  >("restaurants");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSampleMode, setIsSampleMode] = useState(false);

  const handleAreaChange = (area: SearchArea) => {
    const nextParams = new URLSearchParams(searchParams);

    if (area === "all") {
      nextParams.delete("area");
    } else {
      nextParams.set("area", area);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleFeaturesChange = (features: RestaurantFeature[]) => {
    const nextParams = new URLSearchParams(searchParams);

    if (features.length === 0) {
      nextParams.delete("features");
    } else {
      nextParams.set("features", features.join(","));
    }

    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoadingState("restaurants");
    setErrorMessage(null);
    setIsSampleMode(false);

    void (async () => {
      try {
        const fetchedRestaurants = await fetchHotpepperRestaurants(
          selectedArea,
          controller.signal,
        );
        let displayRestaurants = fetchedRestaurants;

        setLoadingState("translation");
        displayRestaurants = await translateRestaurants(
          fetchedRestaurants,
          controller.signal,
        );

        cacheApiRestaurants(displayRestaurants);
        setLoadingState("support");
        setRestaurants(
          await hydrateRestaurantsWithSupport(displayRestaurants, controller.signal),
        );
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        if (
          error instanceof RestaurantApiError &&
          error.code === "HOTPEPPER_API_KEY_MISSING"
        ) {
          setLoadingState("support");
          setRestaurants(
            await hydrateRestaurantsWithSupport(
              getSampleRestaurants(),
              controller.signal,
            ),
          );
          setIsSampleMode(true);
          return;
        }

        setRestaurants([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load restaurants.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingState(null);
        }
      }
    })();

    return () => controller.abort();
  }, [retryCount, selectedArea]);

  const rankedRestaurants = useMemo(() => {
    return restaurants
      .filter((restaurant) => {
        if (selectedArea === "all") {
          return true;
        }

        return restaurant.area === selectedArea;
      })
      .map((restaurant) => ({
        restaurant,
        matchResult: calculateMatchResult(restaurant, selectedFeatures),
      }))
      .sort((a, b) => {
        const scoreDifference =
          (b.matchResult.score ?? -1) - (a.matchResult.score ?? -1);

        return scoreDifference !== 0
          ? scoreDifference
          : b.matchResult.confirmedCount - a.matchResult.confirmedCount;
      });
  }, [restaurants, selectedFeatures, selectedArea]);

  const hasApiRestaurants = rankedRestaurants.some(
    ({ restaurant }) => restaurant.isApiRestaurant,
  );

  return (
    <main>
      <header className="hero">
        <div className="hero-admin-actions">
          <FavoritesLink />
          <AdminAuthActions />
        </div>
        <p className="eyebrow">TabiMatch Guide</p>
        <h1>Find a restaurant that fits your needs.</h1>
        <p className="hero-ja">あなたの条件に合う日本の飲食店を探す</p>
        <p className="hero-description">
          Discover Japanese restaurants based on your dietary needs, payment
          preferences and required facilities.
          <span className="hero-description-ja">
            食習慣、避けたい食材、支払い方法、店内設備などから、
            自分に合った飲食店を検索できます。
          </span>
        </p>
      </header>

      <section className="area-section">
        <div className="area-heading">
          <h2>Select an area</h2>
          <p>エリアを選択してください</p>
        </div>

        <div className="area-buttons">
          <button
            type="button"
            className={selectedArea === "all" ? "area-button active" : "area-button"}
            onClick={() => handleAreaChange("all")}
          >
            <strong>All Areas</strong>
            <span>すべてのエリア</span>
          </button>
          <button
            type="button"
            className={selectedArea === "Asakusa" ? "area-button active" : "area-button"}
            onClick={() => handleAreaChange("Asakusa")}
          >
            <strong>Asakusa</strong>
            <span>浅草</span>
          </button>
          <button
            type="button"
            className={selectedArea === "Ueno" ? "area-button active" : "area-button"}
            onClick={() => handleAreaChange("Ueno")}
          >
            <strong>Ueno</strong>
            <span>上野</span>
          </button>
        </div>

        {isSampleMode && (
          <p className="sample-mode-note">
            Sample data mode
            <span>APIキー未設定のためサンプル店舗を表示しています。</span>
          </p>
        )}
      </section>

      <PreferenceForm
        selectedFeatures={selectedFeatures}
        onChange={handleFeaturesChange}
      />

      <section className="results-section">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Restaurant Matches</p>
            <h2>Recommended restaurants</h2>
            <p className="section-title-ja">おすすめの飲食店</p>
          </div>

          {!loadingState && !errorMessage && (
            <p className="result-count">
              {rankedRestaurants.length} restaurants found
              <span className="result-count-ja">
                {rankedRestaurants.length}件の飲食店
              </span>
            </p>
          )}
        </div>

        {loadingState ? (
          <div className="results-status" aria-live="polite">
            <strong>
              {loadingState === "translation"
                ? "Loading translation..."
                : loadingState === "support"
                  ? "Loading restaurant support..."
                : "Loading restaurants..."}
            </strong>
            <span>
              {loadingState === "translation"
                ? "英語へ翻訳しています…"
                : loadingState === "support"
                  ? "店舗独自情報を読み込んでいます…"
                : "店舗情報を読み込んでいます…"}
            </span>
          </div>
        ) : errorMessage ? (
          <div className="results-status error-status" role="alert">
            <strong>Could not load restaurants.</strong>
            <span>店舗情報を取得できませんでした。</span>
            <small>{errorMessage}</small>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
              Retry
              <span>再試行</span>
            </button>
          </div>
        ) : (
          <div className="restaurant-list">
            {rankedRestaurants.map(({ restaurant, matchResult }) => (
              <RestaurantCard
                key={getRestaurantCanonicalId(restaurant)}
                restaurant={restaurant}
                selectedFeatures={selectedFeatures}
                matchResult={matchResult}
              />
            ))}
          </div>
        )}

        {hasApiRestaurants && <HotpepperAttribution />}
      </section>
    </main>
  );
}

export default App;
