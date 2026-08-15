import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { Link } from 'react-router-dom';

interface Vehicle {
  id: string;
  plateNo: string;
  type: string;
  capacityKg: number;
  status: 'available' | 'on_route' | 'maintenance';
  mileageKm: number;
  lastServiceDate: string;
  driverName: string;
  currentRouteId?: string;
  maintenanceHistory: { date: string; type: string; cost: string }[];
}

const dummyVehicles: Vehicle[] = [
  {
    id: 'V101',
    plateNo: 'KA-01-EA-1024',
    type: 'Medium Van (Tata Ace)',
    capacityKg: 850,
    status: 'on_route',
    mileageKm: 14250,
    lastServiceDate: '2026-07-10',
    driverName: 'Rahul Sharma',
    currentRouteId: 'V101',
    maintenanceHistory: [
      { date: '2026-07-10', type: 'Oil Change & Brake Inspection', cost: '₹3,200' },
      { date: '2026-04-15', type: 'Tire Alignment & Rotation', cost: '₹1,800' },
    ],
  },
  {
    id: 'V102',
    plateNo: 'KA-01-GB-5091',
    type: 'Heavy Cargo Van (Mahindra Bolero Pickup)',
    capacityKg: 1200,
    status: 'on_route',
    mileageKm: 28100,
    lastServiceDate: '2026-06-20',
    driverName: 'Priya Nair',
    currentRouteId: 'V102',
    maintenanceHistory: [
      { date: '2026-06-20', type: '25,000 km Major Service', cost: '₹8,500' },
      { date: '2026-02-11', type: 'Battery Replacement', cost: '₹4,500' },
    ],
  },
  {
    id: 'V103',
    plateNo: 'KA-05-MC-8812',
    type: 'EV Delivery Van (Tata Nexon EV Max)',
    capacityKg: 650,
    status: 'available',
    mileageKm: 9840,
    lastServiceDate: '2026-08-01',
    driverName: 'Amit Patel',
    maintenanceHistory: [
      { date: '2026-08-01', type: 'EV Battery Diagnostic & Coolant Topup', cost: '₹1,200' },
    ],
  },
  {
    id: 'V104',
    plateNo: 'KA-03-HA-3301',
    type: 'Mini Van (Maruti Eeco Cargo)',
    capacityKg: 500,
    status: 'available',
    mileageKm: 31500,
    lastServiceDate: '2026-05-18',
    driverName: 'Vikram Singh',
    maintenanceHistory: [
      { date: '2026-05-18', type: 'Clutch Cable Replacement', cost: '₹2,400' },
      { date: '2026-01-05', type: 'Oil & Filter Change', cost: '₹2,900' },
    ],
  },
  {
    id: 'V105',
    plateNo: 'KA-04-MH-9920',
    type: 'Heavy Truck (Eicher Pro 2049)',
    capacityKg: 2500,
    status: 'maintenance',
    mileageKm: 45200,
    lastServiceDate: '2026-04-02',
    driverName: 'Suresh Kumar',
    maintenanceHistory: [
      { date: '2026-08-12', type: 'Auto-Triggered Mileage Service (45k km)', cost: 'Pending' },
      { date: '2026-04-02', type: 'Suspension Repair', cost: '₹12,000' },
    ],
  },
  {
    id: 'V106',
    plateNo: 'KA-02-JL-4411',
    type: 'EV Delivery Scooter (Ather 450X Cargo)',
    capacityKg: 120,
    status: 'available',
    mileageKm: 4800,
    lastServiceDate: '2026-07-25',
    driverName: 'Deepak Kumar',
    maintenanceHistory: [
      { date: '2026-07-25', type: 'Brake Pad Replacement', cost: '₹950' },
    ],
  },
  {
    id: 'V107',
    plateNo: 'KA-51-AB-9012',
    type: 'Medium Van (Tata Ace EV)',
    capacityKg: 800,
    status: 'on_route',
    mileageKm: 16400,
    lastServiceDate: '2026-06-30',
    driverName: 'Rajesh Sharma',
    currentRouteId: 'V107',
    maintenanceHistory: [
      { date: '2026-06-30', type: 'Standard 15k Inspection', cost: '₹2,100' },
    ],
  },
  {
    id: 'V108',
    plateNo: 'KA-01-CD-7733',
    type: 'Heavy Cargo Van (Ashok Leyland Dost)',
    capacityKg: 1500,
    status: 'available',
    mileageKm: 22900,
    lastServiceDate: '2026-07-15',
    driverName: 'Manoj Gowda',
    maintenanceHistory: [
      { date: '2026-07-15', type: 'Engine Tuning & Air Filter Change', cost: '₹3,500' },
    ],
  },
];

