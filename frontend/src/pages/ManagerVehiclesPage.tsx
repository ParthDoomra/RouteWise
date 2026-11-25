import React, { useState, useEffect } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import axios from 'axios';
import {
  Search,
  Plus,
  BatteryCharging,
  Zap,
  Route,
  Wrench,
  AlertTriangle,
  Clock,
  Truck,
  X,
  RefreshCw,
} from 'lucide-react';

export interface BackendVehicle {
  id: number;
  plate_no: string;
  model: string | null;
  capacity_kg: number;
  status: string; // available, on_route, maintenance
  current_lat: number | null;
  current_lng: number | null;
  mileage_km: number;
  last_service_date: string | null;
}

export interface BackendDriver {
  id: number;
  name: string;
  phone: string | null;
  vehicle_id: number | null;
  shift_start: string | null;
  shift_end: string | null;
}

export interface BackendMaintenanceTicket {
  id: number;
  vehicle_id: number;
  trigger_type: string;
  description: string | null;
  status: string;
  created_at: string | null;
  resolved_at: string | null;
}

export const ManagerVehiclesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'maintenance'>('fleet');
  const [vehicles, setVehicles] = useState<BackendVehicle[]>([]);
  const [drivers, setDrivers] = useState<BackendDriver[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<BackendMaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  // New vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    plate_no: '',
    model: '',
    capacity_kg: '650',
    status: 'available',
    mileage_km: '0',
    current_lat: '12.9716',
    current_lng: '77.5946',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [vRes, dRes, mRes] = await Promise.all([
        apiClient.get<BackendVehicle[]>('/vehicles'),
        apiClient.get<BackendDriver[]>('/drivers').catch(() => ({ data: [] as BackendDriver[] })),
        apiClient.get<BackendMaintenanceTicket[]>('/maintenance').catch(() => ({ data: [] as BackendMaintenanceTicket[] })),
      ]);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
      setMaintenanceRecords(mRes.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFetchError(err.response?.data?.detail || err.message || 'Cannot reach server');
      } else {
        setFetchError('Failed to load fleet data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const capacity = parseFloat(newVehicle.capacity_kg);
    if (isNaN(capacity) || capacity <= 0) {
      setSubmitError('Capacity must be a positive number greater than 0');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await apiClient.post('/vehicles', {
        plate_no: newVehicle.plate_no.trim(),
        model: newVehicle.model.trim() || undefined,
        capacity_kg: capacity,
        status: newVehicle.status || 'available',
        mileage_km: parseFloat(newVehicle.mileage_km || '0') || 0,
        current_lat: newVehicle.current_lat ? parseFloat(newVehicle.current_lat) : 12.9716,
        current_lng: newVehicle.current_lng ? parseFloat(newVehicle.current_lng) : 77.5946,
      });

      await fetchData();
      setIsAddVehicleOpen(false);
      setNewVehicle({
        plate_no: '',
        model: '',
        capacity_kg: '650',
        status: 'available',
        mileage_km: '0',
        current_lat: '12.9716',
        current_lng: '77.5946',
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setSubmitError('Cannot reach server');
        } else if (err.response.status === 422) {
          const detail = err.response.data?.detail;
          if (Array.isArray(detail)) {
            const formatted = detail
              .map((d: { loc?: string[]; msg?: string }) => {
                const field = d.loc ? d.loc.slice(1).join('.') : 'Field';
                return `${field}: ${d.msg}`;
              })
              .join(' | ');
            setSubmitError(`Validation Error: ${formatted}`);
          } else {
            setSubmitError(typeof detail === 'string' ? detail : 'Invalid vehicle input data.');
          }
        } else {
          setSubmitError(err.response.data?.detail || 'Failed to register vehicle on server.');
        }
      } else {
        setSubmitError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDriverForVehicle = (vehicleId: number): string => {
    const driver = drivers.find((d) => d.vehicle_id === vehicleId);
    return driver ? driver.name : 'Unassigned';
  };

  const filteredVehicles = vehicles.filter((v) => {
    const driverName = getDriverForVehicle(v.id);
    const matchesQuery =
      v.plate_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && v.status === 'on_route') ||
      (statusFilter === 'standby' && (v.status === 'available' || v.status === 'standby')) ||
      (statusFilter === 'maintenance' && v.status === 'maintenance') ||
      v.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* ── Page Header & Tabs ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Fleet & Vehicles
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Real-time vehicle telemetry, driver assignments, and preventive service logs.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fetchData}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              title="Refresh vehicle roster"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>

            {activeTab === 'fleet' ? (
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setIsAddVehicleOpen(true);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                <span>Add Vehicle</span>
              </button>
            ) : (
              <Link
                to="/manager/maintenance"
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', textDecoration: 'none' }}
              >
                <Wrench size={15} />
                <span>Open Maintenance Hub</span>
              </Link>
            )}

            <Link
              to="/manager/map"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Route size={15} style={{ color: 'var(--primary)' }} />
              <span>Live Map</span>
            </Link>
          </div>
        </div>

        {/* ── Sub-Tab Switcher ── */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`tab-pill ${activeTab === 'fleet' ? 'active' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.15rem' }}
          >
            <Truck size={16} />
            <span>Active Fleet Roster ({vehicles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`tab-pill ${activeTab === 'maintenance' ? 'active' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.15rem' }}
          >
            <Wrench size={16} />
            <span>Maintenance & Service Bay ({maintenanceRecords.length})</span>
          </button>
        </div>

        {/* ══ ERROR BANNER ══ */}
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

        {/* ══ TAB 1: ACTIVE FLEET ROSTER ══ */}
        {activeTab === 'fleet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Filter & Search Bar */}
            <div
              className="card"
              style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search vehicle plate, driver name, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-clean"
                  style={{ paddingLeft: '2.3rem', fontSize: '0.825rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`tab-pill ${statusFilter === 'all' ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                >
                  All ({vehicles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`tab-pill ${statusFilter === 'active' ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                >
                  On Route ({vehicles.filter((v) => v.status === 'on_route').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('standby')}
                  className={`tab-pill ${statusFilter === 'standby' ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                >
                  Available / Standby ({vehicles.filter((v) => v.status === 'available' || v.status === 'standby').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('maintenance')}
                  className={`tab-pill ${statusFilter === 'maintenance' ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                >
                  In Bay ({vehicles.filter((v) => v.status === 'maintenance').length})
                </button>
              </div>
            </div>

            {/* Loading State */}
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
                  Connecting to fleet telemetry database...
                </span>
              </div>
            ) : filteredVehicles.length === 0 ? (
              /* Empty State */
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
                <Truck size={36} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  No Vehicles Found
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                  {searchQuery || statusFilter !== 'all'
                    ? 'No registered vehicles matched your filter parameters.'
                    : 'Your fleet currently has no vehicles registered in the database.'}
                </p>
                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.825rem', marginTop: '0.5rem' }}
                >
                  <Plus size={15} />
                  <span>Register First Vehicle</span>
                </button>
              </div>
            ) : (
              /* Vehicle Grid Cards */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {filteredVehicles.map((vehicle) => {
                  const driverName = getDriverForVehicle(vehicle.id);
                  const isEV = (vehicle.model || '').toLowerCase().includes('ev');

                  return (
                    <div
                      key={vehicle.id}
                      className="card card-hover-lift animate-enter"
                      style={{
                        backgroundColor: '#FFFFFF',
                        padding: '1.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        borderRadius: '16px',
                      }}
                    >
                      {/* Top Bar: Plate, Type, Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {vehicle.plate_no}
                            </span>
                            {isEV && (
                              <span className="status-badge badge-olive" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                                <Zap size={10} /> EV
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {vehicle.model || 'Commercial Fleet Vehicle'}
                          </div>
                        </div>

                        <div>
                          {vehicle.status === 'on_route' ? (
                            <span className="status-badge badge-olive" style={{ fontSize: '0.72rem' }}>
                              <span className="live-pulse-dot" /> On Route
                            </span>
                          ) : vehicle.status === 'maintenance' ? (
                            <span className="status-badge badge-rose" style={{ fontSize: '0.72rem' }}>
                              <Wrench size={11} /> In Service
                            </span>
                          ) : (
                            <span className="status-badge badge-slate" style={{ fontSize: '0.72rem' }}>
                              Available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Driver & Capacity Info */}
                      <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Assigned Driver:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{driverName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Payload Capacity:</span>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{vehicle.capacity_kg} kg</span>
                        </div>
                      </div>

                      {/* Coordinates & Odometer */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <BatteryCharging size={13} /> Current Position
                          </span>
                          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {vehicle.current_lat && vehicle.current_lng
                              ? `${Number(vehicle.current_lat).toFixed(4)}, ${Number(vehicle.current_lng).toFixed(4)}`
                              : 'Depot Coordinates'}
                          </span>
                        </div>
                      </div>

                      {/* Card Bottom CTA */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Odo: <strong>{Number(vehicle.mileage_km || 0).toLocaleString()} km</strong>
                        </div>

                        <Link
                          to={`/manager/routes/${vehicle.id}`}
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <span>Inspect Route &rarr;</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ══ TAB 2: MAINTENANCE & SERVICE BAY ══ */}
        {activeTab === 'maintenance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div
              className="card"
              style={{
                backgroundColor: 'var(--status-amber-bg)',
                border: '1px solid var(--status-amber-border)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-amber-text)' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--status-amber-text)' }}>
                    {maintenanceRecords.filter(m => m.status !== 'resolved').length} Active Tickets in Maintenance Bay
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                    Automated service interval alerts generated by vehicle telemetry.
                  </p>
                </div>
              </div>

              <Link
                to="/manager/maintenance"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem', textDecoration: 'none' }}
              >
                <span>View Full Maintenance Hub &rarr;</span>
              </Link>
            </div>

            {/* Maintenance Tickets Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '0.9rem 1.25rem' }}>TICKET ID</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>VEHICLE ID / PLATE</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>TRIGGER REASON</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>STATUS</th>
                      <th style={{ padding: '0.9rem 1.25rem' }}>LOGGED DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRecords.map((r) => {
                      const v = vehicles.find((veh) => veh.id === r.vehicle_id);
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '0.9rem 1.25rem' }}>
                            <span className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                              MNT-#{r.id}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem' }}>
                            <strong className="font-mono" style={{ color: 'var(--text-main)' }}>
                              {v ? v.plate_no : `Vehicle #${r.vehicle_id}`}
                            </strong>
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.trigger_type}</div>
                            {r.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.description}</div>}
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem' }}>
                            <span className={`status-badge ${r.status === 'resolved' ? 'badge-emerald' : 'badge-amber'}`}>
                              {r.status === 'resolved' ? '✓ Resolved' : '⚙ Open'}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={12} />
                              <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Active'}</span>
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
        )}

        {/* ── Add Vehicle Modal ── */}
        {isAddVehicleOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(28, 23, 19, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              className="card modal-pop-in"
              style={{
                width: '100%',
                maxWidth: '480px',
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '2rem',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Add Vehicle to Fleet
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {submitError && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--status-rose-text)',
                    backgroundColor: 'var(--status-rose-bg, #FFF1F2)',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #FECDD3',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    License Plate Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-05-AB-7744"
                    value={newVehicle.plate_no}
                    onChange={(e) => setNewVehicle({ ...newVehicle, plate_no: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Vehicle Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tata Ace EV"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      className="input-clean"
                      style={{ marginTop: '0.3rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Payload Capacity (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      required
                      placeholder="e.g. 650"
                      value={newVehicle.capacity_kg}
                      onChange={(e) => setNewVehicle({ ...newVehicle, capacity_kg: e.target.value })}
                      className="input-clean"
                      style={{ marginTop: '0.3rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Initial Status
                    </label>
                    <select
                      value={newVehicle.status}
                      onChange={(e) => setNewVehicle({ ...newVehicle, status: e.target.value })}
                      className="input-clean"
                      style={{ marginTop: '0.3rem' }}
                    >
                      <option value="available">Available</option>
                      <option value="on_route">On Route</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Odometer (km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newVehicle.mileage_km}
                      onChange={(e) => setNewVehicle({ ...newVehicle, mileage_km: e.target.value })}
                      className="input-clean"
                      style={{ marginTop: '0.3rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddVehicleOpen(false)}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering...' : 'Register Vehicle'}
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
