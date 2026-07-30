import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { RestaurantDetailPage } from './pages/RestaurantDetailPage.tsx'
import { RestaurantEditPage } from './pages/RestaurantEditPage.tsx'
import { AdminLoginPage } from './pages/AdminLoginPage.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { ProtectedAdminRoute } from './auth/ProtectedAdminRoute.tsx'
import { FavoritesProvider } from './favorites/FavoritesContext.tsx'
import { FavoritesPage } from './pages/FavoritesPage.tsx'
import { LocationProvider } from './location/LocationContext.tsx'
import { LazyAdminDashboardPage } from './pages/LazyAdminDashboardPage.tsx'
import { UserPreferencesProvider } from './preferences/UserPreferencesContext.tsx'
import { ProtectedUserRoute } from './auth/ProtectedUserRoute.tsx'
import {
  LazyMyPage,
  LazySignupPage,
  LazyUserLoginPage,
  UserPageLoading,
} from './pages/LazyUserPages.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserPreferencesProvider>
          <LocationProvider>
            <FavoritesProvider>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<UserPageLoading />}>
                      <LazyUserLoginPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <Suspense fallback={<UserPageLoading />}>
                      <LazySignupPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/mypage"
                  element={
                    <ProtectedUserRoute>
                      <Suspense fallback={<UserPageLoading />}>
                        <LazyMyPage />
                      </Suspense>
                    </ProtectedUserRoute>
                  }
                />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <Suspense
                        fallback={
                          <main className="auth-page">
                            <section
                              className="auth-panel auth-status"
                              aria-live="polite"
                            >
                              <strong>Loading admin dashboard...</strong>
                              <span>管理画面を読み込んでいます…</span>
                            </section>
                          </main>
                        }
                      >
                        <LazyAdminDashboardPage />
                      </Suspense>
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/restaurants/:restaurantId"
                  element={<RestaurantDetailPage />}
                />
                <Route
                  path="/restaurants/:restaurantId/edit"
                  element={
                    <ProtectedAdminRoute>
                      <RestaurantEditPage />
                    </ProtectedAdminRoute>
                  }
                />
              </Routes>
            </FavoritesProvider>
          </LocationProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
