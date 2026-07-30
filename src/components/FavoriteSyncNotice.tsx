import { useFavorites } from "../favorites/useFavorites";

export function FavoriteSyncNotice() {
  const { clearError, errorMessage, isSyncing } = useFavorites();

  if (!errorMessage && !isSyncing) {
    return null;
  }

  return (
    <div
      className={`favorite-sync-notice${errorMessage ? " is-error" : ""}`}
      role={errorMessage ? "alert" : "status"}
    >
      <span>
        <strong>{errorMessage ? "Could not sync favorites." : "Syncing favorites..."}</strong>
        <small>
          {errorMessage
            ? "お気に入りを同期できませんでした。"
            : "お気に入りを同期しています…"}
        </small>
        {errorMessage && <small>{errorMessage}</small>}
      </span>
      {errorMessage && (
        <button type="button" onClick={clearError} aria-label="Dismiss favorite error">
          ×
        </button>
      )}
    </div>
  );
}
