import type {
  RestaurantFeature,
  RestaurantSort,
  SearchArea,
} from "./restaurant";

export type UserPreferences = {
  preferredArea: SearchArea;
  preferredFeatures: RestaurantFeature[];
  preferredSort: RestaurantSort;
};
