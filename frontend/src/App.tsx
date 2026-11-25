import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { ManagerMapPage } from './pages/ManagerMapPage';
import { ManagerOrdersPage } from './pages/ManagerOrdersPage';
import { ManagerVehiclesPage } from './pages/ManagerVehiclesPage';
import { ManagerRouteDetailPage } from './pages/ManagerRouteDetailPage';
import { ManagerMaintenancePage } from './pages/ManagerMaintenancePage';
import { ManagerNotificationsPage } from './pages/ManagerNotificationsPage';
import { ManagerAnalyticsPage } from './pages/ManagerAnalyticsPage';
import { DriverRoutePage } from './pages/DriverRoutePage';
import { CustomerTrackingPage } from './pages/CustomerTrackingPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Manager Protected Routes */}
            <Route element={<ProtectedRoute allowedRole="manager" />}>
              <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
              <Route path="/manager/map" element={<ManagerMapPage />} />
              <Route path="/manager/orders" element={<ManagerOrdersPage />} />
              <Route path="/manager/vehicles" element={<ManagerVehiclesPage />} />
              <Route path="/manager/routes/:vehicleId" element={<ManagerRouteDetailPage />} />
              <Route path="/manager/maintenance" element={<ManagerMaintenancePage />} />
              <Route path="/manager/analytics" element={<ManagerAnalyticsPage />} />
              <Route path="/manager/notifications" element={<ManagerNotificationsPage />} />
            </Route>

            {/* Driver Protected Routes */}
            <Route element={<ProtectedRoute allowedRole="driver" />}>
              <Route path="/driver/route" element={<DriverRoutePage />} />
            </Route>

            {/* Public Tracking Route */}
            <Route path="/track/:trackingId" element={<CustomerTrackingPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
