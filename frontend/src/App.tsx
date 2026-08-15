import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { ManagerMapPage } from './pages/ManagerMapPage';
import { ManagerOrdersPage } from './pages/ManagerOrdersPage';
import { ManagerVehiclesPage } from './pages/ManagerVehiclesPage';
import { ManagerRouteDetailPage } from './pages/ManagerRouteDetailPage';
import { ManagerMaintenancePage } from './pages/ManagerMaintenancePage';
import { ManagerAnalyticsPage } from './pages/ManagerAnalyticsPage';
import { ManagerNotificationsPage } from './pages/ManagerNotificationsPage';
import { DriverRoutePage } from './pages/DriverRoutePage';
import { CustomerTrackingPage } from './pages/CustomerTrackingPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
          <Route path="/manager/map" element={<ManagerMapPage />} />
          <Route path="/manager/orders" element={<ManagerOrdersPage />} />
          <Route path="/manager/vehicles" element={<ManagerVehiclesPage />} />
          <Route path="/manager/routes/:vehicleId" element={<ManagerRouteDetailPage />} />
          <Route path="/manager/maintenance" element={<ManagerMaintenancePage />} />
          <Route path="/manager/analytics" element={<ManagerAnalyticsPage />} />
          <Route path="/manager/notifications" element={<ManagerNotificationsPage />} />
          <Route path="/driver/route" element={<DriverRoutePage />} />
          <Route path="/track/:trackingId" element={<CustomerTrackingPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
