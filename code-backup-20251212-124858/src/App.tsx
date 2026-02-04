/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - Main App with Role-Based Routing
 * ═══════════════════════════════════════════════════════════════════════════
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Apollo Client
import { apolloClient } from './lib/apollo';

// Layout & Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import CommandCenter from './pages/CommandCenter';
import FreightExchange from './pages/FreightExchange';
import Fleet from './pages/Fleet';
import FleetGPS from './pages/FleetGPS';
import FleetAnalytics from './pages/FleetAnalytics';
import Drivers from './pages/Drivers';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Rates from './pages/Rates';
import Login from './pages/Login';
import DriverApp from './pages/DriverApp';
import DriverAppVoice from './pages/DriverAppVoice';
import Orders from './pages/Orders';
import Trips from './pages/Trips';
import Vehicles from './pages/Vehicles';
import RouteCalculator from './pages/RouteCalculator';
import RFQ from './pages/RFQ';
import DocChainPage from './pages/DocChainPage';
import GPSTracking from './pages/GPSTracking';
import OmegaDemo from './pages/OmegaDemo';
import PulseDashboard from './pages/PulseDashboard';
import WidgetDemo from './pages/WidgetDemo';
import WhatsAppDemo from './pages/WhatsAppDemo';
import WhatsAppAdmin from './pages/WhatsAppAdmin';
import OCRDemo from './pages/OCRDemo';
import SecurityDashboard from './pages/SecurityDashboard';
import CustomerPortal from './pages/CustomerPortal';
import SystemHealth from './pages/SystemHealth';
import VendorPortal from './pages/VendorPortal';

const queryClient = new QueryClient();

// ═══════════════════════════════════════════════════════════════════════════
// APP ROUTES
// ═══════════════════════════════════════════════════════════════════════════

function AppRoutes() {
  const { isAuthenticated, loading, user, logout } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading WowTruck...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ═══════════════════════════════════════════════════════════════════
          PUBLIC ROUTES - No auth required
          ═══════════════════════════════════════════════════════════════════ */}

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getDefaultRoute(user?.role)} replace /> : <Login />}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          DRIVER ROUTES - Driver role only (standalone app)
          ═══════════════════════════════════════════════════════════════════ */}

      <Route path="/driver-app" element={
        <ProtectedRoute requiredRoles={['driver', 'super_admin']}>
          <DriverApp />
        </ProtectedRoute>
      } />
      <Route path="/driver" element={
        <ProtectedRoute requiredRoles={['driver', 'super_admin']}>
          <DriverApp />
        </ProtectedRoute>
      } />
      <Route path="/driver-voice" element={
        <ProtectedRoute requiredRoles={['driver', 'super_admin']}>
          <DriverAppVoice />
        </ProtectedRoute>
      } />

      {/* ═══════════════════════════════════════════════════════════════════
          CUSTOMER PORTAL - Customer role only
          ═══════════════════════════════════════════════════════════════════ */}

      <Route path="/customer-portal" element={
        <ProtectedRoute requiredRoles={['customer', 'super_admin']}>
          <CustomerPortal />
        </ProtectedRoute>
      } />
      <Route path="/portal/customer/*" element={
        <ProtectedRoute requiredRoles={['customer', 'super_admin']}>
          <CustomerPortal />
        </ProtectedRoute>
      } />

      {/* ═══════════════════════════════════════════════════════════════════
          VENDOR PORTAL - Vendor role only
          ═══════════════════════════════════════════════════════════════════ */}

      <Route path="/vendor-portal" element={
        <ProtectedRoute requiredRoles={['vendor', 'super_admin']}>
          <VendorPortal />
        </ProtectedRoute>
      } />
      <Route path="/portal/vendor/*" element={
        <ProtectedRoute requiredRoles={['vendor', 'super_admin']}>
          <VendorPortal />
        </ProtectedRoute>
      } />

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN APP ROUTES - With Layout (Admin/Staff)
          ═══════════════════════════════════════════════════════════════════ */}

      <Route element={
        <ProtectedRoute requiredRoles={['super_admin', 'branch_manager', 'dispatcher', 'accountant']}>
          <Layout user={user} onLogout={logout} />
        </ProtectedRoute>
      }>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/command-center" replace />} />

        {/* ─────────────────────────────────────────────────────────────────
            DASHBOARD & COMMAND CENTER
            All staff can access
            ───────────────────────────────────────────────────────────────── */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/command-center" element={<CommandCenter />} />

        {/* ─────────────────────────────────────────────────────────────────
            OPERATIONS - Orders, Trips
            dispatcher, branch_manager, super_admin
            ───────────────────────────────────────────────────────────────── */}
        <Route path="/orders" element={<Orders />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/docchain" element={<DocChainPage />} />

        {/* ─────────────────────────────────────────────────────────────────
            FLEET MANAGEMENT
            dispatcher, branch_manager, super_admin
            ───────────────────────────────────────────────────────────────── */}
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/fleet-gps" element={<FleetGPS />} />
        <Route path="/fleet/analytics" element={<FleetAnalytics />} />
        <Route path="/gps-tracking" element={<GPSTracking />} />

        {/* ─────────────────────────────────────────────────────────────────
            PLANNING & RATES
            dispatcher, branch_manager, super_admin
            ───────────────────────────────────────────────────────────────── */}
        <Route path="/route" element={<RouteCalculator />} />
        <Route path="/rfq" element={<RFQ />} />
        <Route path="/rates" element={<Rates />} />
        <Route path="/freight" element={<FreightExchange />} />
        <Route path="/freight-exchange" element={<FreightExchange />} />
        <Route path="/exchange" element={<FreightExchange />} />
        <Route path="/exchange/*" element={<FreightExchange />} />

        {/* ─────────────────────────────────────────────────────────────────
            BUSINESS - Customers, Invoices
            accountant, branch_manager, super_admin
            ───────────────────────────────────────────────────────────────── */}
        <Route path="/customers" element={<Customers />} />
        <Route path="/invoices" element={<Invoices />} />

        {/* ─────────────────────────────────────────────────────────────────
            SYSTEM & ADMIN - Super Admin only
            ───────────────────────────────────────────────────────────────── */}
        <Route path="/security" element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <SecurityDashboard />
          </ProtectedRoute>
        } />
        <Route path="/widgets" element={<WidgetDemo />} />
        <Route path="/omega" element={<OmegaDemo />} />
        <Route path="/pulse" element={<PulseDashboard />} />
            <Route path="/system-health" element={<SystemHealth />} />
        <Route path="/whatsapp" element={<WhatsAppDemo />} />
        <Route path="/whatsapp-admin" element={<WhatsAppAdmin />} />
        <Route path="/ocr" element={<OCRDemo />} />

        {/* Admin Portal Previews */}
        <Route path="/admin/portal/customer" element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <CustomerPortal />
          </ProtectedRoute>
        } />
        <Route path="/admin/portal/vendor" element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <VendorPortal />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/command-center" replace />} />
      </Route>

      {/* Not authenticated catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Get default route based on role
// ═══════════════════════════════════════════════════════════════════════════

function getDefaultRoute(role?: string): string {
  switch (role) {
    case 'super_admin':
    case 'branch_manager':
      return '/command-center';
    case 'dispatcher':
      return '/command-center';
    case 'accountant':
      return '/invoices';
    case 'driver':
      return '/driver-app';
    case 'customer':
      return '/customer-portal';
    case 'vendor':
      return '/vendor-portal';
    default:
      return '/dashboard';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Router>
                <AppRoutes />
              </Router>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ApolloProvider>
  );
}

export default App;
