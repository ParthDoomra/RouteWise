import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface DriverStop {
  seqNo: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: string;
  weightKg: number;
  eta: string;
  status: 'completed' | 'current' | 'upcoming';
  lat: number;
  lng: number;
}

const driverStops: DriverStop[] = [
  {
    seqNo: 1,
    orderId: 'DEPOT',
    customerName: 'Indiranagar Central Hub',
    customerPhone: '+91 80 2211 4455',
    address: 'Indiranagar Depot, 100ft Rd',
    items: 'Vehicle Loading & Inventory Check',
    weightKg: 0,
    eta: '09:00 AM',
    status: 'completed',
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    seqNo: 2,
    orderId: 'ORD-8940',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    address: 'MG Road, Sector 4, #402',
    items: 'Electronics Package (1x Laptop)',
    weightKg: 4.5,
    eta: '10:15 AM',
    status: 'current',
    lat: 12.9750,
    lng: 77.6010,
  },
  {
    seqNo: 3,
    orderId: 'ORD-8942',
    customerName: 'Siddharth Rao',
    customerPhone: '+91 99001 22334',
    address: 'Ulsoor Lake Road, #15',
    items: 'Office Furniture & Supplies',
    weightKg: 18.0,
    eta: '11:30 AM',
    status: 'upcoming',
    lat: 12.9800,
    lng: 77.6080,
  },
  {
    seqNo: 4,
    orderId: 'ORD-8944',
    customerName: 'Meera Iyer',
    customerPhone: '+91 98123 55678',
    address: 'Koramangala 5th Block, #12',
    items: 'Home Appliance (Air Purifier)',
    weightKg: 12.0,
    eta: '12:45 PM',
    status: 'upcoming',
    lat: 12.9352,
    lng: 77.6245,
  },
];

export const DriverRoutePage: React.FC = () => {
  const [stops, setStops] = useState<DriverStop[]>(driverStops);
  const [expandedSeq, setExpandedSeq] = useState<number>(2);

  const handleAction = (seqNo: number, action: 'picked_up' | 'delivered') => {
    alert(`Stop #${seqNo} marked as ${action.replace('_', ' ').toUpperCase()}!`);
    setStops((prev) =>
      prev.map((s) => (s.seqNo === seqNo ? { ...s, status: 'completed' as const } : s))
    );
    if (seqNo < stops.length) {
      setExpandedSeq(seqNo + 1);
    }
  };

  return (
    <div style={{ backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Driver Header */}
      <header
        style={{
          padding: '0 1.25rem',
          height: '64px',
          backgroundColor: '#16181a',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', fontWeight: 600, letterSpacing: '0.04em' }}>
            Driver Console • KA-01-EA-1024
          </span>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#ffffff' }}>Rahul Sharma's Route</h1>
        </div>

        <Link
          to="/manager/dashboard"
          style={{
            color: 'rgba(255,255,255,0.72)',
            fontSize: '0.8rem',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            fontWeight: 500,
          }}
        >
          Exit Driver Mode
        </Link>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Map Placeholder */}
        <div
          style={{
            height: '140px',
            borderRadius: '20px',
            backgroundColor: '#16181a',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🗺️</span>
          <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>Active Driver GPS Trajectory (Simulated)</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Next Destination: MG Road, Sector 4 (1.2 km away)</span>
        </div>

        {/* Progress Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>Today's Delivery Stops</h2>
          <span style={{
            fontSize: '0.8rem',
            color: '#00a87e',
            fontWeight: 600,
            backgroundColor: 'rgba(0,168,126,0.12)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
          }}>
            {stops.filter((s) => s.status === 'completed').length} / {stops.length} Completed
          </span>
        </div>

        {/* Stop Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {stops.map((stop) => {
            const isCurrent = stop.seqNo === expandedSeq;
            const isCompleted = stop.status === 'completed';

            return (
              <div
                key={stop.seqNo}
                style={{
                  backgroundColor: '#16181a',
                  border: isCurrent ? '2px solid #494fdf' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '20px',
                  padding: '1.25rem',
                  opacity: isCompleted ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedSeq(stop.seqNo)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? '#00a87e' : isCurrent ? '#494fdf' : 'rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                      }}
                    >
                      {stop.seqNo}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
                        {stop.orderId}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        ETA: <strong style={{ color: '#ffffff' }}>{stop.eta}</strong>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px',
                      backgroundColor: isCompleted ? '#00a87e' : isCurrent ? '#494fdf' : 'rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {isCompleted ? '✓ COMPLETED' : isCurrent ? '⚡ IN PROGRESS' : 'UPCOMING'}
                  </span>
                </div>

                {/* Expanded Content */}
                {isCurrent && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Recipient & Address</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginTop: '0.15rem' }}>{stop.customerName}</div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)', marginTop: '0.1rem' }}>{stop.address}</div>
                      <a
                        href={`tel:${stop.customerPhone}`}
                        style={{ display: 'inline-block', color: '#494fdf', fontSize: '0.85rem', marginTop: '0.3rem', textDecoration: 'none', fontWeight: 600 }}
                      >
                        📞 Call Customer ({stop.customerPhone})
                      </a>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Package Manifest</span>
                      <div style={{ fontSize: '0.875rem', color: '#ffffff' }}>{stop.items} ({stop.weightKg} kg)</div>
                    </div>

                    {!isCompleted && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleAction(stop.seqNo, 'picked_up')}
                          style={{
                            padding: '14px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: '#494fdf',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Mark Picked Up
                        </button>
                        <button
                          onClick={() => handleAction(stop.seqNo, 'delivered')}
                          style={{
                            padding: '14px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: '#00a87e',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Mark Delivered
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
