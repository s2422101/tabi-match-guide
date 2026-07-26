import type {
  FeatureStatus,
  RestaurantFeature,
} from "../types/restaurant";
import {
  featureLabels,
  featureLabelsJa,
  featureStatusLabels,
  featureStatusLabelsJa,
} from "../utils/features";

type Props = {
  feature: RestaurantFeature;
  status: FeatureStatus;
};

const statusSymbols: Record<FeatureStatus, string> = {
  supported: "✓",
  unsupported: "×",
  unknown: "?",
};

export function FeatureStatusItem({ feature, status }: Props) {
  return (
    <div className={`feature-status feature-status-${status}`}>
      <span className="feature-status-symbol" aria-hidden="true">
        {statusSymbols[status]}
      </span>
      <span className="feature-status-name">
        <strong>{featureLabels[feature]}</strong>
        <small>{featureLabelsJa[feature]}</small>
      </span>
      <span className="feature-status-result">
        <strong>{featureStatusLabels[status]}</strong>
        <small>{featureStatusLabelsJa[status]}</small>
      </span>
    </div>
  );
}
