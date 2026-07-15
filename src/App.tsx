import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { HotpepperAttribution } from "./components/HotpepperAttribution";
import { PreferenceForm } from "./components/PreferenceForm";
import { RestaurantCard } from "./components/RestaurantCard";
import {
  fetchHotpepperRestaurants,
  isHotpepperApiConfigured,
  type SearchArea,
} from "./services/hotpepperApi";
import type { RestaurantFeature } from "./types/restaurant";
import { calculateMatchScore } from "./utils/match";
import {
  cacheApiRestaurants,
  getSampleRestaurants,
  mergeRestaurantsWithSaved,
} from "./utils/restaurantStorage";

function App() {
  const hasApiKey = isHotpepperApiConfigured();
  const [restaurants, setRestaurants] = useState(getSampleRestaurants);
  const [selectedFeatures, setSelectedFeatures] = useState<
    RestaurantFeature[]
  >([]);
  const [selectedArea, setSelectedArea] = useState<SearchArea>("all");
  const [isLoading, setIsLoading] = useState(hasApiKey);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!hasApiKey) {
      setRestaurants(getSampleRestaurants());
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage(null);

    void fetchHotpepperRestaurants(selectedArea, controller.signal)
      .then((fetchedRestaurants) => {
        cacheApiRestaurants(fetchedRestaurants);
        setRestaurants(mergeRestaurantsWithSaved(fetchedRestaurants));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setRestaurants([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load restaurants.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [hasApiKey, retryCount, selectedArea]);

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
        matchScore: calculateMatchScore(restaurant, selectedFeatures),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [restaurants, selectedFeatures, selectedArea]);

  const hasApiRestaurants = rankedRestaurants.some(
    ({ restaurant }) => restaurant.isApiRestaurant,
  );

  return (
    <main>
      <header className="hero">
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
            onClick={() => setSelectedArea("all")}
          >
            <strong>All Areas</strong>
            <span>すべてのエリア</span>
          </button>
          <button
            type="button"
            className={selectedArea === "Asakusa" ? "area-button active" : "area-button"}
            onClick={() => setSelectedArea("Asakusa")}
          >
            <strong>Asakusa</strong>
            <span>浅草</span>
          </button>
          <button
            type="button"
            className={selectedArea === "Ueno" ? "area-button active" : "area-button"}
            onClick={() => setSelectedArea("Ueno")}
          >
            <strong>Ueno</strong>
            <span>上野</span>
          </button>
        </div>

        {!hasApiKey && (
          <p className="sample-mode-note">
            Sample data mode
            <span>APIキー未設定のためサンプル店舗を表示しています。</span>
          </p>
        )}
      </section>

      <PreferenceForm
        selectedFeatures={selectedFeatures}
        onChange={setSelectedFeatures}
      />

      <section className="results-section">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Restaurant Matches</p>
            <h2>Recommended restaurants</h2>
            <p className="section-title-ja">おすすめの飲食店</p>
          </div>

          {!isLoading && !errorMessage && (
            <p className="result-count">
              {rankedRestaurants.length} restaurants found
              <span className="result-count-ja">
                {rankedRestaurants.length}件の飲食店
              </span>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="results-status" aria-live="polite">
            <strong>Loading restaurants...</strong>
            <span>店舗情報を読み込んでいます…</span>
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
            {rankedRestaurants.map(({ restaurant, matchScore }) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                selectedFeatures={selectedFeatures}
                matchScore={matchScore}
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
