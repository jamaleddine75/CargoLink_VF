import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";

import AuthGuard from "./components/auth/AuthGuard";
import { AnimatePresence } from "framer-motion";
import React, { Suspense, lazy } from "react";

const GlobalLoader = () => (
  <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/60 animate-pulse">Loading Environment...</p>
  </div>
);

// ── Driver ──────────────────────────────────────────────────────────────────
import DriverLayout from "./layouts/DriverLayout";
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));
const DriverOrders = lazy(() => import('./pages/driver/DriverOrders'));
const ActiveOrder = lazy(() => import('./pages/driver/ActiveOrder'));
import WalletPage from "./pages/driver/WalletPage";
import DriverHistory from "./pages/driver/DriverHistory";
import DriverRegistration from "./pages/driver/DriverRegistration";
import RoutesMap from "./pages/driver/RoutesMap";
import DeliveryFlow from "./pages/driver/DeliveryFlow";
import UnifiedProof from "./pages/driver/UnifiedProof";
import DriverProfile from "./pages/driver/DriverProfile";
import DriverSecurityPage from "./pages/driver/DriverSecurityPage";
import ScanPage from "./pages/driver/ScanPage";

// ── Client ───────────────────────────────────────────────────────────────────
import ClientLayout from "./layouts/ClientLayout";
import CustomerDashboard from "./pages/client/CustomerDashboard";
import CustomerOrders from "./pages/client/CustomerOrders";
import CreateOrder from "./pages/client/CreateOrder";
import CustomerWallet from "./pages/client/CustomerWallet";
import CustomerRegistration from "./pages/client/CustomerRegistration";
import CustomerOrderDetail from "./pages/client/CustomerOrderDetail";
import OrderTrackingDashboard from "./pages/client/OrderTrackingDashboard";

// ── Common ───────────────────────────────────────────────────────────────────
import Settings from "./pages/common/Settings";
import Notifications from "./pages/common/Notifications";
import TrackingPage from "./pages/common/TrackingPage";
import DriverIncidentPage from "./pages/driver/IncidentPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/auth/PendingApproval";
import SuspendedPage from "./pages/common/Suspended";
import UnifiedLogin from "./pages/auth/UnifiedLogin";
import AuthPage from "./pages/auth/AuthPage";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import LoginSelection from "./pages/auth/LoginSelection";
import RegisterSelection from "./pages/auth/RegisterSelection";

// ── Admin ────────────────────────────────────────────────────────────────────
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import GlobalLiveMap from "./pages/admin/GlobalLiveMap";
import AgenciesManagement from "./pages/admin/AgenciesManagement";
import PricingManagement from "./pages/admin/PricingManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import PendingUsers from "./pages/admin/PendingUsers";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAttribution from "./pages/admin/AdminAttribution";
import AdminRouteMonitor from "./pages/admin/AdminRouteMonitor";
import AuditPendingRemittances from "./pages/admin/AuditPendingRemittances";
const AdminCreateAgency = lazy(() => import("./pages/admin/create-agency"));
import RegionManagement from "./pages/admin/RegionManagement";
import { FinancialCenterPage } from "./features/finance/pages/FinancialCenterPage";
const AgencyDetails = lazy(() => import('./pages/admin/AgencyDetails'));

// ── Agency ───────────────────────────────────────────────────────────────────
import AgencyLayout from "@/layouts/agency";
import AgencyDashboard from "@/pages/agency/dashboard";
import AgencyOrders from "@/pages/agency/orders";
import ManageDrivers from "@/pages/agency/drivers";
import AgencyWallet from "@/pages/agency/wallet";
import CODReconciliation from "@/pages/agency/reconciliation";
const AgencyLiveOps = lazy(() => import("@/pages/agency/live-ops/index"));
const AgencyOrderDetail = lazy(() => import("./pages/agency/orders/OrderDetails"));
const AgencyCreateOrder = lazy(() => import("./pages/agency/orders/CreateOrder"));
const AgencyCustomers = lazy(() => import("./pages/agency/customers/index"));
const AgencyCustomerDetails = lazy(() => import("./pages/agency/customers/CustomerDetails"));

