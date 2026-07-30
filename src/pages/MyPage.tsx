import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { preferenceOptions } from "../components/preferenceOptions";
import { useFavorites } from "../favorites/useFavorites";
import { useUserPreferences } from "../preferences/useUserPreferences";
import { translateRestaurants } from "../services/deeplApi";
import { fetchHotpepperRestaurants } from "../services/hotpepperApi";
import type {
  Restaurant,
  RestaurantFeature,
  RestaurantSort,
  SearchArea,
} from "../types/restaurant";
import { getRestaurantCanonicalId } from "../utils/restaurantId";
import {
  cacheApiRestaurants,
  getRestaurants,
} from "../utils/restaurantStorage";
import { getSearchPathFromPreferences } from "../utils/restaurantSearch";

export function MyPage() {
  const { isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();
  const {
    preferences,
    isLoading: isLoadingPreferences,
    errorMessage: preferenceLoadError,
    savePreferences,
    resetPreferences,
  } = useUserPreferences();
  const {
    favoriteIds,
    isLoading: isLoadingFavorites,
    isSyncing: isSyncingFavorites,
    errorMessage: favoriteError,
    toggleFavorite,
  } = useFavorites();
  const [preferredArea, setPreferredArea] = useState<SearchArea>("all");
  const [preferredFeatures, setPreferredFeatures] = useState<
    RestaurantFeature[]
  >([]);
  const [preferredSort, setPreferredSort] = useState<RestaurantSort>("match");
  const [preferenceSaveState, setPreferenceSaveState] = useState<
    "idle" | "saving" | "success" | "reset" | "error"
  >("idle");
  const [preferenceSaveError, setPreferenceSaveError] = useState<string | null>(
    null,
  );
  const [restaurants, setRestaurants] = useState<Restaurant[]>(getRestaurants);
  const [isLoadingRestaurantData, setIsLoadingRestaurantData] = useState(
    favoriteIds.length > 0,
  );
  const hasFavorites = favoriteIds.length > 0;

  useEffect(() => {
    if (preferences) {
      setPreferredArea(preferences.preferredArea);
      setPreferredFeatures(preferences.preferredFeatures);
      setPreferredSort(preferences.preferredSort);
    }
  }, [preferences]);

  useEffect(() => {
    const controller = new AbortController();
    if (!hasFavorites) {
      setIsLoadingRestaurantData(false);
      return () => controller.abort();
    }

    setIsLoadingRestaurantData(true);
    void (async () => {
      try {
        const fetched = await fetchHotpepperRestaurants("all", controller.signal);
        const translated = await translateRestaurants(fetched, controller.signal);
        cacheApiRestaurants(translated);
        if (!controller.signal.aborted) {
          setRestaurants(getRestaurants());
        }
      } catch {
        if (!controller.signal.aborted) {
          setRestaurants(getRestaurants());
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingRestaurantData(false);
        }
      }
    })();

    return () => controller.abort();
  }, [hasFavorites]);

  const favoriteRestaurants = useMemo(() => {
    const byId = new Map(
      restaurants.map((restaurant) => [
        getRestaurantCanonicalId(restaurant),
        restaurant,
      ]),
    );
    return favoriteIds
      .map((id) => byId.get(id))
      .filter((restaurant): restaurant is Restaurant => Boolean(restaurant));
  }, [favoriteIds, restaurants]);
  const unavailableCount = Math.max(
    0,
    favoriteIds.length - favoriteRestaurants.length,
  );

  const togglePreferredFeature = (feature: RestaurantFeature) => {
    setPreferredFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    );
  };

  const handleSavePreferences = async () => {
    setPreferenceSaveState("saving");
    setPreferenceSaveError(null);
    try {
      await savePreferences({ preferredArea, preferredFeatures, preferredSort });
      setPreferenceSaveState("reset");
    } catch (error: unknown) {
      setPreferenceSaveState("error");
      setPreferenceSaveError(
        error instanceof Error ? error.message : "Could not save preferences.",
      );
    }
  };

  const handleResetPreferences = async () => {
    setPreferenceSaveState("saving");
    setPreferenceSaveError(null);
    try {
      await resetPreferences();
      setPreferredArea("all");
      setPreferredFeatures([]);
      setPreferredSort("match");
      setPreferenceSaveState("success");
    } catch (error: unknown) {
      setPreferenceSaveState("error");
      setPreferenceSaveError(
        error instanceof Error ? error.message : "Could not reset preferences.",
      );
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const searchPath = preferences
    ? getSearchPathFromPreferences(preferences)
    : "/";

  return (
    <main className="mypage">
      <header className="mypage-header">
        <div className="mypage-header-copy">
          <p className="eyebrow">Your TabiMatch account</p>
          <h1>My Page</h1>
          <p className="section-title-ja">マイページ</p>
          <p className="mypage-email">
            <strong>Signed in as</strong>
            <span>{user?.email}</span>
          </p>
        </div>
        <nav className="mypage-header-actions" aria-label="Account navigation">
          <Link to="/">
            <strong>Search restaurants</strong>
            <span>店舗を検索する</span>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <strong>Admin dashboard</strong>
              <span>管理画面</span>
            </Link>
          )}
          <button type="button" onClick={() => void handleLogout()}>
            <strong>Log out</strong>
            <span>ログアウト</span>
          </button>
        </nav>
      </header>

      <div className="mypage-content">
        <section className="mypage-panel preferences-editor">
          <div className="mypage-section-heading">
            <p className="eyebrow">Saved preferences</p>
            <h2>Saved preferences</h2>
            <span>登録した検索条件</span>
          </div>

          {isLoadingPreferences ? (
            <p className="mypage-status" aria-live="polite">
              Loading preferences... <span>検索条件を読み込んでいます…</span>
            </p>
          ) : (
            <>
              {preferenceLoadError && (
                <p className="mypage-error" role="alert">
                  {preferenceLoadError}
                </p>
              )}

              <label className="mypage-field">
                <strong>Preferred area</strong>
                <small>よく使うエリア</small>
                <select
                  value={preferredArea}
                  onChange={(event) =>
                    setPreferredArea(event.target.value as SearchArea)
                  }
                  disabled={preferenceSaveState === "saving"}
                >
                  <option value="all">All Areas / すべてのエリア</option>
                  <option value="Asakusa">Asakusa / 浅草</option>
                  <option value="Ueno">Ueno / 上野</option>
                </select>
              </label>

              <fieldset className="mypage-preferences-grid">
                <legend>
                  Preferred conditions <small>希望条件</small>
                </legend>
                <div>
                  {preferenceOptions.map((option) => (
                    <label key={option.id}>
                      <input
                        type="checkbox"
                        checked={preferredFeatures.includes(option.id)}
                        onChange={() => togglePreferredFeature(option.id)}
                        disabled={preferenceSaveState === "saving"}
                      />
                      <span>
                        <strong>{option.labelEn}</strong>
                        <small>{option.labelJa}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mypage-field">
                <strong>Default sort</strong>
                <small>初期並べ替え</small>
                <select
                  value={preferredSort}
                  onChange={(event) =>
                    setPreferredSort(event.target.value as RestaurantSort)
                  }
                  disabled={preferenceSaveState === "saving"}
                >
                  <option value="match">Best match / マッチ率順</option>
                  <option value="budget">Lowest budget / 予算順</option>
                  <option value="distance">Nearest / 距離順</option>
                </select>
              </label>

              <div className="mypage-preference-actions">
                <button
                  type="button"
                  className="save-button"
                  onClick={() => void handleSavePreferences()}
                  disabled={preferenceSaveState === "saving"}
                >
                  {preferenceSaveState === "saving"
                    ? "Saving..."
                    : "Save preferences"}
                  <span>条件を保存</span>
                </button>
                <button
                  type="button"
                  className="reset-preferences-button"
                  onClick={() => void handleResetPreferences()}
                  disabled={preferenceSaveState === "saving" || !preferences}
                >
                  <strong>Reset preferences</strong>
                  <span>登録条件をリセット</span>
                </button>
                <Link to={searchPath} className="search-preferences-link">
                  <strong>Search with my preferences</strong>
                  <span>登録条件で検索</span>
                </Link>
              </div>

              <div className="mypage-save-result" aria-live="polite">
                {preferenceSaveState === "success" && (
                  <p className="save-success">
                    <strong>Preferences saved.</strong>
                    <span>検索条件を保存しました。</span>
                  </p>
                )}
                {preferenceSaveState === "reset" && (
                  <p className="save-success">
                    <strong>Preferences reset.</strong>
                    <span>登録条件をリセットしました。</span>
                  </p>
                )}
                {preferenceSaveState === "error" && (
                  <p className="save-error" role="alert">
                    <strong>Could not save preferences.</strong>
                    <span>検索条件を保存できませんでした。</span>
                    {preferenceSaveError && <small>{preferenceSaveError}</small>}
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        <section className="mypage-panel mypage-favorites">
          <div className="mypage-section-heading">
            <p className="eyebrow">Favorite restaurants</p>
            <h2>Favorite restaurants</h2>
            <span>お気に入り店舗</span>
          </div>

          {(isLoadingFavorites || isLoadingRestaurantData || isSyncingFavorites) && (
            <p className="mypage-status" aria-live="polite">
              {isSyncingFavorites ? "Syncing favorites..." : "Loading favorites..."}
              <span>
                {isSyncingFavorites
                  ? "お気に入りを同期しています…"
                  : "お気に入りを読み込んでいます…"}
              </span>
            </p>
          )}
          {favoriteError && (
            <p className="mypage-error" role="alert">{favoriteError}</p>
          )}

          {!isLoadingFavorites && favoriteIds.length === 0 ? (
            <p className="mypage-empty">
              <strong>No favorite restaurants yet.</strong>
              <span>お気に入りの店舗はまだありません。</span>
            </p>
          ) : (
            <div className="mypage-favorite-list">
              {favoriteRestaurants.map((restaurant) => {
                const restaurantId = getRestaurantCanonicalId(restaurant);
                return (
                  <article key={restaurantId}>
                    <img src={restaurant.imageUrl} alt="" />
                    <div>
                      <p>{restaurant.area} · {restaurant.genre}</p>
                      <h3>{restaurant.nameEn}</h3>
                      <small>{restaurant.nameJa}</small>
                    </div>
                    <div className="mypage-favorite-actions">
                      <Link to={`/restaurants/${restaurantId}`}>
                        <strong>View details</strong>
                        <span>詳細を見る</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => void toggleFavorite(restaurantId)}
                        disabled={isSyncingFavorites}
                      >
                        <strong>Remove</strong>
                        <span>お気に入り解除</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {unavailableCount > 0 && (
            <p className="mypage-unavailable">
              <strong>
                {unavailableCount} restaurant information is currently unavailable.
              </strong>
              <span>現在取得できない店舗情報が{unavailableCount}件あります。</span>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
