import { Link, useLocation } from "react-router-dom";
import { useFavorites } from "../favorites/useFavorites";

export function FavoritesLink() {
  const { favoriteCount } = useFavorites();
  const location = useLocation();

  return (
    <Link
      to={`/favorites${location.search}`}
      className="favorites-link"
      aria-label={`Favorites: ${favoriteCount} restaurants`}
    >
      <span className="favorites-link-heart" aria-hidden="true">♥</span>
      <span>
        <strong>Favorites ({favoriteCount})</strong>
        <small>お気に入り（{favoriteCount}件）</small>
      </span>
    </Link>
  );
}
