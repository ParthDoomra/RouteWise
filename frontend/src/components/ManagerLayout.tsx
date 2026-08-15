import React from 'react';
import { NavLink } from 'react-router-dom';

export const ManagerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span>RouteWise</span>
          <span className="sidebar-brand-badge">Manager</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          <NavLink to="/manager/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/manager/map" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            🗺️ Live Map
          </NavLink>
          <NavLink to="/manager/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            📦 Orders
          </NavLink>
          <NavLink to="/manager/vehicles" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            🚚 Vehicles
          </NavLink>
          <NavLink to="/manager/maintenance" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            🔧 Maintenance
          </NavLink>
          <NavLink to="/manager/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            📈 Analytics
          </NavLink>
          <NavLink to="/manager/notifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            🔔 Notifications
          </NavLink>

          <div className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Other Views</div>
          <NavLink to="/driver/route" className="sidebar-link">
            🚘 Driver View
          </NavLink>
          <NavLink to="/track/a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10" className="sidebar-link">
            🔍 Customer Track
          </NavLink>
          <NavLink to="/login" className="sidebar-link" style={{ marginTop: 'auto', color: '#e23b4a' }}>
            🚪 Logout
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div>RouteWise v1.0</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.15rem' }}>Logged in as Fleet Manager</div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="top-header">
          <div className="page-title">Fleet Operations</div>
          <div className="user-profile">
            <span>Dispatcher Admin</span>
            <div className="avatar">DA</div>
          </div>
        </header>

        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
};
