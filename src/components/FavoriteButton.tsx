import type { MouseEvent } from "react";
import type { Restaurant } from "../types/restaurant";
import { useFavorites } from "../favorites/useFavorites";
import { getRestaurantCanonicalId } from "../utils/restaurantId";

export function FavoriteButton({ restaurant }: { restaurant: Restaurant }) {
  const { isFavorite, isLoading, isSyncing, toggleFavorite } = useFavorites();
  const restaurantId = getRestaurantCanonicalId(restaurant);
  const saved = isFavorite(restaurantId);
  const englishLabel = saved ? "Remove from favorites" : "Add to favorites";
  const japaneseLabel = saved ? "お気に入りから削除" : "お気に入りに追加";

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void toggleFavorite(restaurantId);
  };

  return (
    <button
      type="button"
      className={saved ? "favorite-button is-favorite" : "favorite-button"}
      onClick={handleClick}
      aria-label={`${englishLabel}: ${restaurant.nameEn}`}
      aria-pressed={saved}
      title={`${englishLabel} / ${japaneseLabel}`}
      disabled={isLoading || isSyncing}
    >
      <span className="favorite-heart" aria-hidden="true">
        {saved ? "♥" : "♡"}
      </span>
      <span className="favorite-label">
        <strong>{englishLabel}</strong>
        <small>{japaneseLabel}</small>
      </span>
    </button>
  );
}
