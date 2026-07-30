import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  getSafePublicReturnPath,
  getSafeUserReturnPath,
} from "../utils/restaurantSearch";

export function UserLoginPage() {
  const { configurationError, isLoading, signIn, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = getSafeUserReturnPath(location.state, "/mypage");
  const publicReturnPath = getSafePublicReturnPath(location.state);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate(returnPath, { replace: true });
    }
  }, [isLoading, navigate, returnPath, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signIn(email, password);
      navigate(returnPath, { replace: true });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not log in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page user-auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Your TabiMatch account</p>
        <h1>User login</h1>
        <p className="section-title-ja">ユーザーログイン</p>

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
              <strong>Could not log in.</strong>
              <span>ログインできませんでした。</span>
              <small>{configurationError || errorMessage}</small>
            </p>
          )}

          <button
            type="submit"
            className="save-button auth-submit"
            disabled={isSubmitting || Boolean(configurationError)}
          >
            {isSubmitting ? "Logging in..." : "Log in"}
            <span>{isSubmitting ? "ログイン中…" : "ログイン"}</span>
          </button>
        </form>

        <div className="user-auth-secondary-actions">
          <Link to="/signup" state={location.state}>
            <strong>Create account</strong>
            <span>アカウント作成</span>
          </Link>
          <Link to={publicReturnPath} replace>
            <strong>Continue without logging in</strong>
            <span>ログインせずに利用する</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
