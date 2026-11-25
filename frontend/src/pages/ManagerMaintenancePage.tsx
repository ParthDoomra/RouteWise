import React, { useState, useEffect } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { apiClient } from '../api/client';
import axios from 'axios';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';

export interface BackendMaintenanceTicket {
  id: number;
  vehicle_id: number;
  trigger_type: string;
  description: string | null;
  status: string; // 'open' | 'in_progress' | 'resolved'
  created_at: string | null;
  resolved_at: string | null;
}

export interface BackendVehicle {
  id: number;
  plate_no: string;
  model: string | null;
}

export const ManagerMaintenancePage: React.FC = () => {
  const [tickets, setTickets] = useState<BackendMaintenanceTicket[]>([]);
  const [vehicles, setVehicles] = useState<BackendVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [mRes, vRes] = await Promise.all([
        apiClient.get<BackendMaintenanceTicket[]>('/maintenance'),
        apiClient.get<BackendVehicle[]>('/vehicles').catch(() => ({ data: [] as BackendVehicle[] })),
      ]);
      setTickets(mRes.data);
      setVehicles(vRes.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFetchError(err.response?.data?.detail || err.message || 'Cannot reach server');
      } else {
        setFetchError('Failed to load maintenance records from server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (ticketId: number) => {
    setResolvingId(ticketId);
    try {
      const res = await apiClient.patch<BackendMaintenanceTicket>(`/maintenance/${ticketId}/resolve`);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? res.data : t))
      );
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : 'Failed to resolve ticket';
      alert(`Error: ${msg}`);
    } finally {
      setResolvingId(null);
    }
  };

  const getVehiclePlate = (vehicleId: number): string => {
    const v = vehicles.find((veh) => veh.id === vehicleId);
    return v ? v.plate_no : `Vehicle #${vehicleId}`;
  };

  const openTicketsCount = tickets.filter((t) => t.status !== 'resolved').length;
  const resolvedTicketsCount = tickets.filter((t) => t.status === 'resolved').length;

  const filteredTickets = tickets.filter((r) => {
    const plate = getVehiclePlate(r.vehicle_id);
    const matchesSearch =
      `MNT-${r.id}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.trigger_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return r.status !== 'resolved';
    if (statusFilter === 'resolved') return r.status === 'resolved';
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Fleet Maintenance & Service Logs
              </h1>
              <span className={`status-badge ${openTicketsCount > 0 ? 'badge-amber' : 'badge-emerald'}`}>
                {openTicketsCount > 0 ? (
                  <>
                    <AlertTriangle size={12} /> {openTicketsCount} Active Workshop Ticket{openTicketsCount > 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} /> All Vehicles Operational
                  </>
                )}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Automated odometer service interval monitoring & maintenance audit trail.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={fetchData}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              title="Refresh tickets"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
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
              onClick={fetchData}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Summary KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div className="card card-hover-lift animate-enter stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              ACTIVE IN WORKSHOP
            </span>
            <AnimatedCounter
              value={openTicketsCount}
              style={{ fontSize: '1.9rem', fontWeight: 800, color: openTicketsCount > 0 ? 'var(--status-rose-text)' : 'var(--status-emerald-text)' }}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {openTicketsCount > 0 ? 'Requires technician inspection' : 'Zero vehicles currently grounded'}
            </div>
          </div>

          <div className="card card-hover-lift animate-enter stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              RESOLVED TICKETS
            </span>
            <AnimatedCounter
              value={resolvedTicketsCount}
              style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--status-emerald-text)' }}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--status-emerald-text)', fontWeight: 700 }}>
              ✓ Completed service history
            </div>
          </div>

          <div className="card card-hover-lift animate-enter stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              TOTAL TICKETS LOGGED
            </span>
            <AnimatedCounter
              value={tickets.length}
              style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary)' }}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Across {vehicles.length} fleet assets
            </div>
          </div>

          <div className="card card-hover-lift animate-enter stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              SYSTEM DIAGNOSTICS
            </span>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Automated
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Connected to engine & odometer telemetry
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by ticket, plate or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-clean"
              style={{ paddingLeft: '2.3rem', fontSize: '0.825rem' }}
            />
          </div>

          <div className="animate-enter stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {[
              { key: 'all', label: 'All Records', count: tickets.length },
              { key: 'open', label: 'Open / In Workshop', count: openTicketsCount },
              { key: 'resolved', label: 'Resolved History', count: resolvedTicketsCount },
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
        </div>

        {/* ── Maintenance Records Table ── */}
        {isLoading ? (
          <div
            style={{
              padding: '4rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
            }}
          >
            <RefreshCw size={28} className="spin-icon" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Loading maintenance records from database...
            </span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div
            style={{
              padding: '3.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
              textAlign: 'center',
            }}
          >
            <Wrench size={36} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              No Maintenance Tickets Found
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
              {searchQuery || statusFilter !== 'all'
                ? 'No maintenance tickets match your current filters.'
                : 'All fleet vehicles are operating smoothly with no active service tickets.'}
            </p>
          </div>
        ) : (
          <div className="card animate-enter stagger-3" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.9rem 1.25rem' }}>TICKET ID</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>VEHICLE PLATE</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>TRIGGER REASON</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>STATUS</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>CREATED DATE</th>
                    <th style={{ padding: '0.9rem 1.25rem' }}>RESOLVED DATE</th>
                    <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((r, idx) => {
                    const plate = getVehiclePlate(r.vehicle_id);
                    const isResolved = r.status === 'resolved';

                    return (
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
                            MNT-#{r.id}
                          </span>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <strong className="font-mono" style={{ color: 'var(--text-main)' }}>{plate}</strong>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.trigger_type}</div>
                          {r.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.description}</div>}
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <span
                            className={`status-badge ${isResolved ? 'badge-emerald' : 'badge-amber'}`}
                          >
                            {isResolved ? '✓ Resolved' : '⚙ Open / Workshop'}
                          </span>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} />
                            <span>{r.created_at ? new Date(r.created_at).toLocaleString() : 'Active'}</span>
                          </div>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)' }}>
                          {r.resolved_at ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--status-emerald-text)' }}>
                              <CheckCircle2 size={12} />
                              <span>{new Date(r.resolved_at).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Pending</span>
                          )}
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                          {isResolved ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--status-emerald-text)', fontWeight: 700 }}>
                              Resolved
                            </span>
                          ) : (
                            <button
                              onClick={() => handleResolve(r.id)}
                              disabled={resolvingId === r.id}
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                color: 'var(--primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              {resolvingId === r.id ? (
                                <RefreshCw size={12} className="spin-icon" />
                              ) : (
                                <CheckCircle2 size={12} />
                              )}
                              <span>{resolvingId === r.id ? 'Resolving...' : 'Mark Resolved'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </ManagerLayout>
  );
};
