import React, { useState, useEffect } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { MiniMapPreview } from '../components/MiniMapPreview';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import axios from 'axios';
import {
  Package,
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
  RefreshCw,
} from 'lucide-react';

export interface DashboardOrder {
  id: number;
  order_code: string;
  tracking_uuid: string;
  customer_name: string | null;
  customer_phone: string | null;
  pickup_address: string | null;
  drop_address: string | null;
  weight_kg: number | null;
  status: string;
  delay_reason: string | null;
  vehicle_id: number | null;
  created_at: string | null;
}

export interface DashboardVehicle {
  id: number;
  plate_no: string;
  model: string | null;
  capacity_kg: number;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  mileage_km: number;
}

export interface DashboardMaintenanceTicket {
  id: number;
  vehicle_id: number;
  trigger_type: string;
  status: string;
}

export interface DashboardNotification {
  id: number;
  order_id: number | null;
  message: string;
  channel: string;
  is_ai_generated: boolean;
  sent_at: string | null;
}

export const ManagerDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [tickets, setTickets] = useState<DashboardMaintenanceTicket[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_transit' | 'delayed' | 'delivered'>('all');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [oRes, vRes, mRes, nRes] = await Promise.all([
        apiClient.get<DashboardOrder[]>('/orders'),
        apiClient.get<DashboardVehicle[]>('/vehicles'),
        apiClient.get<DashboardMaintenanceTicket[]>('/maintenance').catch(() => ({ data: [] as DashboardMaintenanceTicket[] })),
        apiClient.get<DashboardNotification[]>('/notifications').catch(() => ({ data: [] as DashboardNotification[] })),
      ]);
      setOrders(oRes.data);
      setVehicles(vRes.data);
      setTickets(mRes.data);
      setNotifications(nRes.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFetchError(err.response?.data?.detail || err.message || 'Cannot reach server');
      } else {
        setFetchError('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const copyTrackingUrl = (uuid: string, orderCode: string) => {
    const url = `${window.location.origin}/track/${uuid}`;
    navigator.clipboard.writeText(url);
    setCopiedId(orderCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI Calculations
  const activeDeliveries = orders.filter((o) =>
    ['assigned', 'picked_up', 'in_transit', 'delayed'].includes(o.status)
  );
  const onRouteCount = vehicles.filter((v) => v.status === 'on_route').length;
  const availableVehiclesCount = vehicles.filter(
    (v) => v.status === 'available' || v.status === 'standby'
  ).length;
  const inMaintenanceCount = vehicles.filter((v) => v.status === 'maintenance').length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'resolved').length;

  const filteredOrders = orders.filter((item) => {
    const matchesQuery =
      item.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customer_name && item.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.drop_address && item.drop_address.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesQuery) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'delayed') return item.status === 'delayed' || Boolean(item.delay_reason);
    if (statusFilter === 'in_transit') return item.status === 'in_transit' || item.status === 'picked_up' || item.status === 'assigned';
    if (statusFilter === 'delivered') return item.status === 'delivered';
    return true;
  });

  // Recent 5 notifications for right feed
  const recentNotifications = notifications.slice(0, 5);

  const getVehicleForOrder = (vehicleId: number | null): string => {
    if (!vehicleId) return 'Unassigned';
    const v = vehicles.find((veh) => veh.id === vehicleId);
    return v ? v.plate_no : `Vehicle #${vehicleId}`;
  };

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
            <button
              onClick={fetchDashboardData}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              title="Refresh Dashboard"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>

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
              to="/manager/notifications"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Sparkles size={15} style={{ color: 'var(--accent-gold)' }} />
              <span>Notifications</span>
            </Link>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {fetchError && (
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--status-rose-bg, #FFF1F2)',
              border: '1px solid var(--status-rose-border, #FECDD3)',
              borderRadius: '12px',
              color: 'var(--status-rose-text, #9F1239)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fetchError}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── 4 KPI Summary Cards Computed From Real DB Lists ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem' }}>
          
          {/* Card 1: Active Deliveries */}
          <div
            className="card card-hover-lift animate-enter stagger-1"
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
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--primary)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Deliveries
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'var(--status-olive-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Package size={17} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
              <AnimatedCounter
                value={activeDeliveries.length}
                style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-emerald-text)', backgroundColor: 'var(--status-emerald-bg)', border: '1px solid var(--status-emerald-border)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                Live Manifest
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {orders.filter((o) => o.status === 'in_transit').length} in transit • {orders.filter((o) => o.status === 'assigned').length} assigned
            </div>
          </div>

          {/* Card 2: On-Time Percentage -> Specifically "No data yet" */}
          <div
            className="card card-hover-lift animate-enter stagger-2"
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
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#1E5C32' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                On-Time Percentage
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'var(--status-emerald-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E5C32' }}>
                <CheckCircle2 size={17} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                No data yet
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Benchmark calculation awaiting delivered orders
            </div>
          </div>

          {/* Card 3: Fleet Availability (vehicles available out of total) */}
          <div
            className="card card-hover-lift animate-enter stagger-3"
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
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-gold)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fleet Availability
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'var(--status-amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                <Truck size={17} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                {availableVehiclesCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {vehicles.length}</span>
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {onRouteCount} on route • {inMaintenanceCount} in maintenance
            </div>
          </div>

          {/* Card 4: Open Maintenance Tickets */}
          <div
            className="card card-hover-lift animate-enter stagger-4"
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
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#8E4C0E' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Maintenance Alerts
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'var(--status-amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E4C0E' }}>
                <Wrench size={17} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
              <AnimatedCounter
                value={openTicketsCount}
                style={{ fontSize: '2rem', fontWeight: 800, color: openTicketsCount > 0 ? 'var(--status-rose-text)' : 'var(--text-main)', letterSpacing: '-0.03em' }}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {openTicketsCount > 0 ? `${openTicketsCount} open maintenance ticket${openTicketsCount > 1 ? 's' : ''}` : 'All fleet assets operational'}
            </div>
          </div>

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
                    <span className="live-pulse-dot" /> {vehicles.filter(v => v.current_lat && v.current_lng).length} Vehicles Located
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
                <MiniMapPreview vehicles={vehicles} />
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
                {vehicles.slice(0, 3).map((v) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                    <span className="font-mono" style={{ fontWeight: 800 }}>{v.plate_no}</span>
                    <span
                      className={`status-badge ${
                        v.status === 'on_route'
                          ? 'badge-emerald'
                          : v.status === 'maintenance'
                          ? 'badge-rose'
                          : 'badge-slate'
                      }`}
                      style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}
                    >
                      {v.status === 'on_route' ? 'En Route' : v.status === 'maintenance' ? 'In Bay' : 'Available'}
                    </span>
                  </div>
                ))}
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
                    Showing {filteredOrders.length} dispatches in manifest
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
                    Active / Transit
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
                  placeholder="Filter by Order Code, customer name or destination..."
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
                      <th>Customer & Address</th>
                      <th>Assigned Vehicle</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 6).map((order) => {
                      const vehPlate = getVehicleForOrder(order.vehicle_id);

                      return (
                        <tr key={order.id}>
                          <td>
                            <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                              {order.order_code}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                              {order.customer_name || 'Customer'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {order.drop_address || 'Bengaluru Delivery'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {vehPlate}
                            </div>
                          </td>
                          <td>
                            {order.status === 'delayed' || order.delay_reason ? (
                              <span className="status-badge badge-amber" style={{ fontSize: '0.72rem' }}>
                                <AlertTriangle size={11} /> Delay Active
                              </span>
                            ) : order.status === 'delivered' ? (
                              <span className="status-badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                                ✓ Delivered
                              </span>
                            ) : order.status === 'in_transit' || order.status === 'assigned' ? (
                              <span className="status-badge badge-olive" style={{ fontSize: '0.72rem' }}>
                                <span className="live-pulse-dot" /> {order.status === 'in_transit' ? 'In Transit' : 'Assigned'}
                              </span>
                            ) : (
                              <span className="status-badge badge-slate" style={{ fontSize: '0.72rem' }}>
                                Pending
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button
                                onClick={() => copyTrackingUrl(order.tracking_uuid, order.order_code)}
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
                                  color: copiedId === order.order_code ? 'var(--status-emerald-text)' : 'var(--text-secondary)',
                                }}
                              >
                                {copiedId === order.order_code ? <Check size={12} /> : <Copy size={12} />}
                                <span>{copiedId === order.order_code ? 'Copied' : 'Track Link'}</span>
                              </button>

                              <Link
                                to={`/track/${order.tracking_uuid}`}
                                target="_blank"
                                title="Open Customer Tracking Link"
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ══ RIGHT COLUMN: Recent Notifications Feed ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Recent Notifications Feed
                  </h3>
                </div>

                <Link
                  to="/manager/notifications"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  All Logs &rarr;
                </Link>
              </div>

              {recentNotifications.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No recent notifications recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '0.95rem 1.15rem',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-light)',
                        borderLeft: notif.is_ai_generated ? '3px solid #C49746' : '3px solid var(--primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                        <span className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          {notif.order_id ? `Order #${notif.order_id}` : 'Broadcast'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {notif.sent_at ? new Date(notif.sent_at).toLocaleTimeString() : 'Recent'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.45, margin: 0 }}>
                        {notif.message}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span className="status-badge badge-slate" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                          {notif.channel} (simulated send)
                        </span>
                        {notif.is_ai_generated ? (
                          <span className="status-badge badge-olive" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                            ✦ AI-Generated
                          </span>
                        ) : (
                          <span className="status-badge badge-slate" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                            template
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </ManagerLayout>
  );
};
