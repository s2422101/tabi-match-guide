import type { MatchResult } from "../utils/match";

type Props = {
  result: MatchResult;
};

export function MatchSummary({ result }: Props) {
  return (
    <div
      className={
        result.score === null
          ? "match-summary insufficient"
          : "match-summary"
      }
    >
      <div className="match-score">
        {result.score === null ? (
          <>
            <strong>Not enough information</strong>
            <small>情報不足</small>
          </>
        ) : (
          <>
            <strong>{result.score}%</strong>
            <span>Confirmed match</span>
            <small>確認済み一致率</small>
          </>
        )}
      </div>

      <div className="match-explanation">
        {result.score !== null && (
          <p>
            {result.matchedCount} of {result.confirmedCount} confirmed conditions
            matched
            <small>
              確認済み{result.confirmedCount}件中{result.matchedCount}件が一致
            </small>
          </p>
        )}

        {result.unknownCount > 0 && (
          <p>
            {result.unknownCount} conditions not registered
            <small>{result.unknownCount}件は情報未登録</small>
          </p>
        )}

        {result.selectedCount === 0 && (
          <p>
            Select conditions to calculate a confirmed match
            <small>条件を選択すると確認済み一致率を計算します</small>
          </p>
        )}
      </div>
    </div>
  );
}
