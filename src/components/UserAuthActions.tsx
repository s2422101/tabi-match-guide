import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function UserAuthActions() {
  const { isAdmin, isLoading, user } = useAuth();
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}`;

  if (isLoading) {
    return <span className="user-auth-loading">Checking account...</span>;
  }

  if (!user) {
    return (
      <Link to="/login" state={{ from: currentPath }} className="user-auth-link">
        <strong>Log in</strong>
        <span>ログイン</span>
      </Link>
    );
  }

  return (
    <div className="user-auth-actions">
      <Link to="/mypage" className="user-auth-link">
        <strong>My Page</strong>
        <span>マイページ</span>
      </Link>
      {isAdmin && (
        <Link to="/admin" className="user-auth-link admin-dashboard-shortcut">
          <strong>Admin dashboard</strong>
          <span>管理画面</span>
        </Link>
      )}
    </div>
  );
}
