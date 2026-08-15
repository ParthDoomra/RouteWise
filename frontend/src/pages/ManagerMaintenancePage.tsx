import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';

interface MaintenanceTicket {
  id: string;
  vehiclePlate: string;
  driverName: string;
  triggerReason: string;
  triggerType: 'mileage_threshold' | 'driver_report' | 'manual';
  createdDate: string;
  currentMileage: string;
  status: 'open' | 'resolved';
}

const dummyTickets: MaintenanceTicket[] = [
  {
    id: 'TICK-401',
    vehiclePlate: 'KA-04-MH-9920',
    driverName: 'Suresh Kumar',
    triggerReason: 'Automated Trigger: Crossed 45,000 km mileage threshold limit (+200km over baseline)',
    triggerType: 'mileage_threshold',
    createdDate: '2026-08-12',
    currentMileage: '45,200 km',
    status: 'open',
  },
  {
    id: 'TICK-402',
    vehiclePlate: 'KA-01-GB-5091',
    driverName: 'Priya Nair',
    triggerReason: 'Driver Report: High brake pedal vibration during stop-and-go city transit',
    triggerType: 'driver_report',
    createdDate: '2026-08-14',
    currentMileage: '28,100 km',
    status: 'open',
  },
  {
    id: 'TICK-398',
    vehiclePlate: 'KA-01-EA-1024',
    driverName: 'Rahul Sharma',
    triggerReason: 'Automated Trigger: 14,000 km Scheduled Oil & Filter Change interval reached',
    triggerType: 'mileage_threshold',
    createdDate: '2026-07-10',
    currentMileage: '14,250 km',
    status: 'resolved',
  },
  {
    id: 'TICK-395',
    vehiclePlate: 'KA-05-MC-8812',
    driverName: 'Amit Patel',
    triggerReason: 'Routine EV Battery Health & Regenerative Braking System Inspection',
    triggerType: 'manual',
    createdDate: '2026-08-01',
    currentMileage: '9,840 km',
    status: 'resolved',
  },
  {
    id: 'TICK-390',
    vehiclePlate: 'KA-03-HA-3301',
    driverName: 'Vikram Singh',
    triggerReason: 'Driver Report: Clutch cable stiffness reported during morning shift',
    triggerType: 'driver_report',
    createdDate: '2026-05-18',
    currentMileage: '31,500 km',
    status: 'resolved',
  },
];

export const ManagerMaintenancePage: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(dummyTickets);

  const handleResolve = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'resolved' as const } : t))
    );
  };

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Maintenance Automation</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Automated mileage threshold triggers & manual vehicle service ticket tracking.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Open Tickets:</span>
              <strong style={{ fontSize: '1.1rem', color: '#dc2626' }}>
                {tickets.filter((t) => t.status === 'open').length}
              </strong>
            </div>
            <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolved (This Month):</span>
              <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>
                {tickets.filter((t) => t.status === 'resolved').length}
              </strong>
            </div>
          </div>
        </div>

        {/* Maintenance Tickets Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>TICKET ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>VEHICLE PLATE</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>TRIGGER REASON / DIAGNOSTIC</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>ODOMETER</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>CREATED DATE</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                      {t.id}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>
                      {t.vehiclePlate}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Driver: {t.driverName}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-main)', maxWidth: '320px' }}>
                      {t.triggerReason}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>
                      {t.currentMileage}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>
                      {t.createdDate}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: t.status === 'open' ? '#fee2e2' : '#d1fae5',
                          color: t.status === 'open' ? '#991b1b' : '#065f46',
                          border: t.status === 'open' ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                        }}
                      >
                        {t.status === 'open' ? '🔴 Open' : '🟢 Resolved'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      {t.status === 'open' ? (
                        <button
                          onClick={() => handleResolve(t.id)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #16a34a',
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ManagerLayout>
  );
};
