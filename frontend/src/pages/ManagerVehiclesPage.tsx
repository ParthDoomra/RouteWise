import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  BatteryCharging,
  Zap,
  Route,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  X,
} from 'lucide-react';

export type VehicleStatus = 'active' | 'standby' | 'delayed' | 'maintenance';

export interface VehicleAsset {
  id: string;
  plateNo: string;
  model: string;
  type: 'EV Van' | 'Diesel Mini Truck' | 'EV Scooter' | 'Cargo Van';
  driverName: string;
  driverPhone: string;
  status: VehicleStatus;
  currentZone: string;
  capacityKg: number;
  odometerKm: number;
  lastServiceKm: number;
  serviceIntervalKm: number;
  batteryHealthPercent: number;
  currentOrderId?: string;
  currentSpeed?: string;
}

export interface MaintenanceRecord {
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

const dummyVehiclesList: VehicleAsset[] = [
  {
    id: 'VH-101',
    plateNo: 'KA-01-EA-1024',
    model: 'Tata Ace Gold EV',
    type: 'EV Van',
    driverName: 'Rahul Sharma',
    driverPhone: '+91 98450 11223',
    status: 'active',
    currentZone: 'Indiranagar Central Hub',
    capacityKg: 650,
    odometerKm: 14250,
    lastServiceKm: 10000,
    serviceIntervalKm: 5000,
    batteryHealthPercent: 92,
    currentOrderId: 'ORD-8945',
    currentSpeed: '38 km/h',
  },
  {
    id: 'VH-102',
    plateNo: 'KA-01-GB-5091',
    model: 'Mahindra Bolero Maxi Truck',
    type: 'Diesel Mini Truck',
    driverName: 'Priya Nair',
    driverPhone: '+91 99011 44556',
    status: 'delayed',
    currentZone: 'HSR Layout Sector 2',
    capacityKg: 1200,
    odometerKm: 28100,
    lastServiceKm: 25000,
    serviceIntervalKm: 5000,
    batteryHealthPercent: 88,
    currentOrderId: 'ORD-8942',
    currentSpeed: '12 km/h',
  },
  {
    id: 'VH-103',
    plateNo: 'KA-05-MC-8812',
    model: 'Euler Motors HiLoad EV',
    type: 'EV Van',
    driverName: 'Amit Patel',
    driverPhone: '+91 97400 88990',
    status: 'active',
    currentZone: 'Jayanagar Logistics Depot',
    capacityKg: 688,
    odometerKm: 9840,
    lastServiceKm: 5000,
    serviceIntervalKm: 5000,
    batteryHealthPercent: 98,
    currentOrderId: 'ORD-8938',
    currentSpeed: '42 km/h',
  },
  {
    id: 'VH-104',
    plateNo: 'KA-03-HA-3301',
    model: 'Maruti Suzuki Eeco Cargo',
    type: 'Cargo Van',
    driverName: 'Vikram Singh',
    driverPhone: '+91 98800 22331',
    status: 'standby',
    currentZone: 'Malleshwaram Central Store',
    capacityKg: 500,
    odometerKm: 31500,
    lastServiceKm: 30000,
    serviceIntervalKm: 5000,
    batteryHealthPercent: 85,
    currentOrderId: 'Standby / Available',
  },
  {
    id: 'VH-105',
    plateNo: 'KA-04-MH-9920',
    model: 'Eicher Pro 2049 Light Truck',
    type: 'Diesel Mini Truck',
    driverName: 'Suresh Kumar',
    driverPhone: '+91 99887 66554',
    status: 'maintenance',
    currentZone: 'Rajajinagar Service Workshop',
    capacityKg: 2400,
    odometerKm: 45200,
    lastServiceKm: 40000,
    serviceIntervalKm: 5000,
    batteryHealthPercent: 78,
    currentOrderId: 'In Workshop (Bay #2)',
  },
  {
    id: 'VH-106',
    plateNo: 'KA-02-JL-4411',
    model: 'Ather 450X Commercial EV',
    type: 'EV Scooter',
    driverName: 'Deepak Kumar',
    driverPhone: '+91 98112 44556',
    status: 'standby',
    currentZone: 'Yeshwanthpur EV Station',
    capacityKg: 40,
    odometerKm: 4800,
    lastServiceKm: 0,
    serviceIntervalKm: 5000,
    batteryHealthPercent: 99,
    currentOrderId: 'Standby / Quick Dispatch',
  },
];

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
    notes: 'Triggered by 45,000 km threshold. Replacement OEM parts installed.',
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
    notes: 'Battery cell balance 99.4%. Firmware updated to v2.4.',
  },
  {
    id: 'MNT-104',
    vehiclePlate: 'KA-03-HA-3301',
    serviceType: 'Tire Rotation & Suspension Bushing Inspection',
    serviceDate: 'Scheduled: Aug 18, 2026',
    odometerKm: 31500,
    status: 'scheduled',
    costRupees: 2400,
    technician: 'Malleshwaram Hub Service Bay',
    notes: 'Pre-monsoon preventive inspection.',
  },
];

