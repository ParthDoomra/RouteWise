import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { MiniMapPreview } from '../components/MiniMapPreview';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { Link } from 'react-router-dom';
import { getGlobalOrders, type UnifiedOrder } from '../data/mockOrders';
import {
  Package,
  TrendingUp,
  Truck,
  Wrench,
  Sparkles,
  ArrowUpRight,
  Plus,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Search,
} from 'lucide-react';

interface SummaryCardProps {
  title: string;
  count: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  subtext: string;
  trend?: string;
  trendPositive?: boolean;
  icon: React.ReactNode;
  accentColor: string;
  badgeBg: string;
  staggerClass?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  count,
  decimals = 0,
  prefix = '',
  suffix = '',
  subtext,
  trend,
  trendPositive,
  icon,
  accentColor,
  badgeBg,
  staggerClass = '',
}) => (
  <div
    className={`card card-hover-lift animate-enter ${staggerClass}`}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
      border: '1px solid var(--border-light)',
      borderRadius: '16px',
      padding: '1.35rem 1.5rem',
    }}
  >
    {/* Subtle top indicator */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: accentColor,
      }}
    />

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </span>
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          backgroundColor: badgeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
        }}
      >
        {icon}
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
      <AnimatedCounter
        value={count}
        decimals={decimals}
        prefix={prefix}
        suffix={suffix}
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          letterSpacing: '-0.03em',
        }}
      />
      {trend && (
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: trendPositive ? 'var(--status-emerald-text)' : 'var(--status-rose-text)',
            backgroundColor: trendPositive ? 'var(--status-emerald-bg)' : 'var(--status-rose-bg)',
            border: `1px solid ${trendPositive ? 'var(--status-emerald-border)' : 'var(--status-rose-border)'}`,
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
          }}
        >
          <TrendingUp size={11} />
          {trend}
        </span>
      )}
    </div>

    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
      {subtext}
    </div>
  </div>
);

