import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { RestaurantDetailPage } from './pages/RestaurantDetailPage.tsx'
import { RestaurantEditPage } from './pages/RestaurantEditPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/restaurants/:restaurantId"
          element={<RestaurantDetailPage />}
        />
        <Route
          path="/restaurants/:restaurantId/edit"
          element={<RestaurantEditPage />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
