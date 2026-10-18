import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { PricingPage } from './pages/public/PricingPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';
import { VerifyEmailPage } from './pages/public/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';

// Authenticated Business Pages
import { DashboardPage } from './pages/app/DashboardPage';
import { CatalogPage } from './pages/app/CatalogPage';
import { CustomersPage } from './pages/app/CustomersPage';
import { SuppliersPage } from './pages/app/SuppliersPage';
import { InventoryPage } from './pages/app/InventoryPage';
import { OrdersPage } from './pages/app/OrdersPage';
import { CreateOrderPage } from './pages/app/CreateOrderPage';
import { OrderDetailPage } from './pages/app/OrderDetailPage';
import { InvoicesPage } from './pages/app/InvoicesPage';
import { DispatchesPage } from './pages/app/DispatchesPage';
import { KhataPage } from './pages/app/KhataPage';
import { CollectionsPage } from './pages/app/CollectionsPage';
import { ReturnsPage } from './pages/app/ReturnsPage';
import { ExpensesPage } from './pages/app/ExpensesPage';
import { ReportsPage } from './pages/app/ReportsPage';
import { WhatsAppInboxPage } from './pages/app/WhatsAppInboxPage';
import { RecoveryPage } from './pages/app/RecoveryPage';
import { FieldSalesPage } from './pages/app/FieldSalesPage';
import { SettingsPage } from './pages/app/SettingsPage';

// Platform Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminTenantsPage } from './pages/admin/AdminTenantsPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';

const ProtectedAppRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading MetriFlow...
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isSuperAdmin, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-xs">
        Verifying administrator privileges...
      </div>
    );
  }
  return isAuthenticated && isSuperAdmin ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Marketing Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated Business Application */}
      <Route
        path="/app"
        element={
          <ProtectedAppRoute>
            <AppLayout />
          </ProtectedAppRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<CreateOrderPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="dispatches" element={<DispatchesPage />} />
        <Route path="khata" element={<KhataPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="whatsapp" element={<WhatsAppInboxPage />} />
        <Route path="recovery" element={<RecoveryPage />} />
        <Route path="field" element={<FieldSalesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Platform Administration */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="tenants" element={<AdminTenantsPage />} />
        <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="system" element={<AdminSystemPage />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