import AgencySettings from "@/pages/agency/settings";
import AgencyPendingDrivers from "@/pages/agency/PendingDrivers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000
    },
    mutations: {
      retry: 1
    }
  }
});

  const AnimatedRoutes = () => {
    const location = useLocation();
    return (
      <AnimatePresence mode="wait">
        <Suspense fallback={<GlobalLoader />}>
          <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<UnifiedLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/suspended" element={<SuspendedPage />} />
          <Route path="/login/selection" element={<LoginSelection />} />
          <Route path="/admin/login" element={<Navigate replace to="/login" />} />
          <Route path="/register/customer" element={<CustomerRegistration />} />
          <Route path="/register/driver" element={<DriverRegistration />} />
          <Route path="/register" element={<RegisterSelection />} />
          <Route path="/tracking/:orderId" element={<TrackingPage />} />
          <Route path="/app/tracking/:orderId" element={<TrackingPage />} />

          {/* ── Driver Routes ── */}
          <Route
            path="/driver"
            element={
              <AuthGuard allowedRoles={['DRIVER']}>
                <DriverLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<DriverDashboard />} />
            <Route path="routes" element={<RoutesMap />} />
            <Route path="routes/:orderId" element={<RoutesMap />} />
            <Route path="orders" element={<DriverOrders />} />
            <Route path="orders/:id" element={<ActiveOrder />} />
            {/* Delivery flow (spec: /driver/delivery/:id → DeliveryFlow) */}
            <Route path="delivery/:orderId" element={<DeliveryFlow />} />
            <Route path="delivery/:orderId/proof" element={<UnifiedProof />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="profile" element={<DriverProfile />} />
            <Route path="security/password" element={<DriverSecurityPage />} />
            <Route path="settings" element={<Navigate replace to="profile" />} />
            <Route path="history" element={<DriverHistory />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="scan" element={<ScanPage />} />
            <Route path="problem/:id" element={<DriverIncidentPage />} />
            <Route path="*" element={<Navigate replace to="dashboard" />} />
          </Route>

          {/* ── Admin Routes ── */}
          <Route
            path="/admin"
            element={
              <AuthGuard allowedRoles={['ADMIN']}>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetails />} />
            <Route path="attribution" element={<AdminAttribution />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="users/pending" element={<PendingUsers />} />
            <Route path="agencies" element={<AgenciesManagement />} />
            <Route path="agencies/create" element={<AdminCreateAgency />} />
            <Route path="agencies/:id" element={<AgencyDetails />} />
            <Route path="pricing" element={<PricingManagement />} />
            <Route path="wallets" element={<Navigate to="/admin/financial-center" replace />} />
            <Route path="map" element={<GlobalLiveMap />} />
            <Route path="audit-remittances" element={<AuditPendingRemittances />} />
            <Route path="regions" element={<RegionManagement />} />
            <Route path="monitor" element={<AdminRouteMonitor />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="finance" element={<Navigate to="/admin/financial-center" replace />} />
            <Route path="financial-center" element={<FinancialCenterPage />} />
          </Route>

          {/* ── Agency Routes ── */}
          <Route
            path="/agency"
            element={
              <AuthGuard allowedRoles={['ADMIN', 'AGENCY_ADMIN', 'AGENCY']}>
                <AgencyLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<AgencyDashboard />} />
            <Route path="live-ops" element={<AgencyLiveOps />} />
            <Route path="orders" element={<AgencyOrders />} />
            <Route path="orders/:id" element={<AgencyOrderDetail />} />
            <Route path="create-order" element={<AgencyCreateOrder />} />
            <Route path="customers" element={<AgencyCustomers />} />
            <Route path="customers/:id" element={<AgencyCustomerDetails />} />
            <Route path="drivers" element={<ManageDrivers />} />
            <Route path="pending-drivers" element={<AgencyPendingDrivers />} />
            <Route path="wallet" element={<AgencyWallet />} />
            <Route path="remittances" element={<Navigate replace to="wallet" />} />
            <Route path="monitor" element={<Navigate replace to="live-ops" />} />
            <Route path="cod-reconciliation" element={<CODReconciliation />} />
            <Route path="settings" element={<AgencySettings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* ── Client Routes ── */}
          <Route
            path="/client"
            element={
              <AuthGuard allowedRoles={['CUSTOMER']}>
                <ClientLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="orders" element={<CustomerOrders />} />
            <Route path="orders/:id" element={<CustomerOrderDetail />} />
            <Route path="track-orders" element={<OrderTrackingDashboard />} />
            <Route path="create-order" element={<CreateOrder />} />
            <Route path="wallet" element={<CustomerWallet />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate replace to="dashboard" />} />
          </Route>

          <Route path="/customer/*" element={<Navigate replace to="/client" />} />
          <Route path="/agence/*" element={<Navigate replace to="/agency" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

import { ErrorBoundary } from "./components/ErrorBoundary";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary fallbackMessage="A critical initialization error occurred.">
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary fallbackMessage="A routing or render error occurred.">
                  <AnimatedRoutes />
                </ErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
            </ThemeProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
