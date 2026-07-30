import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="auth-page">
        <section className="auth-panel auth-status" aria-live="polite">
          <strong>Checking administrator session...</strong>
          <span>管理者セッションを確認しています…</span>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <main className="auth-page">
        <section className="auth-panel auth-access-denied" role="alert">
          <p className="eyebrow">Access denied</p>
          <h1>Administrator access is required.</h1>
          <p className="section-title-ja">管理者権限が必要です</p>
          <p className="auth-description">
            This account is not authorized to manage restaurants.
            <span>このアカウントには店舗管理の権限がありません。</span>
          </p>
          <Link to="/" className="details-button">
            View public site
          </Link>
        </section>
      </main>
    );
  }

  return children;
}
