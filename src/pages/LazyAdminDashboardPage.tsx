import { lazy } from "react";

export const LazyAdminDashboardPage = lazy(() =>
  import("./AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
