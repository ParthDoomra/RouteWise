import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { ManagerMapPage } from './pages/ManagerMapPage';
import { ManagerOrdersPage } from './pages/ManagerOrdersPage';
import { ManagerVehiclesPage } from './pages/ManagerVehiclesPage';
import { ManagerRouteDetailPage } from './pages/ManagerRouteDetailPage';
import { ManagerAnalyticsPage } from './pages/ManagerAnalyticsPage';
import { DriverRoutePage } from './pages/DriverRoutePage';
import { CustomerTrackingPage } from './pages/CustomerTrackingPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
          <Route path="/manager/map" element={<ManagerMapPage />} />
          <Route path="/manager/orders" element={<ManagerOrdersPage />} />
          <Route path="/manager/vehicles" element={<ManagerVehiclesPage />} />
          <Route path="/manager/routes/:vehicleId" element={<ManagerRouteDetailPage />} />
          <Route path="/manager/maintenance" element={<Navigate to="/manager/vehicles" replace />} />
          <Route path="/manager/analytics" element={<ManagerAnalyticsPage />} />
          <Route path="/manager/notifications" element={<Navigate to="/manager/analytics" replace />} />
          <Route path="/driver/route" element={<DriverRoutePage />} />
          <Route path="/track/:trackingId" element={<CustomerTrackingPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
