import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { CustomerTrackingModal } from './CustomerTrackingModal';
import {
  LayoutDashboard,
  Map,
  Package,
  Truck,
  BarChart3,
  Smartphone,
  ExternalLink,
  Compass,
  LogOut,
} from 'lucide-react';

interface ManagerLayoutProps {
  children: React.ReactNode;
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children }) => {
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  return (
    <div className="app-container" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* ── Left Sidebar (Clean Warm Editorial Theme) ── */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '68px',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', textDecoration: 'none' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary)',
                color: '#FAF7F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.88rem',
                boxShadow: '0 2px 6px rgba(63, 82, 46, 0.25)',
              }}
            >
              RW
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)', lineHeight: 1.1 }}>
                Route<span style={{ color: 'var(--accent-gold)' }}>Wise</span>
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Operations OS
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '1.25rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.35rem 0.75rem' }}>
            Management
          </div>

          <NavLink
            to="/manager/dashboard"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#FAF7F2' : 'var(--text-secondary)',
              transition: 'all var(--duration-fast) ease',
            })}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/manager/map"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#FAF7F2' : 'var(--text-secondary)',
              transition: 'all var(--duration-fast) ease',
            })}
          >
            <Map size={17} />
            <span>Live Dispatch Map</span>
          </NavLink>

          <NavLink
            to="/manager/orders"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#FAF7F2' : 'var(--text-secondary)',
              transition: 'all var(--duration-fast) ease',
            })}
          >
            <Package size={17} />
            <span>Orders & Manifest</span>
          </NavLink>

          <NavLink
            to="/manager/vehicles"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#FAF7F2' : 'var(--text-secondary)',
              transition: 'all var(--duration-fast) ease',
            })}
          >
            <Truck size={17} />
            <span>Fleet & Maintenance</span>
          </NavLink>

          <NavLink
            to="/manager/analytics"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#FAF7F2' : 'var(--text-secondary)',
              transition: 'all var(--duration-fast) ease',
            })}
          >
            <BarChart3 size={17} />
            <span>Analytics & AI Logs</span>
          </NavLink>

          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1rem 0.75rem 0.35rem' }}>
            Live Portals
          </div>

          <Link
            to="/driver/route"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.835rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-light)',
              transition: 'all var(--duration-fast) ease',
            }}
          >
            <Smartphone size={16} style={{ color: 'var(--primary)' }} />
            <span>Driver App Portal</span>
            <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </Link>

          <button
            type="button"
            onClick={() => setIsTrackingModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-card-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.835rem',
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              marginTop: '0.35rem',
              transition: 'all var(--duration-fast) ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)';
              e.currentTarget.style.borderColor = 'var(--border-light)';
            }}
          >
            <Compass size={16} style={{ color: 'var(--accent-gold)' }} />
            <span>Customer Track Demo</span>
            <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </button>
        </nav>

        {/* User Info Bottom Bar */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-tint)',
                color: 'var(--primary)',
                border: '1px solid var(--primary-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              DC
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Dispatcher Center
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Bengaluru Hub #1
              </div>
            </div>
          </div>

          <Link
            to="/login"
            title="Log out to Login Page"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'all var(--duration-fast) ease',
            }}
          >
            <LogOut size={16} />
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area (Clean Warm Canvas) ── */}
      <div className="main-content">
        {/* Top Operational Header */}
        <header
          style={{
            height: '68px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Operations Center:</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Bengaluru Central Hub (BLR-HUB-01)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="status-badge badge-olive" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
              <span className="live-pulse-dot" />
              Live Telemetry Streaming
            </span>

            <Link
              to="/manager/map"
              className="btn btn-secondary btn-pill"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.95rem' }}
            >
              <Compass size={14} style={{ color: 'var(--primary)' }} />
              <span>Full Screen Map</span>
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main style={{ padding: '2rem', flex: 1, backgroundColor: 'var(--bg-app)', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {/* Customer Tracking Modal */}
      <CustomerTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />
    </div>
  );
};

