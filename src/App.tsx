import { useMemo, useState } from "react";
import "./App.css";
import { PreferenceForm } from "./components/PreferenceForm";
import { RestaurantCard } from "./components/RestaurantCard";
import { restaurants } from "./data/restaurants";
import type { RestaurantFeature } from "./types/restaurant";
import { calculateMatchScore } from "./utils/match";

function App() {
  const [selectedFeatures, setSelectedFeatures] = useState<
    RestaurantFeature[]
  >([]);

  const [selectedArea, setSelectedArea] = useState("all");

  const rankedRestaurants = useMemo(() => {
  return restaurants
    .filter((restaurant) => {
      if (selectedArea === "all") {
        return true;
      }

      return restaurant.area === selectedArea;
    })
    .map((restaurant) => ({
      restaurant,
      matchScore: calculateMatchScore(
        restaurant,
        selectedFeatures,
      ),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}, [selectedFeatures, selectedArea]);

  return (
    <main>
      <header className="hero">
  <p className="eyebrow">TabiMatch Guide</p>

  <h1>Find a restaurant that fits your needs.</h1>

  <p className="hero-ja">
    あなたの条件に合う日本の飲食店を探す
  </p>

  <p className="hero-description">
    Discover Japanese restaurants based on your dietary needs,
    payment preferences and required facilities.

    <span className="hero-description-ja">
      食習慣、避けたい食材、支払い方法、店内設備などから、
      自分に合った飲食店を検索できます。
    </span>
  </p>
</header>
<section className="area-section">
  <div className="area-heading">
    <div>
      <h2>Select an area</h2>
      <p>エリアを選択してください</p>
    </div>
  </div>

  <div className="area-buttons">
    <button
      type="button"
      className={selectedArea === "all" ? "area-button active" : "area-button"}
      onClick={() => setSelectedArea("all")}
    >
      <strong>All Areas</strong>
      <span>すべてのエリア</span>
    </button>

    <button
      type="button"
      className={
        selectedArea === "Asakusa"
          ? "area-button active"
          : "area-button"
      }
      onClick={() => setSelectedArea("Asakusa")}
    >
      <strong>Asakusa</strong>
      <span>浅草</span>
    </button>

    <button
      type="button"
      className={
        selectedArea === "Ueno"
          ? "area-button active"
          : "area-button"
      }
      onClick={() => setSelectedArea("Ueno")}
    >
      <strong>Ueno</strong>
      <span>上野</span>
    </button>
  </div>
</section>
      <PreferenceForm
        selectedFeatures={selectedFeatures}
        onChange={setSelectedFeatures}
      />

      <section className="results-section">
  <div className="results-heading">
    <div>
      <p className="eyebrow">Restaurant Matches</p>
      <h2>Recommended restaurants</h2>
      <p className="section-title-ja">おすすめの飲食店</p>
    </div>

    <p className="result-count">
      {rankedRestaurants.length} restaurants found
      <span className="result-count-ja">
        {rankedRestaurants.length}件の飲食店
      </span>
    </p>
  </div>

        <div className="restaurant-list">
          {rankedRestaurants.map(
            ({ restaurant, matchScore }) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                selectedFeatures={selectedFeatures}
                matchScore={matchScore}
              />
            ),
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
