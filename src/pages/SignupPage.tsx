import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getSafeUserReturnPath } from "../utils/restaurantSearch";

export function SignupPage() {
  const { configurationError, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = getSafeUserReturnPath(location.state, "/mypage");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] =
    useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmation) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp(email, password);
      if (result.requiresEmailConfirmation) {
        setRequiresEmailConfirmation(true);
      } else {
        navigate(returnPath, { replace: true });
      }
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create the account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requiresEmailConfirmation) {
    return (
      <main className="auth-page user-auth-page">
        <section className="auth-panel email-confirmation-panel" role="status">
          <p className="eyebrow">Almost finished</p>
          <h1>Check your email to complete registration.</h1>
          <p className="section-title-ja">
            登録を完了するため、メールを確認してください。
          </p>
          <Link to="/login" state={location.state} className="auth-back-link">
            <strong>Go to login</strong>
            <span>ログイン画面へ</span>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page user-auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Your TabiMatch account</p>
        <h1>Create account</h1>
        <p className="section-title-ja">アカウント作成</p>

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
            <small>パスワード（8文字以上）</small>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isSubmitting || Boolean(configurationError)}
            />
          </label>
          <label className="edit-field">
            <strong>Confirm password</strong>
            <small>パスワードを再入力</small>
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isSubmitting || Boolean(configurationError)}
            />
          </label>

          {(configurationError || errorMessage) && (
            <p className="auth-error" role="alert">
              <strong>Could not create the account.</strong>
              <span>アカウントを作成できませんでした。</span>
              <small>{configurationError || errorMessage}</small>
            </p>
          )}

          <button
            type="submit"
            className="save-button auth-submit"
            disabled={isSubmitting || Boolean(configurationError)}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
            <span>{isSubmitting ? "作成中…" : "アカウント作成"}</span>
          </button>
        </form>

        <Link to="/login" state={location.state} className="auth-back-link">
          <strong>Back to login</strong>
          <span>ログイン画面へ戻る</span>
        </Link>
      </section>
    </main>
  );
}