export const ManagerDashboardPage: React.FC = () => {
  const [orders] = useState<UnifiedOrder[]>(() => getGlobalOrders());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_transit' | 'delayed' | 'delivered'>('all');

  const copyTrackingUrl = (uuid: string, orderId: string) => {
    const url = `${window.location.origin}/track/${uuid}`;
    navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter((item) => {
    const matchesQuery =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.zone.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesQuery) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'delayed') return item.isDelayed;
    if (statusFilter === 'in_transit') return item.status === 'in_transit' || item.status === 'picked_up';
    if (statusFilter === 'delivered') return item.status === 'delivered';
    return true;
  });

  // Top recent AI notifications for right sidebar feed
  const aiDispatches = orders.filter((o) => o.isAiGenerated || o.isDelayed).slice(0, 5);

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* ── Top Header & Actions ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Operations Command
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Real-time dispatch overview, live fleet positions, and automated AI customer updates.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/manager/orders"
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
            >
              <Plus size={16} />
              <span>New Order</span>
            </Link>

            <Link
              to="/manager/map"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Compass size={15} style={{ color: 'var(--primary)' }} />
              <span>Full Map</span>
            </Link>

            <Link
              to="/manager/analytics"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Sparkles size={15} style={{ color: 'var(--accent-gold)' }} />
              <span>AI Simulator</span>
            </Link>
          </div>
        </div>

        {/* ── 4 KPI Summary Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem' }}>
          <SummaryCard
            title="Couriers in Transit"
            count={42}
            subtext="34 active on route • 8 assigned"
            trend="+8.2% today"
            trendPositive={true}
            icon={<Package size={17} />}
            accentColor="var(--primary)"
            badgeBg="var(--status-olive-bg)"
            staggerClass="stagger-1"
          />

          <SummaryCard
            title="SLA Compliance"
            count={94.2}
            decimals={1}
            suffix="%"
            subtext="Target benchmark: 92.0%"
            trend="+2.2% above SLA"
            trendPositive={true}
            icon={<CheckCircle2 size={17} />}
            accentColor="#1E5C32"
            badgeBg="var(--status-emerald-bg)"
            staggerClass="stagger-2"
          />

          <SummaryCard
            title="Fleet Availability"
            count={14}
            suffix=" / 18"
            subtext="13 active • 1 scheduled check"
            icon={<Truck size={17} />}
            accentColor="var(--accent-gold)"
            badgeBg="var(--status-amber-bg)"
            staggerClass="stagger-3"
          />

          <SummaryCard
            title="Maintenance Alerts"
            count={2}
            subtext="1 odometer threshold reached"
            icon={<Wrench size={17} />}
            accentColor="#8E4C0E"
            badgeBg="var(--status-amber-bg)"
            staggerClass="stagger-4"
          />
        </div>

        {/* ── 2-Column Bento Grid Layout ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* ══ LEFT COLUMN: Live Mini-Map & Active Manifest Table ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

            {/* Live Fleet Radar Card */}
            <div
              className="card animate-enter stagger-2"
              style={{
                padding: '1.35rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Live Fleet Radar
                  </h3>
                  <span className="status-badge badge-olive" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                    <span className="live-pulse-dot" /> 3 Vehicles Online
                  </span>
                </div>

                <Link
                  to="/manager/map"
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>Open Full Map</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              {/* Map Preview Container */}
              <div style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                <MiniMapPreview />
              </div>

              {/* Vehicle Speed Ticker */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  paddingTop: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                  <span className="font-mono" style={{ fontWeight: 800 }}>KA-01-EA-1024</span>
                  <span className="status-badge badge-emerald" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>38 km/h</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                  <span className="font-mono" style={{ fontWeight: 800 }}>KA-01-GB-5091</span>
                  <span className="status-badge badge-amber" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>12 km/h</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                  <span className="font-mono" style={{ fontWeight: 800 }}>KA-05-MC-8812</span>
                  <span className="status-badge badge-olive" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>42 km/h</span>
                </div>
              </div>
            </div>

            {/* Active Orders & Manifest Table Card */}
            <div
              className="card animate-enter stagger-3"
              style={{
                padding: '1.35rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.15rem',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Active Deliveries & Manifest
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    Showing {filteredOrders.length} dispatches in progress
                  </p>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`tab-pill ${statusFilter === 'all' ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                  >
                    All ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('in_transit')}
                    className={`tab-pill ${statusFilter === 'in_transit' ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                  >
                    In Transit
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('delayed')}
                    className={`tab-pill ${statusFilter === 'delayed' ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                  >
                    Delayed
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter by Order ID, customer name or delivery zone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-clean"
                  style={{ paddingLeft: '2.3rem', fontSize: '0.825rem' }}
                />
              </div>

              {/* Table Container */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer & Zone</th>
                      <th>Assigned Vehicle</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 6).map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {order.id}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            {order.customerName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {order.zone}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {order.assignedVehicle.split(' ')[0]}
                          </div>
                        </td>
                        <td>
                          {order.isDelayed ? (
                            <span className="status-badge badge-amber" style={{ fontSize: '0.72rem' }}>
                              <AlertTriangle size={11} /> Delay Active
                            </span>
                          ) : order.status === 'delivered' ? (
                            <span className="status-badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                              ✓ Delivered
                            </span>
                          ) : (
                            <span className="status-badge badge-olive" style={{ fontSize: '0.72rem' }}>
                              <span className="live-pulse-dot" /> In Transit
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => copyTrackingUrl(order.trackingUuid, order.id)}
                              title="Copy Customer Tracking Link"
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border-medium)',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: copiedId === order.id ? 'var(--status-emerald-text)' : 'var(--text-secondary)',
                              }}
                            >
                              {copiedId === order.id ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedId === order.id ? 'Copied' : 'Track Link'}</span>
                            </button>

                            <Link
                              to={`/track/${order.trackingUuid}`}
                              title="Simulate Customer Tracking Experience"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-card-subtle)',
                                color: 'var(--primary)',
                                textDecoration: 'none',
                                border: '1px solid var(--border-light)',
                              }}
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Total {orders.length} orders registered in system
                </span>
                <Link
                  to="/manager/orders"
                  style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
                >
                  Manage All Orders &rarr;
                </Link>
              </div>
            </div>

          </div>

          {/* ══ RIGHT COLUMN: Live AI Communications Feed & Fleet Readiness ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

            {/* AI Dispatches Stream */}
            <div
              className="card animate-enter stagger-3"
              style={{
                padding: '1.35rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary-tint)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                      AI Dispatches & Alerts
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Automated Claude AI recipient updates
                    </div>
                  </div>
                </div>

                <Link
                  to="/manager/analytics"
                  style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
                >
                  Simulator &rarr;
                </Link>
              </div>

              {/* Feed Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {aiDispatches.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      backgroundColor: item.isDelayed ? 'var(--status-amber-bg)' : 'var(--bg-surface)',
                      border: item.isDelayed ? '1px solid var(--status-amber-border)' : '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.id}
                        </span>
                        {item.isDelayed ? (
                          <span className="status-badge badge-amber" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                            Traffic Delay
                          </span>
                        ) : (
                          <span className="status-badge badge-olive" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                            AI Update
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.feedTime}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                      "{item.feedMessage}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid rgba(43, 36, 30, 0.06)' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        To: <strong style={{ color: 'var(--text-main)' }}>{item.customerName}</strong>
                      </span>

                      <Link
                        to={`/track/${item.trackingUuid}`}
                        style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Preview Track &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Fleet Health & Status Card */}
            <div
              className="card animate-enter stagger-4"
              style={{
                padding: '1.35rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: '#FFFFFF',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Fleet Operations Health
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Fleet Deployment Rate</span>
                    <strong style={{ color: 'var(--text-main)' }}>78% (14 / 18 Vehicles)</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: '78%', height: '100%', backgroundColor: 'var(--primary)', borderRadius: '9999px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>EV Battery Fleet Health</span>
                    <strong style={{ color: 'var(--status-emerald-text)' }}>94.6% Avg</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: '94.6%', height: '100%', backgroundColor: '#1E5C32', borderRadius: '9999px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>On-Time Dispatch Rate</span>
                    <strong style={{ color: 'var(--text-main)' }}>96.1%</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: '96.1%', height: '100%', backgroundColor: 'var(--accent-gold)', borderRadius: '9999px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
                <Link
                  to="/manager/vehicles"
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem 0.5rem' }}
                >
                  <Truck size={14} />
                  <span>Fleet Roster</span>
                </Link>

                <Link
                  to="/manager/analytics"
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem 0.5rem' }}
                >
                  <span>SLA Audit</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </ManagerLayout>
  );
};
