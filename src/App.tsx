import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { RoleRoute } from './components/shared/RoleRoute'
import { AuthLayout } from './components/layouts/AuthLayout'
import { CustomerLayout } from './components/layouts/CustomerLayout'
import { VendorLayout } from './components/layouts/VendorLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import GoogleSetupPage from './pages/auth/GoogleSetupPage'
import BrowsePage from './pages/customer/BrowsePage'
import ListingDetailPage from './pages/customer/ListingDetailPage'
import CheckoutSuccessPage from './pages/customer/CheckoutSuccessPage'
import CheckoutCancelPage from './pages/customer/CheckoutCancelPage'
import VNPayReturnPage from './pages/customer/VNPayReturnPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import VendorDashboardPage from './pages/vendor/VendorDashboardPage'
import VendorInventoryPage from './pages/vendor/VendorInventoryPage'
import VendorComposePage from './pages/vendor/VendorComposePage'
import ListingsPage from './pages/vendor/ListingsPage'
import ListingFormPage from './pages/vendor/ListingFormPage'
import VendorOrdersPage from './pages/vendor/VendorOrdersPage'
import QRScanPage from './pages/vendor/QRScanPage'
import VendorStorePage from './pages/customer/VendorStorePage'
import SubscriptionsPage from './pages/customer/SubscriptionsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/setup" element={<GoogleSetupPage />} />
          </Route>

          <Route element={<ProtectedRoute><RoleRoute role="customer"><CustomerLayout /></RoleRoute></ProtectedRoute>}>
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/listing/:id" element={<ListingDetailPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="/checkout/vnpay-return" element={<VNPayReturnPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
          </Route>

          <Route element={<ProtectedRoute><RoleRoute role="vendor"><VendorLayout /></RoleRoute></ProtectedRoute>}>
            <Route path="/vendor" element={<VendorDashboardPage />} />
            <Route path="/vendor/listings" element={<ListingsPage />} />
            <Route path="/vendor/listings/new" element={<ListingFormPage />} />
            <Route path="/vendor/listings/:id/edit" element={<ListingFormPage />} />
            <Route path="/vendor/orders" element={<VendorOrdersPage />} />
            <Route path="/vendor/scan" element={<QRScanPage />} />
            <Route path="/vendor/inventory" element={<VendorInventoryPage />} />
            <Route path="/vendor/compose" element={<VendorComposePage />} />
          </Route>

          <Route path="/store/:vendorId" element={<VendorStorePage />} />
          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route path="*" element={<Navigate to="/browse" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
