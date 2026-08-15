import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';

export type OrderStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed';

export interface Order {
  id: string;
  trackingUuid: string;
  pickupAddress: string;
  dropAddress: string;
  status: OrderStatus;
  assignedVehicle: string;
  timeWindow: string;
  weightKg: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  history: { status: string; timestamp: string; note: string }[];
}

const dummyOrders: Order[] = [
  {
    id: 'ORD-8945',
    trackingUuid: 'e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e',
    pickupAddress: 'Indiranagar Hub, 100ft Rd',
    dropAddress: 'MG Road, Sector 4, #402',
    status: 'in_transit',
    assignedVehicle: 'KA-01-EA-1024 (Rahul)',
    timeWindow: '14:00 - 16:00',
    weightKg: 12.5,
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    createdAt: 'Today, 11:30 AM',
    history: [
      { status: 'created', timestamp: '11:30 AM', note: 'Order placed by dispatch' },
      { status: 'assigned', timestamp: '12:15 PM', note: 'Assigned to Vehicle KA-01-EA-1024' },
      { status: 'picked_up', timestamp: '01:10 PM', note: 'Picked up from Indiranagar Hub' },
      { status: 'in_transit', timestamp: '01:40 PM', note: 'En route to MG Road' },
    ],
  },
  {
    id: 'ORD-8942',
    trackingUuid: 'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10',
    pickupAddress: 'Whitefield Depot, Block C',
    dropAddress: 'Koramangala 5th Block, #12',
    status: 'delayed',
    assignedVehicle: 'KA-01-GB-5091 (Priya)',
    timeWindow: '13:30 - 15:30',
    weightKg: 24.0,
    customerName: 'Siddharth Rao',
    customerPhone: '+91 99001 22334',
    createdAt: 'Today, 10:45 AM',
    history: [
      { status: 'created', timestamp: '10:45 AM', note: 'Order placed by customer' },
      { status: 'assigned', timestamp: '11:00 AM', note: 'Assigned to Vehicle KA-01-GB-5091' },
      { status: 'picked_up', timestamp: '12:30 PM', note: 'Picked up from Whitefield' },
      { status: 'delayed', timestamp: '02:15 PM', note: 'Heavy traffic delay reported in HSR zone. AI alert sent.' },
    ],
  },
  {
    id: 'ORD-8943',
    trackingUuid: 'b4c3d2e1-7f8a-4b5c-9d0e-1f2a3b4c5d6e',
    pickupAddress: 'Jayanagar Logistics Hub',
    dropAddress: 'Jayanagar 4th Block, #88',
    status: 'delivered',
    assignedVehicle: 'KA-05-MC-8812 (Amit)',
    timeWindow: '12:00 - 14:00',
    weightKg: 5.2,
    customerName: 'Rohan Gupta',
    customerPhone: '+91 97456 12389',
    createdAt: 'Today, 09:15 AM',
    history: [
      { status: 'created', timestamp: '09:15 AM', note: 'Order created' },
      { status: 'assigned', timestamp: '09:30 AM', note: 'Assigned to Vehicle KA-05-MC-8812' },
      { status: 'picked_up', timestamp: '10:15 AM', note: 'Package loaded' },
      { status: 'in_transit', timestamp: '11:00 AM', note: 'In transit' },
      { status: 'delivered', timestamp: '01:25 PM', note: 'Delivered. Recipient signature recorded.' },
    ],
  },
  {
    id: 'ORD-8941',
    trackingUuid: 'f9e8d7c6-b5a4-4f3e-2d1c-0b9a8f7e6d5c',
    pickupAddress: 'Malleshwaram Central Store',
    dropAddress: 'Sadashivanagar, #50',
    status: 'assigned',
    assignedVehicle: 'KA-03-HA-3301 (Vikram)',
    timeWindow: '16:00 - 18:00',
    weightKg: 8.5,
    customerName: 'Ananya Deshmukh',
    customerPhone: '+91 98440 55112',
    createdAt: 'Today, 01:15 PM',
    history: [
      { status: 'created', timestamp: '01:15 PM', note: 'Order created' },
      { status: 'assigned', timestamp: '01:30 PM', note: 'Assigned to Vehicle KA-03-HA-3301' },
    ],
  },
  {
    id: 'ORD-8940',
    trackingUuid: 'c4d3b2a1-8e7f-4a5b-9c8d-1e2f3a4b5c6d',
    pickupAddress: 'BTM Layout 2nd Stage',
    dropAddress: 'JP Nagar 6th Phase, #301',
    status: 'pending',
    assignedVehicle: 'Unassigned',
    timeWindow: '17:00 - 19:00',
    weightKg: 3.0,
    customerName: 'Karan Verma',
    customerPhone: '+91 97312 99887',
    createdAt: 'Today, 01:45 PM',
    history: [
      { status: 'created', timestamp: '01:45 PM', note: 'Order placed, pending auto-assignment engine' },
    ],
  },
];

