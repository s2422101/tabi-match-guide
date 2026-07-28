import { type FormEvent, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  hydrateRestaurantsWithSupport,
  saveRestaurantSupport,
} from "../services/restaurantSupportApi";
import type {
  FeatureStatus,
  RestaurantFeature,
} from "../types/restaurant";
import {
  createUnknownFeatureStatuses,
  featureEditStatusLabels,
  featureLabels,
  featureLabelsJa,
  featureStatusLabelsJa,
} from "../utils/features";
import {
  getRestaurants,
} from "../utils/restaurantStorage";
import {
  findRestaurantByRouteId,
  getRestaurantCanonicalId,
} from "../utils/restaurantId";
import {
  canNavigateBack,
  getReturnPath,
} from "../utils/restaurantSearch";

const editableFeatures: RestaurantFeature[] = [
  "english_guide",
  "credit_card",
  "non_smoking",
  "wifi",
  "takeout",
  "vegetarian",
  "vegan",
  "pork_free",
  "alcohol_free",
];

const editableStatuses: FeatureStatus[] = [
  "supported",
  "unsupported",
  "unknown",
];

export function RestaurantEditPage() {
  const { restaurantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(() =>
    findRestaurantByRouteId(getRestaurants(), restaurantId),
  );
  const [nameEn, setNameEn] = useState(restaurant?.nameEn ?? "");
  const [nameJa, setNameJa] = useState(restaurant?.nameJa ?? "");
  const [featureStatuses, setFeatureStatuses] = useState(
    restaurant?.featureStatuses ?? createUnknownFeatureStatuses(),
  );
  const [isLoadingSupport, setIsLoadingSupport] = useState(Boolean(restaurant));
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const isDirty = restaurant
    ? nameEn !== restaurant.nameEn ||
      nameJa !== restaurant.nameJa ||
      editableFeatures.some(
        (feature) =>
          featureStatuses[feature] !== restaurant.featureStatuses[feature],
      )
    : false;

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const controller = new AbortController();
    const baseRestaurant = findRestaurantByRouteId(
      getRestaurants(),
      restaurantId,
    );
    setRestaurant(baseRestaurant);

    if (!baseRestaurant) {
      setIsLoadingSupport(false);
      return () => controller.abort();
    }

    const canonicalId = getRestaurantCanonicalId(baseRestaurant);
    if (restaurantId !== canonicalId) {
      navigate(`/restaurants/${canonicalId}/edit${location.search}`, {
        replace: true,
        state: location.state,
      });
    }

    setIsLoadingSupport(true);
    void hydrateRestaurantsWithSupport([baseRestaurant], controller.signal).then(
      ([hydratedRestaurant]) => {
        if (controller.signal.aborted || !hydratedRestaurant) {
          return;
        }
        setRestaurant(hydratedRestaurant);
        setNameEn(hydratedRestaurant.nameEn);
        setNameJa(hydratedRestaurant.nameJa);
        setFeatureStatuses(hydratedRestaurant.featureStatuses);
        setIsLoadingSupport(false);
      },
    );

    return () => controller.abort();
  }, [location.search, location.state, navigate, restaurantId]);

  if (!restaurant) {
    return (
      <main className="edit-page">
        <section className="detail-not-found">
          <p className="eyebrow">Restaurant not found</p>
          <h1>We could not find this restaurant.</h1>
          <p className="detail-ja">
            指定された飲食店が見つかりませんでした。
          </p>
          <Link to="/" className="back-link">
            Back to restaurant list
          </Link>
        </section>
      </main>
    );
  }

  const canonicalRestaurantId = getRestaurantCanonicalId(restaurant);
  const detailPath = `/restaurants/${canonicalRestaurantId}${location.search}`;
  const returnPath = getReturnPath(location.state);

  const handleStatusChange = (
    feature: RestaurantFeature,
    status: FeatureStatus,
  ) => {
    setFeatureStatuses((currentStatuses) => ({
      ...currentStatuses,
      [feature]: status,
    }));
  };

  const confirmDiscardChanges = () =>
    !isDirty ||
    window.confirm(
      "Discard unsaved changes?\n保存していない変更を破棄しますか？",
    );

  const handleCancel = () => {
    if (!confirmDiscardChanges()) {
      return;
    }

    if (returnPath === detailPath && canNavigateBack()) {
      navigate(-1);
      return;
    }

    navigate(detailPath);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState("saving");
    setSaveError(null);

    try {
      await saveRestaurantSupport({
        ...restaurant,
        nameEn: nameEn.trim(),
        nameJa: nameJa.trim(),
        featureStatuses,
      });
      setSaveState("success");
      window.setTimeout(() => navigate(detailPath, { replace: true }), 500);
    } catch (error: unknown) {
      setSaveState("error");
      setSaveError(
        error instanceof Error ? error.message : "Could not save restaurant information.",
      );
    }
  };

  return (
    <main className="edit-page">
      <section className="edit-panel">
        <button
          type="button"
          className="back-link edit-back-button"
          onClick={handleCancel}
        >
          <strong>Back to restaurant details</strong>
          <span>店舗詳細へ戻る</span>
        </button>

        <p className="eyebrow">Restaurant management</p>
        <h1>Edit restaurant information</h1>
        <p className="section-title-ja">店舗情報を編集</p>

        {isLoadingSupport && (
          <p className="edit-save-status" aria-live="polite">
            <strong>Loading restaurant support...</strong>
            <span>店舗独自情報を読み込んでいます…</span>
          </p>
        )}

        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="edit-name-grid">
            <label className="edit-field">
              <strong>Restaurant name</strong>
              <small>店舗名（英語）</small>
              <input
                type="text"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                required
                disabled={isLoadingSupport || saveState === "saving"}
              />
            </label>

            <label className="edit-field">
              <strong>Restaurant name in Japanese</strong>
              <small>店舗名（日本語）</small>
              <input
                type="text"
                value={nameJa}
                onChange={(event) => setNameJa(event.target.value)}
                required
                disabled={isLoadingSupport || saveState === "saving"}
              />
            </label>
          </div>

          <fieldset className="edit-features">
            <legend>
              Supported needs
              <small>対応条件</small>
            </legend>

            <div className="edit-feature-grid">
              {editableFeatures.map((feature) => (
                <div className="edit-feature-status" key={feature}>
                  <div className="edit-feature-name">
                    <strong>{featureLabels[feature]}</strong>
                    <small>{featureLabelsJa[feature]}</small>
                  </div>

                  <div className="edit-status-options">
                    {editableStatuses.map((status) => (
                      <label
                        className={`edit-status-option status-${status}`}
                        key={status}
                      >
                        <input
                          type="radio"
                          name={`feature-${feature}`}
                          value={status}
                          checked={featureStatuses[feature] === status}
                          onChange={() => handleStatusChange(feature, status)}
                          disabled={isLoadingSupport || saveState === "saving"}
                        />
                        <span>
                          <strong>{featureEditStatusLabels[status]}</strong>
                          <small>{featureStatusLabelsJa[status]}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="edit-actions">
            <button
              type="submit"
              className="save-button"
              disabled={isLoadingSupport || saveState === "saving"}
            >
              {saveState === "saving" ? "Saving..." : "Save changes"}
              <span>{saveState === "saving" ? "保存中…" : "変更を保存"}</span>
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              disabled={saveState === "saving"}
            >
              <strong>Cancel and go back</strong>
              <span>変更せず店舗詳細へ戻る</span>
            </button>
          </div>

          <div className="edit-save-result" aria-live="polite">
            {saveState === "success" && (
              <p className="save-success">
                <strong>Saved successfully.</strong>
                <span>保存しました。店舗詳細へ戻ります。</span>
              </p>
            )}
            {saveState === "error" && (
              <p className="save-error" role="alert">
                <strong>Could not save changes.</strong>
                <span>変更を保存できませんでした。</span>
                {saveError && <small>{saveError}</small>}
              </p>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
