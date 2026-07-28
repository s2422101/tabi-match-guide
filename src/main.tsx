import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { RestaurantDetailPage } from './pages/RestaurantDetailPage.tsx'
import { RestaurantEditPage } from './pages/RestaurantEditPage.tsx'
import { AdminLoginPage } from './pages/AdminLoginPage.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { ProtectedAdminRoute } from './auth/ProtectedAdminRoute.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
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
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
