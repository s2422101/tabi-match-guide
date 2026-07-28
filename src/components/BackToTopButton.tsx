import { useEffect, useState } from "react";

const SHOW_BUTTON_AFTER_PX = 700;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY >= SHOW_BUTTON_AFTER_PX);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      className="back-to-top-button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top / ページ上部へ戻る"
      title="Back to top / ページ上部へ戻る"
    >
      <span aria-hidden="true">↑</span>
      <strong>Top</strong>
      <small>上へ</small>
    </button>
  );
}
