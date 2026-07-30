import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function AdminAuthActions() {
  const { isAdmin, isLoading, signOut, user } = useAuth();
  const location = useLocation();
  const returnPath = `${location.pathname}${location.search}`;

  if (isLoading) {
    return <span className="admin-auth-loading">Checking admin session...</span>;
  }

  if (!isAdmin) {
    return (
      <Link
        to="/admin/login"
        state={{ from: returnPath }}
        className="admin-auth-link"
      >
        <strong>Administrator login</strong>
        <span>管理者ログイン</span>
      </Link>
    );
  }

  return (
    <div className="admin-auth-signed-in">
      {user?.email && <small>{user.email}</small>}
      <Link to="/admin" className="admin-dashboard-link">
        <strong>Admin dashboard</strong>
        <span>管理画面</span>
      </Link>
      <button type="button" onClick={() => void signOut()}>
        <strong>Log out</strong>
        <span>ログアウト</span>
      </button>
    </div>
  );
}
