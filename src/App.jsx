import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './hooks/useProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx'
import OfferedProductsPage from './pages/dashboard/OfferedProductsPage.jsx'
import ManualSearchPage from './pages/dashboard/ManualSearchPage.jsx'
import SavedProductsPage from './pages/dashboard/SavedProductsPage.jsx'
import ProductAnalysisPage from './pages/dashboard/ProductAnalysisPage.jsx'
import ProductDetailsPage from './pages/dashboard/ProductDetailsPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route
                index
                element={<Navigate to="/dashboard/offered" replace />}
              />
              <Route path="offered" element={<OfferedProductsPage />} />
              <Route path="manual-search" element={<ManualSearchPage />} />
              <Route path="saved" element={<SavedProductsPage />} />
              <Route path="product/:asin" element={<ProductDetailsPage />} />
              <Route
                path="analysis/:asin"
                element={<ProductAnalysisPage />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

