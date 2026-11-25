import React, { useState, useEffect, useCallback } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import axios from 'axios';
import {
  Search,
  Plus,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Truck,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export type OrderStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed';

export interface BackendOrder {
  id: number;
  order_code: string;
  tracking_uuid: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  pickup_address?: string | null;
  drop_address?: string | null;
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  weight_kg: number;
  time_window_start?: string | null;
  time_window_end?: string | null;
  status: OrderStatus;
  delay_reason?: string | null;
  vehicle_id?: number | null;
  created_at?: string | null;
}

const renderStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'in_transit':
      return <span className="status-badge badge-olive"><span className="live-pulse-dot" /> In Transit</span>;
    case 'delayed':
      return <span className="status-badge badge-amber">⚠ Delayed</span>;
    case 'delivered':
      return <span className="status-badge badge-emerald">✓ Delivered</span>;
    case 'assigned':
      return <span className="status-badge badge-olive">● Assigned</span>;
    case 'picked_up':
      return <span className="status-badge badge-olive">● Picked Up</span>;
    case 'pending':
    default:
      return <span className="status-badge badge-slate">○ Pending</span>;
  }
};

export const ManagerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Order Form State
  const [formCustomerName, setFormCustomerName] = useState('Pooja Hegde');
  const [formCustomerPhone, setFormCustomerPhone] = useState('+91 99887 76655');
  const [formPickupAddress, setFormPickupAddress] = useState('Majestic Central Depot, Bengaluru');
  const [formPickupLat, setFormPickupLat] = useState('12.9781');
  const [formPickupLng, setFormPickupLng] = useState('77.5695');
  const [formDropAddress, setFormDropAddress] = useState('Indiranagar 100ft Rd, #18, Bengaluru');
  const [formDropLat, setFormDropLat] = useState('12.9719');
  const [formDropLng, setFormDropLng] = useState('77.6412');
  const [formWeight, setFormWeight] = useState('12.5');
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real orders from GET /orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const resp = await apiClient.get<BackendOrder[]>('/orders');
      setOrders(resp.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFetchError(err.message || 'Cannot reach server to load orders.');
      } else {
        setFetchError('Failed to load orders.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter and search
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.order_code.toLowerCase().includes(q) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(q)) ||
      (order.pickup_address && order.pickup_address.toLowerCase().includes(q)) ||
      (order.drop_address && order.drop_address.toLowerCase().includes(q)) ||
      (order.vehicle_id && `vehicle #${order.vehicle_id}`.includes(q)) ||
      order.status.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitError(null);

    const parsedWeight = parseFloat(formWeight);
    const parsedPickupLat = parseFloat(formPickupLat);
    const parsedPickupLng = parseFloat(formPickupLng);
    const parsedDropLat = parseFloat(formDropLat);
    const parsedDropLng = parseFloat(formDropLng);

    if (isNaN(parsedWeight) || isNaN(parsedPickupLat) || isNaN(parsedPickupLng) || isNaN(parsedDropLat) || isNaN(parsedDropLng)) {
      setFormSubmitError('Please enter valid numeric values for coordinates and weight.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_name: formCustomerName.trim() || null,
        customer_phone: formCustomerPhone.trim() || null,
        pickup_address: formPickupAddress.trim() || null,
        pickup_lat: parsedPickupLat,
        pickup_lng: parsedPickupLng,
        drop_address: formDropAddress.trim() || null,
        drop_lat: parsedDropLat,
        drop_lng: parsedDropLng,
        weight_kg: parsedWeight,
      };

      const resp = await apiClient.post<BackendOrder>('/orders', payload);
      const newOrder = resp.data;

      // Refresh orders list
      await fetchOrders();
      setSelectedOrder(newOrder);
      setIsAddModalOpen(false);

      // Reset form
      setFormCustomerName('');
      setFormCustomerPhone('');
      setFormPickupAddress('Majestic Central Depot, Bengaluru');
      setFormPickupLat('12.9781');
      setFormPickupLng('77.5695');
      setFormDropAddress('');
      setFormDropLat('12.9719');
      setFormDropLng('77.6412');
      setFormWeight('10.0');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setFormSubmitError('Cannot reach server');
        } else if (err.response.status === 422) {
          const detail = err.response.data?.detail;
          if (Array.isArray(detail)) {
            const formatted = detail
              .map((d: { loc?: string[]; msg?: string }) => {
                const field = d.loc ? d.loc.slice(1).join('.') : 'Field';
                return `${field}: ${d.msg}`;
              })
              .join(' | ');
            setFormSubmitError(`Validation Error: ${formatted}`);
          } else {
            setFormSubmitError(typeof detail === 'string' ? detail : 'Invalid order input data.');
          }
        } else {
          setFormSubmitError(err.response.data?.detail || 'Failed to create order on server.');
        }
      } else {
        setFormSubmitError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingLink = (uuid: string, orderCode: string) => {
    const fullUrl = `${window.location.origin}/track/${uuid}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(orderCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* ── Title & Actions Header ── */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Orders & Delivery Manifest
              </h1>
              <span className="status-badge badge-olive" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {orders.length} Active Orders
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Dispatch intake, vehicle assignments, and live customer tracking link management.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              onClick={fetchOrders}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
              title="Refresh Orders"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                setFormSubmitError(null);
                setIsAddModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
            >
              <Plus size={16} />
              <span>Create New Order</span>
            </button>
          </div>
        </div>

        {/* ── Error Banner if Fetch Fails ── */}
        {fetchError && (
          <div
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '12px',
              backgroundColor: '#FFF1F2',
              border: '1px solid #FECDD3',
              color: 'var(--status-rose-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={fetchOrders}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Search & Filter Pill Bar ── */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search Order Code, customer, address, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-clean"
              style={{ paddingLeft: '2.3rem', fontSize: '0.825rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Orders', count: orders.length },
              { key: 'in_transit', label: 'In Transit', count: orders.filter((o) => o.status === 'in_transit').length },
              { key: 'delayed', label: 'Delayed', count: orders.filter((o) => o.status === 'delayed').length },
              { key: 'assigned', label: 'Assigned', count: orders.filter((o) => o.status === 'assigned').length },
              { key: 'delivered', label: 'Delivered', count: orders.filter((o) => o.status === 'delivered').length },
              { key: 'pending', label: 'Pending', count: orders.filter((o) => o.status === 'pending').length },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`tab-pill ${statusFilter === f.key ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div
          className="card animate-enter stagger-2"
          style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: '16px' }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-light)',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '1rem 1.25rem' }}>ORDER CODE</th>
                  <th style={{ padding: '1rem 1.25rem' }}>CUSTOMER</th>
                  <th style={{ padding: '1rem 1.25rem' }}>PICKUP HUB</th>
                  <th style={{ padding: '1rem 1.25rem' }}>DELIVERY DESTINATION</th>
                  <th style={{ padding: '1rem 1.25rem' }}>STATUS</th>
                  <th style={{ padding: '1rem 1.25rem' }}>ASSIGNED VEHICLE</th>
                  <th style={{ padding: '1rem 1.25rem' }}>WEIGHT</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={24} className="spin-icon" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading orders from server...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>No orders found</span>
                        <span style={{ fontSize: '0.825rem' }}>No delivery orders match your search or status filter.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`animate-enter stagger-${Math.min(idx + 1, 5)}`}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'background-color var(--duration-fast) ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>
                          {order.order_code}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {order.customer_name || 'Anonymous Customer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.customer_phone || 'No phone provided'}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                        {order.pickup_address || `${order.pickup_lat.toFixed(4)}, ${order.pickup_lng.toFixed(4)}`}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        {order.drop_address || `${order.drop_lat.toFixed(4)}, ${order.drop_lng.toFixed(4)}`}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        {renderStatusBadge(order.status)}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          <Truck size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{order.vehicle_id ? `Vehicle #${order.vehicle_id}` : 'Unassigned (Pending)'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {order.weight_kg ? `${order.weight_kg} kg` : 'N/A'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <span
                          style={{
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.825rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight size={14} />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Order Inspector Drawer ── */}
        {selectedOrder && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(32, 26, 22, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="drawer-slide-in"
              style={{
                width: '480px',
                maxWidth: '92vw',
                backgroundColor: '#FAF7F2',
                height: '100%',
                padding: '2.25rem 2rem',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.4rem',
                borderLeft: '1px solid var(--border-light)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Order Details Inspector
                  </span>
                  <h2 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {selectedOrder.order_code}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '0.25rem',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div>{renderStatusBadge(selectedOrder.status)}</div>

              {/* Customer Live Tracking Link Box */}
              <div
                style={{
                  padding: '1.15rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Customer Tracking UUID Link
                  </span>
                  <Link
                    to={`/track/${selectedOrder.tracking_uuid}`}
                    target="_blank"
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Open Live View</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>

                <div
                  className="font-mono"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--primary)',
                    backgroundColor: 'var(--bg-surface)',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    wordBreak: 'break-all',
                  }}
                >
                  {window.location.origin}/track/{selectedOrder.tracking_uuid}
                </div>

                <button
                  onClick={() => copyTrackingLink(selectedOrder.tracking_uuid, selectedOrder.order_code)}
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-start', fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                >
                  {copiedId === selectedOrder.order_code ? (
                    <Check size={14} style={{ color: 'var(--status-emerald-text)' }} />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedId === selectedOrder.order_code ? 'Tracking Link Copied!' : 'Copy Tracking Link'}</span>
                </button>
              </div>

              {/* Order Details Manifest */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.875rem' }}>
                <div style={{ paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    RECIPIENT CUSTOMER
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {selectedOrder.customer_name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {selectedOrder.customer_phone || 'No phone'}
                  </div>
                </div>

                <div style={{ paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    PICKUP ORIGIN
                  </span>
                  <div style={{ color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {selectedOrder.pickup_address || `${selectedOrder.pickup_lat}, ${selectedOrder.pickup_lng}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    Lat: {selectedOrder.pickup_lat.toFixed(4)}, Lng: {selectedOrder.pickup_lng.toFixed(4)}
                  </div>
                </div>

                <div style={{ paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    DELIVERY DESTINATION
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {selectedOrder.drop_address || `${selectedOrder.drop_lat}, ${selectedOrder.drop_lng}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    Lat: {selectedOrder.drop_lat.toFixed(4)}, Lng: {selectedOrder.drop_lng.toFixed(4)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    paddingBottom: '0.65rem',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      PAYLOAD WEIGHT
                    </span>
                    <div className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {selectedOrder.weight_kg} kg
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      ASSIGNED VEHICLE
                    </span>
                    <div style={{ color: 'var(--text-main)', marginTop: '0.15rem', fontWeight: 600 }}>
                      {selectedOrder.vehicle_id ? `Vehicle ID #${selectedOrder.vehicle_id}` : 'Pending Assignment'}
                    </div>
                  </div>
                </div>

                {selectedOrder.delay_reason && (
                  <div
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--status-amber-bg, #FEF3C7)',
                      border: '1px solid #FDE68A',
                      color: 'var(--status-amber-text, #92400E)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Delay Alert:</span>
                    <span>{selectedOrder.delay_reason}</span>
                  </div>
                )}
              </div>

              {/* Direct Simulate Experience Button */}
              <Link
                to={`/track/${selectedOrder.tracking_uuid}`}
                target="_blank"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'auto', fontSize: '0.875rem' }}
              >
                <span>Simulate Live Recipient Experience for {selectedOrder.order_code}</span>
                <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Create New Order Modal (POST /orders) ── */}
        {isAddModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(32, 26, 22, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setIsAddModalOpen(false)}
          >
            <div
              className="card modal-pop-in"
              style={{
                width: '540px',
                maxWidth: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                backgroundColor: '#FAF7F2',
                borderRadius: '18px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Create Delivery Order
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Submits to live backend (POST /orders) with coordinates and weight validation.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {formSubmitError && (
                <div
                  style={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: '10px',
                    backgroundColor: '#FFF1F2',
                    border: '1px solid #FECDD3',
                    color: 'var(--status-rose-text)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{formSubmitError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Customer Full Name
                    </label>
                    <input
                      type="text"
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      placeholder="e.g. Pooja Hegde"
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.825rem',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Customer Phone Number
                    </label>
                    <input
                      type="text"
                      value={formCustomerPhone}
                      onChange={(e) => setFormCustomerPhone(e.target.value)}
                      placeholder="e.g. +91 99887 76655"
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.825rem',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Pickup Hub Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formPickupAddress}
                    onChange={(e) => setFormPickupAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.825rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Pickup Latitude (-90 to 90) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formPickupLat}
                      onChange={(e) => setFormPickupLat(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.825rem',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Pickup Longitude (-180 to 180) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formPickupLng}
                      onChange={(e) => setFormPickupLng(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.825rem',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Drop-off Delivery Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={formDropAddress}
                    onChange={(e) => setFormDropAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.825rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Drop Latitude (-90 to 90) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formDropLat}
                      onChange={(e) => setFormDropLat(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.825rem',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Drop Longitude (-180 to 180) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formDropLng}
                      onChange={(e) => setFormDropLng(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.825rem',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Payload Weight (kg, &gt; 0) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.825rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ opacity: isSubmitting ? 0.7 : 1 }}
                  >
                    <span>{isSubmitting ? 'Submitting to Backend...' : 'Submit Order Manifest'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerOrdersPage;
