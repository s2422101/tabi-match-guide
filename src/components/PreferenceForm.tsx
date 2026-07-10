import type { RestaurantFeature } from "../types/restaurant";

type PreferenceOption = {
  id: RestaurantFeature;
  labelJa: string;
  labelEn: string;
};

type Props = {
  selectedFeatures: RestaurantFeature[];
  onChange: (features: RestaurantFeature[]) => void;
};

const options: PreferenceOption[] = [
  {
    id: "pork_free",
    labelJa: "豚肉不使用メニューあり",
    labelEn: "Pork-free options",
  },
  {
    id: "alcohol_free",
    labelJa: "アルコール不使用メニューあり",
    labelEn: "Alcohol-free options",
  },
  {
    id: "vegetarian",
    labelJa: "ベジタリアン対応",
    labelEn: "Vegetarian options",
  },
  {
    id: "vegan",
    labelJa: "ヴィーガン対応",
    labelEn: "Vegan options",
  },
  {
    id: "credit_card",
    labelJa: "クレジットカード利用可能",
    labelEn: "Credit card available",
  },
  {
    id: "non_smoking",
    labelJa: "全面禁煙",
    labelEn: "Non-smoking",
  },
  {
    id: "english_guide",
    labelJa: "英語案内あり",
    labelEn: "English guide available",
  },
  {
    id: "wifi",
    labelJa: "Wi-Fiあり",
    labelEn: "Wi-Fi available",
  },
  {
    id: "takeout",
    labelJa: "テイクアウト可能",
    labelEn: "Takeout available",
  },
];

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
        {options.map((option) => (
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