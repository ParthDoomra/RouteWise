import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  Wrench,
  AlertTriangle,
  Plus,
  X,
  Clock,
} from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  vehiclePlate: string;
  serviceType: string;
  serviceDate: string;
  odometerKm: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  costRupees: number;
  technician: string;
  notes: string;
}

const dummyMaintenanceHistory: MaintenanceRecord[] = [
  {
    id: 'MNT-101',
    vehiclePlate: 'KA-04-MH-9920',
    serviceType: 'Brake Pad Replacement & Hydraulic Line Flush',
    serviceDate: 'Today, 10:00 AM',
    odometerKm: 45200,
    status: 'in_progress',
    costRupees: 6800,
    technician: 'Metro Fleet Workshop (Bay #2)',
    notes: 'Triggered by 45,000 km threshold. Replacement pads OEM installed.',
  },
  {
    id: 'MNT-102',
    vehiclePlate: 'KA-01-GB-5091',
    serviceType: '5,000 km Routine Engine Oil & Filter Change',
    serviceDate: 'Aug 04, 2026',
    odometerKm: 25000,
    status: 'completed',
    costRupees: 3200,
    technician: 'HSR Auto Works',
    notes: 'Synthetic oil renewed. Tire pressure calibrated to 36 PSI.',
  },
  {
    id: 'MNT-103',
    vehiclePlate: 'KA-01-EA-1024',
    serviceType: 'EV Battery Diagnostic & Coolant Level Check',
    serviceDate: 'Jul 28, 2026',
    odometerKm: 10000,
    status: 'completed',
    costRupees: 1800,
    technician: 'Tata Motors EV Service',
    notes: 'Battery cell balance 99.4%. Software firmware updated to v2.4.',
  },
  {
    id: 'MNT-104',
    vehiclePlate: 'KA-03-HA-3301',
    serviceType: '30,000 km Major Service & Suspension Inspection',
    serviceDate: 'Jul 15, 2026',
    odometerKm: 30000,
    status: 'completed',
    costRupees: 5400,
    technician: 'Malleshwaram Central Motors',
    notes: 'Front shock absorbers inspected. Alignment adjusted.',
  },
];

export const ManagerMaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>(dummyMaintenanceHistory);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    vehiclePlate: 'KA-01-EA-1024',
    serviceType: 'Routine 5,000 km Maintenance & Inspection',
    costRupees: 2500,
    technician: 'Central Operations Bay #1',
    notes: 'Routine scheduled checkup.',
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRec: MaintenanceRecord = {
      id: `MNT-${Math.floor(105 + Math.random() * 80)}`,
      vehiclePlate: formData.vehiclePlate,
      serviceType: formData.serviceType,
      serviceDate: 'Just now',
      odometerKm: 14500,
      status: 'scheduled',
      costRupees: Number(formData.costRupees),
      technician: formData.technician,
      notes: formData.notes,
    };

    setRecords([newRec, ...records]);
    setIsAddModalOpen(false);
  };

  const filteredRecords = records.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* ── Title Banner ── */}
        <div
          className="card animate-enter"
          style={{
            padding: '1.25rem 1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            backgroundColor: '#FFFFFF',
            borderLeft: '4px solid var(--primary)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Fleet Maintenance & Service Logs
              </h1>
              <span className="status-badge badge-amber">
                <AlertTriangle size={12} /> 1 Active Workshop Ticket
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Automated odometer service interval monitoring & maintenance audit trail.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Log Service Record</span>
          </button>
        </div>

        {/* ── Summary KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div className="card card-hover-lift animate-enter stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              ACTIVE IN WORKSHOP
            </span>
            <AnimatedCounter
              value={1}
              style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--status-rose-text)' }}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              KA-04-MH-9920 (Bay #2)
            </div>
          </div>

          <div className="card card-hover-lift animate-enter stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              TOTAL FLEET UP-TIME
            </span>
            <AnimatedCounter
              value={97.8}
              decimals={1}
              suffix="%"
              style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--status-emerald-text)' }}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--status-emerald-text)', fontWeight: 700 }}>
              ✓ Above 95% Target SLA
            </div>
          </div>

          <div className="card card-hover-lift animate-enter stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              MTD MAINTENANCE SPEND
            </span>
            <AnimatedCounter
              value={17200}
              prefix="₹"
              style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary)' }}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Avg ₹955 / operational vehicle
            </div>
          </div>

          <div className="card card-hover-lift animate-enter stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              NEXT UPCOMING SERVICE
            </span>
            <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ~650 km
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              KA-01-EA-1024 (Tata Ace EV)
            </div>
          </div>
        </div>

        {/* ── Filter Buttons ── */}
        <div className="animate-enter stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {[
            { key: 'all', label: 'All Records', count: records.length },
            { key: 'in_progress', label: 'In Workshop', count: records.filter(r => r.status === 'in_progress').length },
            { key: 'scheduled', label: 'Scheduled', count: records.filter(r => r.status === 'scheduled').length },
            { key: 'completed', label: 'Completed History', count: records.filter(r => r.status === 'completed').length },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`btn ${statusFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* ── Maintenance Records Table ── */}
        <div className="card animate-enter stagger-3" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.9rem 1.25rem' }}>TICKET ID</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>VEHICLE PLATE</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>SERVICE CATEGORY</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>STATUS</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>ODOMETER</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>SERVICE DATE</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>TECHNICIAN / BAY</th>
                  <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>COST</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`animate-enter stagger-${Math.min(idx + 1, 5)}`}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background-color var(--duration-fast) ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {r.id}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <strong className="font-mono" style={{ color: 'var(--text-main)' }}>{r.vehiclePlate}</strong>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.serviceType}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.notes}</div>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span
                        className={`status-badge ${
                          r.status === 'completed'
                            ? 'badge-emerald'
                            : r.status === 'in_progress'
                            ? 'badge-amber'
                            : 'badge-olive'
                        }`}
                      >
                        {r.status === 'completed' && '✓ Completed'}
                        {r.status === 'in_progress' && '⚙ In Workshop'}
                        {r.status === 'scheduled' && '📅 Scheduled'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {r.odometerKm.toLocaleString()} km
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        <span>{r.serviceDate}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-main)' }}>
                      {r.technician}
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                        ₹{r.costRupees.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Log Service Record Modal ── */}
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
                width: '500px',
                maxWidth: '100%',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                backgroundColor: '#FAF7F2',
                borderRadius: '16px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Log Maintenance Service
                  </h3>
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
                      Select Vehicle
                    </label>
                    <select
                      value={formData.vehiclePlate}
                      onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="KA-01-EA-1024">KA-01-EA-1024 (Tata Ace EV)</option>
                      <option value="KA-01-GB-5091">KA-01-GB-5091 (Bolero)</option>
                      <option value="KA-05-MC-8812">KA-05-MC-8812 (Euler EV)</option>
                      <option value="KA-04-MH-9920">KA-04-MH-9920 (Eicher Truck)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Service Cost (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.costRupees}
                      onChange={(e) => setFormData({ ...formData, costRupees: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Service Category / Work Description
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Service Center / Workshop Facility
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Technician Notes & Parts Replaced
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                  />
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
                    Log Service Ticket
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
