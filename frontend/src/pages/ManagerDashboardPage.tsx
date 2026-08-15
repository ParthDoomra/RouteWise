import React from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { MiniMapPreview } from '../components/MiniMapPreview';
import { Link } from 'react-router-dom';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtext, icon }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>{title}</span>
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
    </div>
    <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
      {subtext}
    </div>
  </div>
);

interface NotificationItem {
  id: string;
  orderId: string;
  message: string;
  time: string;
  isAiGenerated: boolean;
}

const dummyNotifications: NotificationItem[] = [
  {
    id: 'n1',
    orderId: 'ORD-8942',
    message: 'Your RouteWise order ORD-8942 is experiencing a 25 min delay due to traffic in HSR zone. Track live: routewise.com/track/a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10 — ETA: 2:55 PM',
    time: '10 mins ago',
    isAiGenerated: true,
  },
  {
    id: 'n2',
    orderId: 'ORD-8945',
    message: 'Your RouteWise order ORD-8945 has been picked up by Rahul Sharma! Track live: routewise.com/track/e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e — ETA: 2:20 PM',
    time: '22 mins ago',
    isAiGenerated: false,
  },
  {
    id: 'n3',
    orderId: 'ORD-8938',
    message: 'Order ORD-8938 loaded at Whitefield Hub. Track live: routewise.com/track/c4d3b2a1-8e7f-4a5b-9c8d-1e2f3a4b5c6d — ETA: 3:15 PM',
    time: '45 mins ago',
    isAiGenerated: false,
  },
  {
    id: 'n4',
    orderId: 'ORD-8935',
    message: 'Route re-optimized for Vehicle KA-05-MC-8812 due to mid-route order intake.',
    time: '1 hour ago',
    isAiGenerated: false,
  },
  {
    id: 'n5',
    orderId: 'ORD-8931',
    message: 'Your RouteWise order ORD-8931 is delayed by rainfall in Electronic City. Track live: routewise.com/track/f9e8d7c6-b5a4-4f3e-2d1c-0b9a8f7e6d5c — ETA: 4:30 PM',
    time: '2 hours ago',
    isAiGenerated: true,
  },
];

export const ManagerDashboardPage: React.FC = () => {
  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Top Header Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Manager Dashboard
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Real-time operational summary & fleet activity overview.
            </p>
          </div>
          <Link
            to="/manager/orders"
            style={{
              backgroundColor: 'var(--primary)',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            + Create New Order
          </Link>
        </div>

        {/* Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <SummaryCard
            title="Active Deliveries"
            value="42"
            subtext="34 in transit • 8 assigned"
            icon="📦"
          />
          <SummaryCard
            title="On-Time % (Today)"
            value="94.2%"
            subtext="+2.4% vs yesterday target"
            icon="⏱️"
          />
          <SummaryCard
            title="Vehicles Available"
            value="14 / 18"
            subtext="3 on route • 1 under service"
            icon="🚚"
          />
          <SummaryCard
            title="Open Maintenance Tickets"
            value="2"
            subtext="1 automated mileage trigger"
            icon="🔧"
          />
        </div>

        {/* Main Section Grid: Map Preview + Recent Notifications */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

          {/* Mini Live Map Preview Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Live Fleet Preview</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>3 active vehicles currently tracked</span>
              </div>
              <Link
                to="/manager/map"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--accent-blue)',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                View full map &rarr;
              </Link>
            </div>

            <MiniMapPreview />
          </div>

          {/* Recent Notifications Feed Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Recent Notifications Feed</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest automated status & customer dispatches</span>
              </div>
              <Link
                to="/manager/notifications"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--accent-blue)',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                View log &rarr;
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
              {dummyNotifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                      {item.orderId}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.isAiGenerated && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#7c3aed',
                            backgroundColor: '#f3e8ff',
                            border: '1px solid #d8b4fe',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          ✨ AI-Generated
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.time}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.4', wordBreak: 'break-word' }}>
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </ManagerLayout>
  );
};
