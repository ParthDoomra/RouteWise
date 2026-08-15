import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface OrderTrackingData {
  orderId: string;
  trackingUuid: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed';
  recipientName: string;
  dropAddress: string;
  estimatedArrival: string;
  isDelayed: boolean;
  aiDelayMessage?: string;
  driverName: string;
  vehiclePlate: string;
  vehicleLat: number;
  vehicleLng: number;
}

const dummyTrackingDb: Record<string, OrderTrackingData> = {
  'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10': {
    orderId: 'ORD-8942',
    trackingUuid: 'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10',
    status: 'delayed',
    recipientName: 'Siddharth Rao',
    dropAddress: 'HSR Layout Sector 2, #104, Bengaluru',
    estimatedArrival: '14:55 PM (Revised)',
    isDelayed: true,
    aiDelayMessage:
      'Hello Siddharth, your delivery ORD-8942 is experiencing a temporary ~25 minute delay due to heavy congestion along the HSR Outer Ring Road junction. Driver Priya Nair is en route and navigating the shortest alternate bypass path to reach you safely.',
    driverName: 'Priya Nair',
    vehiclePlate: 'KA-01-GB-5091',
    vehicleLat: 12.9352,
    vehicleLng: 77.6245,
  },
  'e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e': {
    orderId: 'ORD-8945',
    trackingUuid: 'e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e',
    status: 'in_transit',
    recipientName: 'Aarav Sharma',
    dropAddress: 'MG Road, Sector 4, #402, Bengaluru',
    estimatedArrival: '14:20 PM (On Time)',
    isDelayed: false,
    driverName: 'Rahul Sharma',
    vehiclePlate: 'KA-01-EA-1024',
    vehicleLat: 12.9716,
    vehicleLng: 77.5946,
  },
};

export const CustomerTrackingPage: React.FC = () => {
  const { trackingId } = useParams<{ trackingId: string }>();
  const activeKey = trackingId && dummyTrackingDb[trackingId] ? trackingId : 'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10';
  const data = dummyTrackingDb[activeKey];

  const steps = [
    { key: 'assigned', label: 'Order Assigned' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'assigned') return 0;
    if (status === 'picked_up') return 1;
    if (status === 'in_transit' || status === 'delayed') return 2;
    if (status === 'delivered') return 3;
    return 0;
  };

  const currentIndex = getStepIndex(data.status);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: 'sans-serif' }}>
      
      {/* Customer Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', textDecoration: 'none' }}>
            Route<span style={{ color: '#2563eb' }}>Wise</span> <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>• Live Order Tracking</span>
          </Link>
          <Link to="/login" style={{ color: '#2563eb', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
            Manager Login &rarr;
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Order Main Card */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ORDER REFERENCE</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.1rem 0' }}>Order {data.orderId}</h1>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}>Deliver to: <strong>{data.recipientName}</strong> ({data.dropAddress})</p>
          </div>

          {/* Status Stepper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '1rem', marginBottom: '1rem' }}>
            {/* Background Line */}
            <div style={{ position: 'absolute', top: '16px', left: 0, right: 0, height: '4px', backgroundColor: '#e2e8f0', zIndex: 1 }} />
            
            {/* Progress Active Line */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: 0,
                width: `${(currentIndex / (steps.length - 1)) * 100}%`,
                height: '4px',
                backgroundColor: data.isDelayed ? '#f59e0b' : '#2563eb',
                zIndex: 2,
                transition: 'width 0.3s ease',
              }}
            />

            {steps.map((step, idx) => {
              const isPassed = idx <= currentIndex;
              return (
                <div key={step.key} style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isPassed ? (data.isDelayed && idx === currentIndex ? '#f59e0b' : '#2563eb') : '#ffffff',
                      border: isPassed ? 'none' : '3px solid #cbd5e1',
                      color: '#ffffff',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                    }}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: isPassed ? 700 : 500, color: isPassed ? '#0f172a' : '#64748b' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Arrival Time Banner */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '8px',
              backgroundColor: data.isDelayed ? '#fffbeb' : '#f0f9ff',
              border: data.isDelayed ? '1px solid #fde68a' : '1px solid #bae6fd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: data.isDelayed ? '#92400e' : '#0369a1', fontWeight: 600 }}>
                ESTIMATED ARRIVAL TIME
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: data.isDelayed ? '#b45309' : '#0284c7' }}>
                {data.estimatedArrival}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
              <div>Assigned Courier: <strong>{data.driverName}</strong></div>
              <div>Vehicle: {data.vehiclePlate}</div>
            </div>
          </div>

          {/* AI-Generated Delay Explanation Box */}
          {data.isDelayed && data.aiDelayMessage && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '8px',
                backgroundColor: '#f3e8ff',
                border: '1px solid #d8b4fe',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                  ✨ Smart Delivery Notice (AI Generated)
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#581c87', lineHeight: '1.5', fontStyle: 'italic' }}>
                "{data.aiDelayMessage}"
              </p>
            </div>
          )}
        </div>

        {/* Small Live Map Representation */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Live Driver Location</h3>
          <div style={{ height: '220px', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer center={[data.vehicleLat, data.vehicleLng]} zoom={13} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[data.vehicleLat, data.vehicleLng]}>
                <Popup>
                  <strong>{data.driverName} ({data.vehiclePlate})</strong><br />
                  En route with Order {data.orderId}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

      </main>
    </div>
  );
};
