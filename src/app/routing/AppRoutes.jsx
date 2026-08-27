import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import FeatureRouteGuard from '@/shared/components/FeatureRouteGuard';
import { NotificationProvider } from '@/features/pos/context/NotificationContext';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRedirect from './RoleBasedRedirect';
import RouteFallback from './RouteFallback';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));

const POSScreen = lazy(() => import('@/features/pos/pages/POSScreen'));
const InventorySystem = lazy(() => import('@/features/inventory/pages/InventorySystem'));

const ManagerLayout = lazy(() => import('@/features/manager/layout/Layout'));
const ManagerDashboard = lazy(() => import('@/features/manager/pages/Dashboard'));
const ManagerApprovals = lazy(() => import('@/features/manager/pages/Approvals'));
const ManagerBranchActivity = lazy(() => import('@/features/manager/pages/BranchActivityLog'));
const ManagerSales = lazy(() => import('@/features/manager/pages/Sales'));
const ManagerSalesReports = lazy(() => import('@/features/manager/pages/SalesReports'));
const ManagerUserRegistrations = lazy(() => import('@/features/manager/pages/UserRegistrations'));
const ManagerLoyalty = lazy(() => import('@/features/manager/pages/Loyalty'));
const ManagerPOApprovals = lazy(() => import('@/features/manager/pages/ManagerPOApprovals'));
const ManagerServicesScreen = lazy(() => import('@/features/manager/pages/ManagerServicesScreen'));
const ManagerSecondaryRoles = lazy(() => import('@/features/manager/pages/SecondaryRoleAssignment'));
const ManagerExpenses = lazy(() => import('@/features/manager/pages/Expenses'));
const ManagerSupplierPayments = lazy(() => import('@/features/manager/pages/SupplierPayments'));

const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard'));

const DtvTechnicianLayout = lazy(() => import('@/features/technician/pages/DtvTechnicianLayout'));
const MobileTechnicianLayout = lazy(() => import('@/features/technician/pages/MobileTechnicianLayout'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/" element={<RoleBasedRedirect />} />

        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['CASHIER', 'SUPERVISOR']}>
              <NotificationProvider>
                <POSScreen />
              </NotificationProvider>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['STORE_KEEPER']}>
              <InventorySystem />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerDashboard />} />
          <Route path="approvals" element={<ManagerApprovals />} />
          <Route path="activity" element={<ManagerBranchActivity />} />
          <Route path="sales" element={<ManagerSales />} />
          <Route
            path="sales-reports"
            element={
              <FeatureRouteGuard featureCode="SALES_REPORTS" featureName="Sales Reports">
                <ManagerSalesReports />
              </FeatureRouteGuard>
            }
          />
          <Route path="staff" element={<ManagerUserRegistrations />} />
          <Route path="user-registrations" element={<ManagerUserRegistrations />} />
          <Route
            path="loyalty"
            element={
              <FeatureRouteGuard featureCode="MANAGER_LOYALTY" featureName="Manager Loyalty">
                <ManagerLoyalty />
              </FeatureRouteGuard>
            }
          />
          <Route path="manager-po-approvals" element={<ManagerPOApprovals />} />
          <Route path="services" element={<ManagerServicesScreen />} />
          <Route path="secondary-roles" element={<ManagerSecondaryRoles />} />
          <Route path="expenses" element={<ManagerExpenses />} />
          <Route path="supplier-payments" element={<ManagerSupplierPayments />} />
        </Route>

        <Route
          path="/dtv-tech/*"
          element={
            <ProtectedRoute allowedRoles={['DTV_TECHNICIAN']}>
              <DtvTechnicianLayout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mobile-tech/*"
          element={
            <ProtectedRoute allowedRoles={['MOBILE_TECHNICIAN']}>
              <MobileTechnicianLayout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
