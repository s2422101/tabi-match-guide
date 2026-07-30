import type { MatchResult } from "../utils/match";

type Props = {
  result: MatchResult;
};

export function MatchSummary({ result }: Props) {
  const hasSelectedConditions = result.selectedCount > 0;
  const hasLimitedInformation =
    result.informationCoverage !== null && result.informationCoverage < 50;
  const classNames = [
    "match-summary",
    result.score === null ? "insufficient" : "",
    hasLimitedInformation ? "limited-information" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <div className="match-score">
        {result.score === null ? (
          <>
            <strong>Not enough information</strong>
            <span>Confirmed match</span>
            <small>確認済み項目の一致率を計算できません</small>
          </>
        ) : (
          <>
            <strong>{result.score}%</strong>
            <span>Confirmed match</span>
            <small>確認済み項目の一致率</small>
          </>
        )}
      </div>

      <div className="match-explanation">
        {hasSelectedConditions ? (
          <>
            <p className="match-calculation-note">
              Calculated from verified conditions only
              <small>情報未登録の条件は一致率の計算から除外しています</small>
            </p>

            <div className="information-coverage">
              <p>
                <strong>
                  {result.confirmedCount} of {result.selectedCount} verified
                </strong>
                <small>
                  {result.selectedCount}項目中{result.confirmedCount}項目を確認済み
                </small>
              </p>
              <p>
                <strong>
                  <span className="coverage-full-label">Information </span>
                  Coverage {result.informationCoverage}%
                </strong>
                <small>情報確認度 {result.informationCoverage}%</small>
              </p>
            </div>

            {hasLimitedInformation && (
              <p className="limited-information-note">
                <strong>Limited information</strong>
                <small>情報が不足しています</small>
              </p>
            )}

            <div
              className="match-breakdown"
              aria-label="Condition status breakdown"
            >
              <span className="breakdown-item breakdown-supported">
                <span aria-hidden="true">✓</span>
                <strong>{result.matchedCount} Supported</strong>
                <small>対応あり {result.matchedCount}件</small>
              </span>
              <span className="breakdown-item breakdown-unsupported">
                <span aria-hidden="true">×</span>
                <strong>{result.unmatchedCount} Unsupported</strong>
                <small>非対応 {result.unmatchedCount}件</small>
              </span>
              <span className="breakdown-item breakdown-unknown">
                <span aria-hidden="true">?</span>
                <strong>{result.unknownCount} Unknown</strong>
                <small>情報未登録 {result.unknownCount}件</small>
              </span>
            </div>
          </>
        ) : (
          <p>
            Select conditions to calculate a confirmed match
            <small>条件を選択すると確認済み項目の一致率を計算します</small>
          </p>
        )}
      </div>
    </div>
  );
}
