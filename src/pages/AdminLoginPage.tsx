import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getReturnPath } from "../utils/restaurantSearch";

export function AdminLoginPage() {
  const { configurationError, isAdmin, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = getReturnPath(location.state) || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      navigate(returnPath, { replace: true });
    }
  }, [isAdmin, navigate, returnPath]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signIn(email, password);
      navigate(returnPath, { replace: true });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Restaurant management</p>
        <h1>Administrator login</h1>
        <p className="section-title-ja">管理者ログイン</p>
        <p className="auth-description">
          Sign in with an authorized administrator account.
          <span>許可された管理者アカウントでログインしてください。</span>
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="edit-field">
            <strong>Email address</strong>
            <small>メールアドレス</small>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isSubmitting || Boolean(configurationError)}
            />
          </label>

          <label className="edit-field">
            <strong>Password</strong>
            <small>パスワード</small>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={isSubmitting || Boolean(configurationError)}
            />
          </label>

          {(configurationError || errorMessage) && (
            <p className="auth-error" role="alert">
              <strong>Could not sign in.</strong>
              <span>ログインできませんでした。</span>
              <small>{configurationError || errorMessage}</small>
            </p>
          )}

          <button
            type="submit"
            className="save-button auth-submit"
            disabled={isSubmitting || Boolean(configurationError)}
          >
            {isSubmitting ? "Signing in..." : "Log in"}
            <span>{isSubmitting ? "ログイン中…" : "ログイン"}</span>
          </button>
        </form>

        <Link to="/" replace className="back-link auth-back-link">
          <strong>Go back</strong>
          <span>前の画面へ戻る</span>
        </Link>
      </section>
    </main>
  );
}