const renderStatusBadge = (status: Vehicle['status']) => {
  const styles = {
    available: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0', label: '🟢 Available' },
    on_route: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: '🚚 On Route' },
    maintenance: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: '🔧 Maintenance' },
  };
  const config = styles[status];
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
      }}
    >
      {config.label}
    </span>
  );
};

export const ManagerVehiclesPage: React.FC = () => {
  const [vehicles] = useState<Vehicle[]>(dummyVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ plateNo: '', type: 'Medium Van', capacityKg: '' });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Vehicle Added!\nPlate: ${formData.plateNo}\nType: ${formData.type}\nCapacity: ${formData.capacityKg} kg`);
    setIsAddModalOpen(false);
    setFormData({ plateNo: '', type: 'Medium Van', capacityKg: '' });
  };

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Fleet Vehicles</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Manage fleet assets, mileage tracking, payload capacity & service records.
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
            }}
          >
            + Add Vehicle
          </button>
        </div>

        {/* Vehicles Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>PLATE NO</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>VEHICLE TYPE</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>CAPACITY (KG)</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>DRIVER</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>CURRENT MILEAGE</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>LAST SERVICE</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{v.plateNo}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-main)' }}>{v.type}</td>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>{v.capacityKg} kg</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>{renderStatusBadge(v.status)}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-main)' }}>{v.driverName}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>{v.mileageKm.toLocaleString()} km</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>{v.lastServiceDate}</td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.8rem' }}>Inspect &rarr;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Vehicle Drawer */}
        {selectedVehicle && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              zIndex: 200,
              display: 'flex',
              justifyContent: 'flex-end',
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
                    Vehicle Profile
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                    {selectedVehicle.plateNo}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div>{renderStatusBadge(selectedVehicle.status)}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ASSIGNED DRIVER</span>
                  <div><strong>{selectedVehicle.driverName}</strong></div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SPECIFICATION & CAPACITY</span>
                  <div>{selectedVehicle.type} • <strong>{selectedVehicle.capacityKg} kg</strong></div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL ODOMETER MILEAGE</span>
                  <div>{selectedVehicle.mileageKm.toLocaleString()} km</div>
                </div>
              </div>

              {/* Active Route Summary Link */}
              <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#0369a1', marginBottom: '0.25rem' }}>Active Route Summary</h4>
                <p style={{ fontSize: '0.8rem', color: '#0c4a6e', marginBottom: '0.75rem' }}>
                  {selectedVehicle.status === 'on_route'
                    ? 'Currently executing multi-stop delivery sequence in Bengaluru East zone.'
                    : 'Vehicle is currently idle or available at main depot.'}
                </p>
                <Link
                  to={`/manager/routes/${selectedVehicle.id}`}
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-blue)', textDecoration: 'none' }}
                >
                  Inspect Full Route Sequence &rarr;
                </Link>
              </div>

              {/* Maintenance History */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.85rem', color: 'var(--text-main)' }}>
                  Maintenance & Service History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedVehicle.maintenanceHistory.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{m.type}</span>
                        <span style={{ color: 'var(--primary-blue)' }}>{m.cost}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>Service Date: {m.date}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Add Vehicle Modal */}
        {isAddModalOpen && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div className="card" style={{ width: '450px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Register New Fleet Vehicle</h3>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>License Plate No</label>
                  <input
                    type="text" required placeholder="e.g. KA-01-XX-9999"
                    value={formData.plateNo} onChange={(e) => setFormData({ ...formData, plateNo: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Vehicle Type / Specification</label>
                  <select
                    value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  >
                    <option value="Medium Van (Tata Ace)">Medium Van (Tata Ace)</option>
                    <option value="Heavy Cargo Van (Bolero)">Heavy Cargo Van (Bolero)</option>
                    <option value="EV Delivery Van (Nexon EV)">EV Delivery Van (Nexon EV)</option>
                    <option value="Heavy Truck (Eicher)">Heavy Truck (Eicher)</option>
                    <option value="EV Scooter">EV Scooter</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Max Payload Capacity (kg)</label>
                  <input
                    type="number" required placeholder="e.g. 1000"
                    value={formData.capacityKg} onChange={(e) => setFormData({ ...formData, capacityKg: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent-blue)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Register Vehicle</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ManagerLayout>
  );
};
