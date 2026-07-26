import { type FormEvent, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
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
  saveRestaurant,
} from "../utils/restaurantStorage";
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
  const restaurant = getRestaurants().find(
    (item) => item.id === Number(restaurantId),
  );
  const [nameEn, setNameEn] = useState(restaurant?.nameEn ?? "");
  const [nameJa, setNameJa] = useState(restaurant?.nameJa ?? "");
  const [featureStatuses, setFeatureStatuses] = useState(
    restaurant?.featureStatuses ?? createUnknownFeatureStatuses(),
  );
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

  const detailPath = `/restaurants/${restaurant.id}${location.search}`;
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveRestaurant({
      ...restaurant,
      nameEn: nameEn.trim(),
      nameJa: nameJa.trim(),
      featureStatuses,
    });
    navigate(detailPath, { replace: true });
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
            <button type="submit" className="save-button">
              Save changes
              <span>変更を保存</span>
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
            >
              <strong>Cancel and go back</strong>
              <span>変更せず店舗詳細へ戻る</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