export const ManagerVehiclesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'maintenance'>('fleet');
  const [vehicles, setVehicles] = useState<VehicleAsset[]>(dummyVehiclesList);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(dummyMaintenanceHistory);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

  // New vehicle form
  const [newVehicle, setNewVehicle] = useState({
    plateNo: 'KA-05-AB-7744',
    model: 'Tata Ace EV',
    type: 'EV Van' as const,
    driverName: 'Rohan Gupta',
    driverPhone: '+91 98765 00112',
    currentZone: 'Whitefield Tech Corridor',
    capacityKg: 700,
  });

  // New maintenance form
  const [newService, setNewService] = useState({
    vehiclePlate: 'KA-01-EA-1024',
    serviceType: 'General Health & Brake Inspection',
    technician: 'Indiranagar Hub Bay #1',
    costRupees: 2500,
    notes: 'Regular checkup prior to weekend peak volume',
  });

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const created: VehicleAsset = {
      id: `VH-${100 + vehicles.length + 1}`,
      plateNo: newVehicle.plateNo,
      model: newVehicle.model,
      type: newVehicle.type,
      driverName: newVehicle.driverName,
      driverPhone: newVehicle.driverPhone,
      status: 'standby',
      currentZone: newVehicle.currentZone,
      capacityKg: Number(newVehicle.capacityKg),
      odometerKm: 1200,
      lastServiceKm: 0,
      serviceIntervalKm: 5000,
      batteryHealthPercent: 100,
      currentOrderId: 'Standby / Available',
    };
    setVehicles([created, ...vehicles]);
    setIsAddVehicleOpen(false);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const created: MaintenanceRecord = {
      id: `MNT-${100 + maintenanceRecords.length + 1}`,
      vehiclePlate: newService.vehiclePlate,
      serviceType: newService.serviceType,
      serviceDate: 'Today, Just Now',
      odometerKm: 14500,
      status: 'in_progress',
      costRupees: Number(newService.costRupees),
      technician: newService.technician,
      notes: newService.notes,
    };
    setMaintenanceRecords([created, ...maintenanceRecords]);
    setIsAddServiceOpen(false);
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesQuery =
      v.plateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.currentZone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* ── Page Header & Tabs ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Fleet & Maintenance
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Real-time vehicle telemetry, driver assignments, and preventive service logs.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {activeTab === 'fleet' ? (
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(true)}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                <span>Add Vehicle</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(true)}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                <span>Log Service</span>
              </button>
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
                  placeholder="Search vehicle plate, driver name, model or zone..."
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
                  En Route ({vehicles.filter((v) => v.status === 'active').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('standby')}
                  className={`tab-pill ${statusFilter === 'standby' ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                >
                  Standby ({vehicles.filter((v) => v.status === 'standby').length})
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

            {/* Vehicle Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredVehicles.map((vehicle) => (
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
                          {vehicle.plateNo}
                        </span>
                        {vehicle.type.includes('EV') && (
                          <span className="status-badge badge-olive" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                            <Zap size={10} /> EV
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {vehicle.model}
                      </div>
                    </div>

                    <div>
                      {vehicle.status === 'active' ? (
                        <span className="status-badge badge-olive" style={{ fontSize: '0.72rem' }}>
                          <span className="live-pulse-dot" /> En Route
                        </span>
                      ) : vehicle.status === 'delayed' ? (
                        <span className="status-badge badge-amber" style={{ fontSize: '0.72rem' }}>
                          <AlertTriangle size={11} /> Delayed
                        </span>
                      ) : vehicle.status === 'maintenance' ? (
                        <span className="status-badge badge-rose" style={{ fontSize: '0.72rem' }}>
                          <Wrench size={11} /> In Service
                        </span>
                      ) : (
                        <span className="status-badge badge-slate" style={{ fontSize: '0.72rem' }}>
                          Standby
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Driver & Zone Info */}
                  <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Driver:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{vehicle.driverName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Current Location:</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{vehicle.currentZone}</span>
                    </div>
                  </div>

                  {/* Battery & Service Threshold */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <BatteryCharging size={13} /> Battery / System Health
                      </span>
                      <strong style={{ color: vehicle.batteryHealthPercent > 85 ? 'var(--status-emerald-text)' : 'var(--status-amber-text)' }}>
                        {vehicle.batteryHealthPercent}%
                      </strong>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${vehicle.batteryHealthPercent}%`,
                          height: '100%',
                          backgroundColor: vehicle.batteryHealthPercent > 85 ? '#1E5C32' : '#8E4C0E',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Odo: <strong>{vehicle.odometerKm.toLocaleString()} km</strong>
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
              ))}
            </div>

          </div>
        )}

        {/* ══ TAB 2: MAINTENANCE & SERVICE BAY ══ */}
        {activeTab === 'maintenance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Maintenance Alert Notice */}
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
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--status-amber-text)', margin: 0 }}>
                    1 Vehicle Reached 45,000 km Odometer Threshold
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                    Vehicle <strong>KA-04-MH-9920</strong> is currently undergoing scheduled OEM brake pad overhaul at Bay #2.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddServiceOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Log Service Update
              </button>
            </div>

            {/* Maintenance History Table */}
            <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Service & Repair History
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {maintenanceRecords.length} records logged
                </span>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Record ID</th>
                      <th>Vehicle Plate</th>
                      <th>Service Details</th>
                      <th>Technician / Bay</th>
                      <th>Cost (INR)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRecords.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {item.id}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.serviceDate}
                          </div>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                            {item.vehiclePlate}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.odometerKm.toLocaleString()} km
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            {item.serviceType}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.notes}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {item.technician}
                          </div>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            ₹{item.costRupees.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          {item.status === 'in_progress' ? (
                            <span className="status-badge badge-amber" style={{ fontSize: '0.72rem' }}>
                              <Clock size={11} /> In Progress
                            </span>
                          ) : item.status === 'completed' ? (
                            <span className="status-badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                              <CheckCircle2 size={11} /> Completed
                            </span>
                          ) : (
                            <span className="status-badge badge-slate" style={{ fontSize: '0.72rem' }}>
                              Scheduled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
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
                  Register New Vehicle
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>License Plate Number</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.plateNo}
                    onChange={(e) => setNewVehicle({ ...newVehicle, plateNo: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vehicle Model</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      className="input-clean"
                      style={{ marginTop: '0.3rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payload Capacity (kg)</label>
                    <input
                      type="number"
                      required
                      value={newVehicle.capacityKg}
                      onChange={(e) => setNewVehicle({ ...newVehicle, capacityKg: Number(e.target.value) })}
                      className="input-clean"
                      style={{ marginTop: '0.3rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Driver Name</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.driverName}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Initial Staging Zone</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.currentZone}
                    onChange={(e) => setNewVehicle({ ...newVehicle, currentZone: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddVehicleOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Register Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Add Maintenance Service Modal ── */}
        {isAddServiceOpen && (
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
                  Log Maintenance Service
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select Vehicle</label>
                  <select
                    value={newService.vehiclePlate}
                    onChange={(e) => setNewService({ ...newService, vehiclePlate: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.plateNo}>
                        {v.plateNo} ({v.model} - {v.driverName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Service Task Type</label>
                  <input
                    type="text"
                    required
                    value={newService.serviceType}
                    onChange={(e) => setNewService({ ...newService, serviceType: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Technician / Workshop</label>
                    <input
                      type="text"
                      required
                      value={newService.technician}
                      onChange={(e) => setNewService({ ...newService, technician: e.target.value })}
                      className="input-clean"
                      style={{ marginTop: '0.3rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Cost (INR)</label>
                    <input
                      type="number"
                      required
                      value={newService.costRupees}
                      onChange={(e) => setNewService({ ...newService, costRupees: Number(e.target.value) })}
                      className="input-clean"
                      style={{ marginTop: '0.3rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Diagnostic Notes</label>
                  <input
                    type="text"
                    value={newService.notes}
                    onChange={(e) => setNewService({ ...newService, notes: e.target.value })}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddServiceOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Service
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
