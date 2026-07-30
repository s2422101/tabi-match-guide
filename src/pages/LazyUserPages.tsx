import { lazy } from "react";

export const LazyUserLoginPage = lazy(() =>
  import("./UserLoginPage").then((module) => ({
    default: module.UserLoginPage,
  })),
);

export const LazySignupPage = lazy(() =>
  import("./SignupPage").then((module) => ({
    default: module.SignupPage,
  })),
);

export const LazyMyPage = lazy(() =>
  import("./MyPage").then((module) => ({
    default: module.MyPage,
  })),
);

export function UserPageLoading() {
  return (
    <main className="auth-page">
      <section className="auth-panel auth-status" aria-live="polite">
        <strong>Loading account page...</strong>
        <span>アカウント画面を読み込んでいます…</span>
      </section>
    </main>
  );
}
