import type { RestaurantFeature } from "../types/restaurant";
import { preferenceOptions } from "./preferenceOptions";

type Props = {
  selectedFeatures: RestaurantFeature[];
  onChange: (features: RestaurantFeature[]) => void;
};

export function PreferenceForm({
  selectedFeatures,
  onChange,
}: Props) {
  const handleToggle = (feature: RestaurantFeature) => {
    if (selectedFeatures.includes(feature)) {
      onChange(
        selectedFeatures.filter(
          (selectedFeature) => selectedFeature !== feature,
        ),
      );
      return;
    }

    onChange([...selectedFeatures, feature]);
  };

  return (
    <section className="preference-panel">
      <h2>Find restaurants that match your needs</h2>
<p className="heading-ja">希望条件に合う飲食店を探す</p>

<p className="preference-description">
  Select the conditions that are important to you.
  <span className="japanese-subtext">
    あなたにとって重要な条件を選択してください。
  </span>
</p>

      <div className="preference-grid">
        {preferenceOptions.map((option) => (
          <label className="preference-option" key={option.id}>
            <input
              type="checkbox"
              checked={selectedFeatures.includes(option.id)}
              onChange={() => handleToggle(option.id)}
            />

            <span className="option-label">
  <strong>{option.labelEn}</strong>
  <small>{option.labelJa}</small>
</span>
          </label>
        ))}
      </div>
    </section>
  );
}
