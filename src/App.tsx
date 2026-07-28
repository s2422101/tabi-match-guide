import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./App.css";
import { HotpepperAttribution } from "./components/HotpepperAttribution";
import { PreferenceForm } from "./components/PreferenceForm";
import { preferenceOptions } from "./components/preferenceOptions";
import { RestaurantCard } from "./components/RestaurantCard";
import { AdminAuthActions } from "./components/AdminAuthActions";
import { FavoritesLink } from "./components/FavoritesLink";
import { BackToTopButton } from "./components/BackToTopButton";
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
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [draftArea, setDraftArea] = useState<SearchArea>(selectedArea);
  const [draftFeatures, setDraftFeatures] = useState<RestaurantFeature[]>(
    selectedFeatures,
  );
  const resultsRef = useRef<HTMLElement>(null);
  const shouldScrollToResultsRef = useRef(false);

  const updateSearchParams = (
    area: SearchArea,
    features: RestaurantFeature[],
  ) => {
    const nextParams = new URLSearchParams(searchParams);

    if (area === "all") {
      nextParams.delete("area");
    } else {
      nextParams.set("area", area);
    }

    if (features.length === 0) {
      nextParams.delete("features");
    } else {
      nextParams.set("features", features.join(","));
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleAreaChange = (area: SearchArea) => {
    if (
      areFiltersOpen &&
      window.matchMedia("(max-width: 760px)").matches
    ) {
      setDraftArea(area);
      return;
    }

    if (area === selectedArea) {
      return;
    }

    setLoadingState("restaurants");
    updateSearchParams(area, selectedFeatures);
  };

  const handleFeaturesChange = (features: RestaurantFeature[]) => {
    if (
      areFiltersOpen &&
      window.matchMedia("(max-width: 760px)").matches
    ) {
      setDraftFeatures(features);
      return;
    }

    updateSearchParams(selectedArea, features);
  };

  const openOrDiscardFilters = () => {
    if (areFiltersOpen) {
      setDraftArea(selectedArea);
      setDraftFeatures(selectedFeatures);
      setAreFiltersOpen(false);
      return;
    }

    setDraftArea(selectedArea);
    setDraftFeatures(selectedFeatures);
    setAreFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    shouldScrollToResultsRef.current = true;

    if (draftArea !== selectedArea) {
      setLoadingState("restaurants");
    }

    updateSearchParams(draftArea, draftFeatures);
    setAreFiltersOpen(false);
  };

  const handleDiscardFilters = () => {
    setDraftArea(selectedArea);
    setDraftFeatures(selectedFeatures);
    setAreFiltersOpen(false);
  };

  useEffect(() => {
    const mobileMedia = window.matchMedia("(max-width: 760px)");
    const discardDraftOnDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        setAreFiltersOpen(false);
      }
    };

    mobileMedia.addEventListener("change", discardDraftOnDesktop);

    return () => {
      mobileMedia.removeEventListener("change", discardDraftOnDesktop);
    };
  }, []);

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

  useEffect(() => {
    if (loadingState !== null || !shouldScrollToResultsRef.current) {
      return;
    }

    shouldScrollToResultsRef.current = false;
    const frameId = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [areFiltersOpen, errorMessage, loadingState, selectedFeatures]);

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
  const summaryArea = areFiltersOpen ? draftArea : selectedArea;
  const summaryFeatures = areFiltersOpen ? draftFeatures : selectedFeatures;
  const areaSummary = summaryArea === "all" ? "All Areas" : summaryArea;
  const selectedFeatureLabels = preferenceOptions
    .filter(({ id }) => summaryFeatures.includes(id))
    .map(({ labelEn }) => labelEn);
  const filterSummary = selectedFeatureLabels.length > 0
    ? `${areaSummary} · ${selectedFeatureLabels.join(", ")}`
    : `${areaSummary} · No preferences selected`;

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

      <div className="filters-container">
        <button
          type="button"
          className="filters-toggle"
          onClick={openOrDiscardFilters}
          aria-expanded={areFiltersOpen}
          aria-controls="restaurant-search-filters"
        >
          <span className="filters-toggle-heading">
            <span>
              <strong>Filters</strong>
              <small>検索条件を変更</small>
            </span>
            <span className="filters-count">
              {summaryFeatures.length} selected
            </span>
            <span className="filters-chevron" aria-hidden="true">
              {areFiltersOpen ? "−" : "+"}
            </span>
          </span>
          <span className="filters-summary" title={filterSummary}>
            {filterSummary}
          </span>
        </button>

        <div
          id="restaurant-search-filters"
          className={areFiltersOpen ? "filters-content is-open" : "filters-content"}
        >
          <section className="area-section">
        <div className="area-heading">
          <h2>Select an area</h2>
          <p>エリアを選択してください</p>
        </div>

        <div className="area-buttons">
          <button
            type="button"
            className={summaryArea === "all" ? "area-button active" : "area-button"}
            onClick={() => handleAreaChange("all")}
          >
            <strong>All Areas</strong>
            <span>すべてのエリア</span>
          </button>
          <button
            type="button"
            className={summaryArea === "Asakusa" ? "area-button active" : "area-button"}
            onClick={() => handleAreaChange("Asakusa")}
          >
            <strong>Asakusa</strong>
            <span>浅草</span>
          </button>
          <button
            type="button"
            className={summaryArea === "Ueno" ? "area-button active" : "area-button"}
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
            selectedFeatures={summaryFeatures}
            onChange={handleFeaturesChange}
          />

          <div className="mobile-filter-actions">
            <button
              type="button"
              className="apply-filters-button"
              onClick={handleApplyFilters}
            >
              <strong>Apply filters</strong>
              <span>この条件で絞り込む</span>
            </button>
            <button
              type="button"
              className="discard-filters-button"
              onClick={handleDiscardFilters}
            >
              <strong>Cancel</strong>
              <span>変更を破棄</span>
            </button>
          </div>
        </div>
      </div>

      <section className="results-section" ref={resultsRef} id="restaurant-results">
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
            <button
              type="button"
              onClick={() => {
                setLoadingState("restaurants");
                setRetryCount((count) => count + 1);
              }}
            >
              Retry
              <span>再試行</span>
            </button>
          </div>
        ) : rankedRestaurants.length === 0 ? (
          <div className="results-status" aria-live="polite">
            <strong>No restaurants found.</strong>
            <span>条件に合う店舗が見つかりませんでした。</span>
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
      <BackToTopButton />
    </main>
  );
}

export default App;
