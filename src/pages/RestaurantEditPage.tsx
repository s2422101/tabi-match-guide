import { type FormEvent, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { RestaurantFeature } from "../types/restaurant";
import { featureLabels, featureLabelsJa } from "../utils/features";
import {
  getRestaurants,
  saveRestaurant,
} from "../utils/restaurantStorage";

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

export function RestaurantEditPage() {
  const { restaurantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const restaurant = getRestaurants().find(
    (item) => item.id === Number(restaurantId),
  );
  const [nameEn, setNameEn] = useState(restaurant?.nameEn ?? "");
  const [nameJa, setNameJa] = useState(restaurant?.nameJa ?? "");
  const [features, setFeatures] = useState<RestaurantFeature[]>(
    restaurant?.features ?? [],
  );

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

  const handleFeatureToggle = (feature: RestaurantFeature) => {
    setFeatures((currentFeatures) =>
      currentFeatures.includes(feature)
        ? currentFeatures.filter((item) => item !== feature)
        : [...currentFeatures, feature],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveRestaurant({
      ...restaurant,
      nameEn: nameEn.trim(),
      nameJa: nameJa.trim(),
      features,
    });
    navigate(detailPath);
  };

  return (
    <main className="edit-page">
      <section className="edit-panel">
        <Link to={detailPath} className="back-link">
          Back to restaurant details
        </Link>

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
                <label className="edit-checkbox" key={feature}>
                  <input
                    type="checkbox"
                    checked={features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                  />
                  <span>
                    <strong>{featureLabels[feature]}</strong>
                    <small>{featureLabelsJa[feature]}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="edit-actions">
            <button type="submit" className="save-button">
              Save changes
              <span>変更を保存</span>
            </button>
            <Link to={detailPath} className="cancel-button">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
