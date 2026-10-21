import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { Link } from 'react-router-dom';
import { getGlobalOrders, addGlobalOrder, type UnifiedOrder, type OrderStatus } from '../data/mockOrders';
import {
  Search,
  Plus,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Truck,
  X,
} from 'lucide-react';

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
  const [orders, setOrders] = useState<UnifiedOrder[]>(() => getGlobalOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    pickup: 'Indiranagar Central Hub, 100ft Rd',
    drop: 'Koramangala 4th Block, #18, Bengaluru',
    customerName: 'Pooja Hegde',
    customerPhone: '+91 99887 76655',
    weight: '6.5',
    timeWindow: '15:00 - 17:00',
    assignedVehicle: 'KA-01-EA-1024 (Rahul Sharma)',
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.dropAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUuid = `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newOrderObj: UnifiedOrder = {
      id: newId,
      trackingUuid: newUuid,
      pickupAddress: formData.pickup,
      dropAddress: formData.drop,
      zone: 'Koramangala / Central',
      status: 'assigned',
      isDelayed: false,
      assignedVehicle: formData.assignedVehicle,
      vehiclePlate: formData.assignedVehicle.split(' ')[0],
      driverName: formData.assignedVehicle.includes('(') ? formData.assignedVehicle.split('(')[1].replace(')', '') : 'Assigned Courier',
      driverPhone: '+91 98450 11223',
      estimatedArrival: '16:15 PM (On Time)',
      timeWindow: formData.timeWindow,
      weightKg: parseFloat(formData.weight) || 5.0,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      vehicleLat: 12.9716,
      vehicleLng: 77.5946,
      routePolyline: [
        [12.9716, 77.5946],
        [12.9650, 77.6100],
        [12.9350, 77.6240],
      ],
      createdAt: 'Just now',
      history: [
        { status: 'created', timestamp: 'Just now', note: 'Order manifest submitted by dispatcher' },
        { status: 'assigned', timestamp: 'Just now', note: `Assigned to ${formData.assignedVehicle}` },
      ],
      feedTime: 'Just now',
      feedMessage: `Order ${newId} assigned to ${formData.assignedVehicle}.`,
      isAiGenerated: false,
    };

    addGlobalOrder(newOrderObj);
    setOrders(getGlobalOrders());
    setSelectedOrder(newOrderObj);
    setIsAddModalOpen(false);
  };

  const copyTrackingLink = (uuid: string, orderId: string) => {
    const fullUrl = `${window.location.origin}/track/${uuid}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(orderId);
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
              <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
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

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
          >
            <Plus size={16} />
            <span>Create New Order</span>
          </button>
        </div>

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
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search Order ID, customer, address, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-clean"
              style={{ paddingLeft: '2.3rem', fontSize: '0.825rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Orders', count: orders.length },
              { key: 'in_transit', label: 'In Transit', count: orders.filter(o => o.status === 'in_transit').length },
              { key: 'delayed', label: 'Delayed', count: orders.filter(o => o.status === 'delayed').length },
              { key: 'assigned', label: 'Assigned', count: orders.filter(o => o.status === 'assigned').length },
              { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
              { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
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
        <div className="card animate-enter stagger-2" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>ORDER ID</th>
                  <th style={{ padding: '1rem 1.25rem' }}>CUSTOMER</th>
                  <th style={{ padding: '1rem 1.25rem' }}>PICKUP HUB</th>
                  <th style={{ padding: '1rem 1.25rem' }}>DELIVERY DESTINATION</th>
                  <th style={{ padding: '1rem 1.25rem' }}>STATUS</th>
                  <th style={{ padding: '1rem 1.25rem' }}>ASSIGNED VEHICLE</th>
                  <th style={{ padding: '1rem 1.25rem' }}>TIME WINDOW</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
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
                        {order.id}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerPhone}</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {order.pickupAddress}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-main)', fontWeight: 500 }}>
                      {order.dropAddress}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {renderStatusBadge(order.status)}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        <Truck size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{order.assignedVehicle}</span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {order.timeWindow}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span>Inspect</span>
                        <ChevronRight size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
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
                gap: '1.5rem',
                borderLeft: '1px solid var(--border-light)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Order Details Inspector
                  </span>
                  <h2 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {selectedOrder.id}
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
                    Specific Order Recipient Tracking Link
                  </span>
                  <Link
                    to={`/track/${selectedOrder.trackingUuid}`}
                    target="_blank"
                    style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
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
                  {window.location.origin}/track/{selectedOrder.trackingUuid}
                </div>

                <button
                  onClick={() => copyTrackingLink(selectedOrder.trackingUuid, selectedOrder.id)}
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-start', fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                >
                  {copiedId === selectedOrder.id ? <Check size={14} style={{ color: 'var(--status-emerald-text)' }} /> : <Copy size={14} />}
                  <span>{copiedId === selectedOrder.id ? 'Tracking Link Copied!' : 'Copy Tracking Link'}</span>
                </button>
              </div>

              {/* Order Details Manifest */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.875rem' }}>
                <div style={{ paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>RECIPIENT CUSTOMER</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {selectedOrder.customerName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {selectedOrder.customerPhone}
                  </div>
                </div>

                <div style={{ paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>PICKUP ORIGIN</span>
                  <div style={{ color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedOrder.pickupAddress}</div>
                </div>

                <div style={{ paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>DELIVERY DESTINATION</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedOrder.dropAddress}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Zone: {selectedOrder.zone}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>PAYLOAD WEIGHT</span>
                    <div className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {selectedOrder.weightKg} kg
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>TIME WINDOW</span>
                    <div className="font-mono" style={{ color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {selectedOrder.timeWindow}
                    </div>
                  </div>
                </div>

                <div style={{ paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>DISPATCH COURIER & VEHICLE</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedOrder.assignedVehicle}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Driver: {selectedOrder.driverName} ({selectedOrder.driverPhone})</div>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h4 style={{ fontSize: '0.925rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                  Delivery Lifecycle Audit Trail
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderLeft: '2px solid var(--border-medium)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
                  {selectedOrder.history.map((h, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: i === selectedOrder.history.length - 1 ? 'var(--primary)' : 'var(--border-medium)',
                          position: 'absolute',
                          left: '-1.3rem',
                          top: '0.25rem',
                        }}
                      />
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                        {h.status} <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none' }}>• {h.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {h.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Simulate Experience Button */}
              <Link
                to={`/track/${selectedOrder.trackingUuid}`}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'auto', fontSize: '0.875rem' }}
              >
                <span>Simulate Live Recipient Experience for {selectedOrder.id}</span>
                <ExternalLink size={15} />
              </Link>

            </div>
          </div>
        )}

        {/* ── Create New Order Modal ── */}
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
                width: '520px',
                maxWidth: '100%',
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
                    Add pickup, drop location and auto-dispatch to available vehicle fleet.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Customer Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Customer Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Pickup Hub Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pickup}
                    onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Drop-off Delivery Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.drop}
                    onChange={(e) => setFormData({ ...formData, drop: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Assign Vehicle
                    </label>
                    <select
                      value={formData.assignedVehicle}
                      onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="KA-01-EA-1024 (Rahul Sharma)">KA-01-EA-1024 (Rahul Sharma)</option>
                      <option value="KA-01-GB-5091 (Priya Nair)">KA-01-GB-5091 (Priya Nair)</option>
                      <option value="KA-05-MC-8812 (Amit Patel)">KA-05-MC-8812 (Amit Patel)</option>
                      <option value="KA-03-HA-3301 (Vikram Singh)">KA-03-HA-3301 (Vikram Singh)</option>
                      <option value="KA-02-JL-4411 (Deepak Kumar)">KA-02-JL-4411 (Deepak Kumar)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Save & Auto-Dispatch
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