const renderStatusBadge = (status: OrderStatus) => {
  const styles: Record<OrderStatus, { bg: string; color: string; border: string; label: string }> = {
    pending: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: '⚪ Pending' },
    assigned: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: '🔵 Assigned' },
    picked_up: { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe', label: '🟣 Picked Up' },
    in_transit: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: '🚙 In Transit' },
    delivered: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0', label: '🟢 Delivered' },
    delayed: { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: '🟡 Delayed' },
  };
  const config = styles[status] || styles.pending;
  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
};

export const ManagerOrdersPage: React.FC = () => {
  const [orders] = useState<Order[]>(dummyOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  const [formData, setFormData] = useState({
    pickup: '',
    drop: '',
    weight: '',
    timeStart: '',
    timeEnd: '',
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.dropAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Dummy Order Created!\nPickup: ${formData.pickup}\nDrop: ${formData.drop}`);
    setIsAddModalOpen(false);
    setFormData({ pickup: '', drop: '', weight: '', timeStart: '', timeEnd: '' });
  };

  const handleCopyTrackingLink = (uuid: string) => {
    const fullUrl = `${window.location.origin}/track/${uuid}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Orders Management</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Manage intake, vehicle assignment status & customer delivery tracking.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            + Add New Order
          </button>
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search by Order ID, Pickup, Drop, or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
                outline: 'none',
              }}
            >
              <option value="all">All Statuses ({orders.length})</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>ORDER ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>PICKUP ADDRESS</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>DROP ADDRESS</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>ASSIGNED VEHICLE</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>TIME WINDOW</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                      {order.id}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-main)' }}>{order.pickupAddress}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-main)' }}>{order.dropAddress}</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>{renderStatusBadge(order.status)}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>{order.assignedVehicle}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>{order.timeWindow}</td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.8rem' }}>Inspect &rarr;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Inspector Drawer */}
        {selectedOrder && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 200,
              display: 'flex', justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                width: '450px',
                backgroundColor: '#ffffff',
                height: '100%',
                padding: '2rem',
                overflowY: 'auto',
                boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Order Inspector
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                    {selectedOrder.id}
                  </h2>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
              </div>

              <div>{renderStatusBadge(selectedOrder.status)}</div>

              {/* Secure Tracking Link Field */}
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Customer Secure Tracking Link (UUID)
                </span>
                <div style={{ fontSize: '0.8rem', color: '#0369a1', wordBreak: 'break-all', fontFamily: 'monospace', backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  {window.location.origin}/track/{selectedOrder.trackingUuid}
                </div>
                <button
                  onClick={() => handleCopyTrackingLink(selectedOrder.trackingUuid)}
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: copiedStatus ? '#16a34a' : 'var(--accent-blue)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {copiedStatus ? '✓ Link Copied!' : '📋 Copy Tracking Link'}
                </button>
              </div>

              {/* Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUSTOMER NAME & PHONE</span>
                  <div><strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerPhone})</div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PICKUP ADDRESS</span>
                  <div>{selectedOrder.pickupAddress}</div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DROP ADDRESS</span>
                  <div>{selectedOrder.dropAddress}</div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WEIGHT / PAYLOAD</span>
                  <div>{selectedOrder.weightKg} kg</div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ASSIGNED VEHICLE & DRIVER</span>
                  <div>{selectedOrder.assignedVehicle}</div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.85rem', color: 'var(--text-main)' }}>
                  Status History Lifecycle
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
                  {selectedOrder.history.map((h, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', position: 'absolute', left: '-1.3rem', top: '0.25rem' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                        {h.status} <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none' }}>• {h.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {h.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: '500px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create Delivery Order</h3>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Pickup Address</label>
                  <input type="text" required placeholder="e.g. Indiranagar Hub" value={formData.pickup} onChange={(e) => setFormData({ ...formData, pickup: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Drop-off Address</label>
                  <input type="text" required placeholder="e.g. MG Road, Sector 4" value={formData.drop} onChange={(e) => setFormData({ ...formData, drop: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent-blue)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save & Dispatch</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ManagerLayout>
  );
};
