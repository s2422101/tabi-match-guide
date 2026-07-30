import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { HotpepperAttribution } from "../components/HotpepperAttribution";
import { useAuth } from "../auth/useAuth";
import {
  fetchHotpepperRestaurants,
  RestaurantApiError,
} from "../services/hotpepperApi";
import {
  applyRestaurantSupport,
  fetchRestaurantSupports,
} from "../services/restaurantSupportApi";
import type { Restaurant, SearchArea } from "../types/restaurant";
import { getRestaurantCanonicalId } from "../utils/restaurantId";
import { cacheApiRestaurants } from "../utils/restaurantStorage";

const areas: Array<{ value: SearchArea; label: string; labelJa: string }> = [
  { value: "all", label: "All Areas", labelJa: "すべてのエリア" },
  { value: "Asakusa", label: "Asakusa", labelJa: "浅草" },
  { value: "Ueno", label: "Ueno", labelJa: "上野" },
];

function getAdminArea(searchParams: URLSearchParams): SearchArea {
  const area = searchParams.get("area");
  return area === "Asakusa" || area === "Ueno" ? area : "all";
}

export function AdminDashboardPage() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedArea = getAdminArea(searchParams);
  const searchTerm = searchParams.get("q") ?? "";
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [registeredSupportIds, setRegisteredSupportIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSupportStatusAvailable, setIsSupportStatusAvailable] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const returnPath = `${location.pathname}${location.search}`;

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage(null);
    setIsSupportStatusAvailable(true);

    void (async () => {
      try {
        const fetchedRestaurants = await fetchHotpepperRestaurants(
          selectedArea,
          controller.signal,
        );
        cacheApiRestaurants(fetchedRestaurants);

        try {
          const supports = await fetchRestaurantSupports(
            fetchedRestaurants,
            controller.signal,
          );
          const supportedRestaurants = fetchedRestaurants.map((restaurant) =>
            applyRestaurantSupport(
              restaurant,
              supports.get(getRestaurantCanonicalId(restaurant)) ?? null,
            ),
          );

          if (!controller.signal.aborted) {
            setRestaurants(supportedRestaurants);
            setRegisteredSupportIds(new Set(supports.keys()));
          }
        } catch {
          if (!controller.signal.aborted) {
            setRestaurants(fetchedRestaurants);
            setRegisteredSupportIds(new Set());
            setIsSupportStatusAvailable(false);
          }
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        if (
          error instanceof RestaurantApiError &&
          error.code === "NO_RESTAURANTS_FOUND"
        ) {
          setRestaurants([]);
          return;
        }

        setRestaurants([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load restaurants.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [retryCount, selectedArea]);

  const filteredRestaurants = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLocaleLowerCase();

    if (!normalizedTerm) {
      return restaurants;
    }

    return restaurants.filter((restaurant) =>
      [restaurant.nameEn, restaurant.nameJa].some((name) =>
        name.toLocaleLowerCase().includes(normalizedTerm),
      ),
    );
  }, [restaurants, searchTerm]);

  const updateArea = (area: SearchArea) => {
    const nextParams = new URLSearchParams(searchParams);
    if (area === "all") {
      nextParams.delete("area");
    } else {
      nextParams.set("area", area);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const updateSearchTerm = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await signOut();
      navigate("/admin/login", {
        replace: true,
        state: { from: "/" },
      });
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (isLoggingOut) {
    return (
      <main className="auth-page">
        <section className="auth-panel auth-status" aria-live="polite">
          <strong>Logging out...</strong>
          <span>ログアウトしています…</span>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="eyebrow">Restaurant management</p>
          <h1>Admin dashboard</h1>
          <p className="section-title-ja">管理者ダッシュボード</p>
          {user?.email && (
            <p className="admin-dashboard-email">
              <strong>Signed in as</strong>
              <span>{user.email}</span>
            </p>
          )}
        </div>

        <nav className="admin-dashboard-actions" aria-label="Admin navigation">
          <Link to="/" className="admin-public-link">
            <strong>View public site</strong>
            <span>一般向けサイトを見る</span>
          </Link>
          <button type="button" onClick={() => void handleLogout()}>
            <strong>Log out</strong>
            <span>ログアウト</span>
          </button>
        </nav>
      </header>

      <section className="admin-dashboard-content">
        <div className="admin-search-panel">
          <div>
            <h2>Find a restaurant</h2>
            <p>編集する店舗を検索</p>
          </div>

          <fieldset className="admin-area-filter">
            <legend>
              Area <small>エリア</small>
            </legend>
            <div>
              {areas.map((area) => (
                <button
                  type="button"
                  className={selectedArea === area.value ? "is-selected" : ""}
                  aria-pressed={selectedArea === area.value}
                  onClick={() => updateArea(area.value)}
                  key={area.value}
                >
                  <strong>{area.label}</strong>
                  <span>{area.labelJa}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="admin-name-search">
            <strong>Search restaurants</strong>
            <small>店舗名で検索</small>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => updateSearchTerm(event.target.value)}
              placeholder="Restaurant name / 店舗名"
              disabled={isLoading}
            />
          </label>
        </div>

        {isLoading ? (
          <div className="admin-dashboard-status" aria-live="polite">
            <strong>Loading restaurants...</strong>
            <span>店舗情報を読み込んでいます…</span>
          </div>
        ) : errorMessage ? (
          <div className="admin-dashboard-status admin-dashboard-error" role="alert">
            <strong>Could not load restaurants.</strong>
            <span>店舗情報を取得できませんでした。</span>
            <small>{errorMessage}</small>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
              Retry
            </button>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="admin-dashboard-status" role="status">
            <strong>No restaurants found.</strong>
            <span>条件に一致する店舗がありません。</span>
          </div>
        ) : (
          <>
            <p className="admin-result-count" aria-live="polite">
              <strong>{filteredRestaurants.length} restaurants</strong>
              <span>{filteredRestaurants.length}件の店舗</span>
            </p>

            <div className="admin-restaurant-list">
              {filteredRestaurants.map((restaurant) => {
                const restaurantId = getRestaurantCanonicalId(restaurant);
                const navigationState = {
                  from: returnPath,
                  adminReturnTo: returnPath,
                };

                return (
                  <article className="admin-restaurant-card" key={restaurantId}>
                    <img src={restaurant.imageUrl} alt="" />
                    <div className="admin-restaurant-main">
                      <p>{restaurant.area} · {restaurant.genre}</p>
                      <h3>{restaurant.nameEn}</h3>
                      <small>{restaurant.nameJa}</small>
                      {restaurant.address && <address>{restaurant.address}</address>}
                      <code>{restaurantId}</code>
                    </div>
                    <div className="admin-support-status">
                      {!isSupportStatusAvailable ? (
                        <span className="status-unavailable">
                          <strong>Support status unavailable</strong>
                          <small>登録状況を取得できません</small>
                        </span>
                      ) : registeredSupportIds.has(restaurantId) ? (
                        <span className="status-registered">
                          <strong>Support data registered</strong>
                          <small>独自情報登録済み</small>
                        </span>
                      ) : (
                        <span className="status-not-registered">
                          <strong>No support data</strong>
                          <small>独自情報未登録</small>
                        </span>
                      )}
                    </div>
                    <div className="admin-restaurant-links">
                      <Link
                        to={`/restaurants/${restaurantId}`}
                        state={navigationState}
                      >
                        <strong>View</strong>
                        <span>詳細</span>
                      </Link>
                      <Link
                        to={`/restaurants/${restaurantId}/edit`}
                        state={navigationState}
                        className="admin-edit-link"
                      >
                        <strong>Edit</strong>
                        <span>編集</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <HotpepperAttribution />
          </>
        )}
      </section>
    </main>
  );
}
