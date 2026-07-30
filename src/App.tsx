import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import "./App.css";
import { HotpepperAttribution } from "./components/HotpepperAttribution";
import { PreferenceForm } from "./components/PreferenceForm";
import { preferenceOptions } from "./components/preferenceOptions";
import { RestaurantCard } from "./components/RestaurantCard";
import { UserAuthActions } from "./components/UserAuthActions";
import { FavoritesLink } from "./components/FavoritesLink";
import { BackToTopButton } from "./components/BackToTopButton";
import { LocationControls } from "./components/LocationControls";
import { useLocation } from "./location/useLocation";
import { translateRestaurants } from "./services/deeplApi";
import {
  fetchHotpepperRestaurants,
  RestaurantApiError,
} from "./services/hotpepperApi";
import { hydrateRestaurantsWithSupport } from "./services/restaurantSupportApi";
import type {
  RestaurantFeature,
  RestaurantSort,
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
  getListPath,
  getSortFromSearchParams,
} from "./utils/restaurantSearch";
import { getRestaurantCanonicalId } from "./utils/restaurantId";
import { sortRestaurantResults } from "./utils/restaurantSort";
import { useUserPreferences } from "./preferences/useUserPreferences";
import { FavoriteSyncNotice } from "./components/FavoriteSyncNotice";

const RestaurantResultsMap = lazy(() =>
  import("./components/RestaurantResultsMap").then((module) => ({
    default: module.RestaurantResultsMap,
  })),
);

function App() {
  const { preferences, isLoading: isLoadingPreferences } = useUserPreferences();
  const { coordinates, status: locationStatus } = useLocation();
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
  const selectedSort = useMemo(
    () => getSortFromSearchParams(searchParams),
    [searchParams],
  );
  const [loadingState, setLoadingState] = useState<
    "restaurants" | "translation" | "support" | null
  >("restaurants");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSampleMode, setIsSampleMode] = useState(false);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
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

  const handleSortChange = (sort: RestaurantSort) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sort", sort);
    setSearchParams(nextParams, { replace: true });
  };

  const handleApplyUserPreferences = () => {
    if (!preferences) {
      return;
    }

    const nextParams = new URLSearchParams();
    if (preferences.preferredArea !== "all") {
      nextParams.set("area", preferences.preferredArea);
    }
    if (preferences.preferredFeatures.length > 0) {
      nextParams.set("features", preferences.preferredFeatures.join(","));
    }
    if (preferences.preferredSort !== "match") {
      nextParams.set("sort", preferences.preferredSort);
    }

    if (preferences.preferredArea !== selectedArea) {
      setLoadingState("restaurants");
    }
    setDraftArea(preferences.preferredArea);
    setDraftFeatures(preferences.preferredFeatures);
    setAreFiltersOpen(false);
    shouldScrollToResultsRef.current = true;
    setSearchParams(nextParams, { replace: true });
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

  const restaurantResults = useMemo(() => {
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
      }));
  }, [restaurants, selectedFeatures, selectedArea]);

  const sortedRestaurants = useMemo(
    () =>
      sortRestaurantResults(
        restaurantResults,
        selectedSort,
        locationStatus === "success" ? coordinates : null,
      ),
    [coordinates, locationStatus, restaurantResults, selectedSort],
  );

  const hasApiRestaurants = sortedRestaurants.some(
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
          <UserAuthActions />
        </div>
        <p className="hero-brand">TABIMATCH GUIDE</p>
        <h1>Find a restaurant that fits your needs.</h1>
        <p className="hero-ja">あなたの条件に合う日本の飲食店を探す</p>
        <p className="hero-description">
          Find restaurants by dietary needs, payment options and facilities.
          <span className="hero-description-ja">
            食習慣や支払い方法、設備から、安心して選べるお店を探せます。
          </span>
        </p>
      </header>

      <FavoriteSyncNotice />

      <div className="filters-container">
        {preferences && (
          <button
            type="button"
            className="apply-preferences-button"
            onClick={handleApplyUserPreferences}
            disabled={isLoadingPreferences || Boolean(loadingState)}
          >
            <strong>Apply my preferences</strong>
            <span>登録条件を反映</span>
          </button>
        )}
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

          <div className="results-controls">
            <label className="sort-control">
              <span className="sort-label">
                <strong>Sort results</strong>
                <small>表示順</small>
              </span>
              <select
                value={selectedSort}
                onChange={(event) =>
                  handleSortChange(event.target.value as RestaurantSort)
                }
                disabled={Boolean(loadingState || errorMessage)}
              >
                <option value="match">Best match / マッチ率が高い順</option>
                <option value="budget">Lowest budget / 予算が安い順</option>
                <option value="distance">Nearest / 現在地から近い順</option>
              </select>
            </label>

            <LocationControls selectedSort={selectedSort} />

            {!loadingState && !errorMessage && (
              <p className="result-count">
                {sortedRestaurants.length} restaurants found
                <span className="result-count-ja">
                  {sortedRestaurants.length}件の飲食店
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="results-map-controls">
          <button
            type="button"
            className="map-toggle-button"
            onClick={() => setIsMapOpen((isOpen) => !isOpen)}
            aria-expanded={isMapOpen}
            aria-controls="restaurant-results-map-panel"
          >
            <strong>{isMapOpen ? "Hide map" : "Show map"}</strong>
            <span>{isMapOpen ? "地図を閉じる" : "地図を表示"}</span>
          </button>
          <p>
            Compare restaurant locations on the map.
            <span>検索結果の店舗位置を地図で比較できます。</span>
          </p>
        </div>

        {isMapOpen && (
          <div id="restaurant-results-map-panel" className="map-panel">
            {loadingState ? (
              <div className="map-loading-state" aria-live="polite">
                <strong>Loading restaurant locations...</strong>
                <span>店舗位置を読み込んでいます…</span>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="map-loading-state" aria-live="polite">
                    <strong>Loading map...</strong>
                    <span>地図を読み込んでいます…</span>
                  </div>
                }
              >
                <RestaurantResultsMap
                  results={restaurantResults}
                  userCoordinates={
                    locationStatus === "success" ? coordinates : null
                  }
                  detailQuery={searchParams.toString()}
                  returnPath={getListPath(searchParams)}
                />
              </Suspense>
            )}
          </div>
        )}

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
        ) : sortedRestaurants.length === 0 ? (
          <div className="results-status" aria-live="polite">
            <strong>No restaurants found.</strong>
            <span>条件に合う店舗が見つかりませんでした。</span>
          </div>
        ) : (
          <div className="restaurant-list">
            {sortedRestaurants.map(({ restaurant, matchResult }) => (
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
