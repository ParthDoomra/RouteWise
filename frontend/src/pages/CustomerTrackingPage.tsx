import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getOrderByTrackingId } from '../data/mockOrders';
import {
  Sparkles,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Clock,
  Package,
  Search,
} from 'lucide-react';
import { CustomerTrackingModal } from '../components/CustomerTrackingModal';

const createCustomerCarMarker = (isDelayed: boolean) => {
  const color = isDelayed ? '#8E4C0E' : '#4A5D3A';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44">
      <defs>
        <filter id="c-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(43,36,30,0.3)"/>
        </filter>
      </defs>
      <circle cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.6">
        <animate attributeName="r" values="16;24;28" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0.3;0" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="22" cy="22" r="18" fill="${color}" stroke="#FAF7F2" stroke-width="2.5" filter="url(#c-shadow)"/>
      <path d="M14 26 L16 20 L28 20 L30 26 Z" fill="#FAF7F2"/>
      <circle cx="17" cy="26" r="2.5" fill="#201A16"/>
      <circle cx="27" cy="26" r="2.5" fill="#201A16"/>
    </svg>
  `;
  return L.divIcon({
    className: 'customer-car-marker',
    html: svg,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

export const CustomerTrackingPage: React.FC = () => {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  
  // Look up the exact order from centralized unified store
  const data = getOrderByTrackingId(trackingId || 'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10');

  const [gpsProgress, setGpsProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGpsProgress((prev) => (prev >= 1 ? 0 : prev + 0.03));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const getInterpolatedPoint = (path: [number, number][], p: number): [number, number] => {
    if (!path || path.length < 2) return path ? path[0] : [12.9716, 77.5946];
    const totalSegments = path.length - 1;
    const scaledP = p * totalSegments;
    const index = Math.min(Math.floor(scaledP), totalSegments - 1);
    const fraction = scaledP - index;

    const start = path[index];
    const end = path[index + 1];

    const lat = start[0] + (end[0] - start[0]) * fraction;
    const lng = start[1] + (end[1] - start[1]) * fraction;
    return [lat, lng];
  };

  const currentCarPos: [number, number] = data.routePolyline && data.routePolyline.length > 0
    ? getInterpolatedPoint(data.routePolyline, gpsProgress)
    : [data.vehicleLat, data.vehicleLng];

  const steps = [
    { key: 'assigned', label: 'Order Intake' },
    { key: 'picked_up', label: 'Loaded at Hub' },
    { key: 'in_transit', label: 'Driver En Route' },
    { key: 'delivered', label: 'Doorstep Delivered' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'assigned' || status === 'pending') return 0;
    if (status === 'picked_up') return 1;
    if (status === 'in_transit' || status === 'delayed') return 2;
    if (status === 'delivered') return 3;
    return 0;
  };

  const currentIndex = getStepIndex(data.status);

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Customer Top Nav Bar (Light Warm Theme) ── */}
      <header style={{ backgroundColor: '#FAF7F2', borderBottom: '1px solid var(--border-light)', padding: '0.9rem 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#FAF7F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              RW
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
              Route<span style={{ color: 'var(--accent-gold)' }}>Wise</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '0.35rem' }}>
              • Live Delivery Tracking
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(true)}
              style={{
                fontSize: '0.825rem',
                color: 'var(--text-main)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-medium)',
                padding: '0.4rem 0.95rem',
                borderRadius: '9999px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all var(--duration-fast) ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
            >
              <Search size={13} style={{ color: 'var(--primary)' }} />
              <span>Track Another Order</span>
            </button>

            <Link
              to="/login"
              style={{
                fontSize: '0.825rem',
                color: '#FAF7F2',
                backgroundColor: '#201A16',
                padding: '0.4rem 0.95rem',
                borderRadius: '9999px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>Dispatcher Login</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Tracking Container ── */}
      <main style={{ maxWidth: '920px', margin: '2rem auto', padding: '0 1rem 4rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        
        {/* ── Order Status Hero Card ── */}
        <div
          className="card animate-enter"
          style={{
            padding: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 4px 16px rgba(43, 36, 30, 0.05)',
          }}
        >
          {/* Order Header Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PACKAGE TRACKING
                </span>
                <span className={`status-badge ${data.isDelayed ? 'badge-amber' : data.status === 'delivered' ? 'badge-emerald' : 'badge-olive'}`}>
                  {data.isDelayed ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                  {data.isDelayed ? 'Traffic Delay Notified' : data.status === 'delivered' ? 'Package Delivered' : 'On Schedule'}
                </span>
              </div>

              <h1 className="font-mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0' }}>
                {data.id}
              </h1>

              <div style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>Deliver to: <strong style={{ color: 'var(--text-main)' }}>{data.customerName}</strong></span>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1.45rem' }}>
                  {data.dropAddress} ({data.zone})
                </p>
              </div>
            </div>

            {/* Revised ETA Badge */}
            <div
              style={{
                backgroundColor: data.isDelayed ? 'var(--status-amber-bg)' : data.status === 'delivered' ? 'var(--status-emerald-bg)' : 'var(--status-olive-bg)',
                border: `1px solid ${data.isDelayed ? 'var(--status-amber-border)' : data.status === 'delivered' ? 'var(--status-emerald-border)' : 'var(--status-olive-border)'}`,
                borderRadius: '14px',
                padding: '1rem 1.4rem',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: data.isDelayed ? 'var(--status-amber-text)' : data.status === 'delivered' ? 'var(--status-emerald-text)' : 'var(--status-olive-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {data.status === 'delivered' ? 'DELIVERY STATUS' : 'ESTIMATED ARRIVAL (ETA)'}
              </span>
              <div className="font-mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: data.isDelayed ? 'var(--status-amber-text)' : data.status === 'delivered' ? 'var(--status-emerald-text)' : 'var(--text-main)', marginTop: '0.1rem' }}>
                {data.estimatedArrival}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Window: {data.timeWindow}
              </div>
            </div>
          </div>

          {/* ── Status Stepper ── */}
          <div style={{ position: 'relative', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            <div style={{ position: 'absolute', top: '18px', left: '20px', right: '20px', height: '4px', backgroundColor: 'var(--border-light)', zIndex: 1 }} />
            
            <div
              style={{
                position: 'absolute',
                top: '18px',
                left: '20px',
                width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 40px)`,
                height: '4px',
                backgroundColor: data.isDelayed ? '#8E4C0E' : 'var(--primary)',
                zIndex: 2,
                transition: 'width 0.6s var(--ease-out)',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 3 }}>
              {steps.map((step, idx) => {
                const isPassed = idx <= currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? (data.isDelayed && isCurrent ? '#8E4C0E' : 'var(--primary)') : '#FFFFFF',
                        border: isPassed ? 'none' : '3px solid var(--border-medium)',
                        color: '#FAF7F2',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        boxShadow: isCurrent ? '0 0 0 6px rgba(74, 93, 58, 0.18)' : 'none',
                        transition: 'transform var(--duration-fast) var(--ease-spring)',
                      }}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>

                    <span style={{ fontSize: '0.78rem', fontWeight: isPassed ? 700 : 500, color: isPassed ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.25 }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── AI-Generated Smart Delay / Status Explanation Card ── */}
          {data.aiDelayMessage && (
            <div
              className="animate-enter stagger-1"
              style={{
                padding: '1.35rem 1.5rem',
                borderRadius: '14px',
                background: data.isDelayed ? 'linear-gradient(135deg, #FAF4E6, #F8EFE0)' : 'linear-gradient(135deg, #F0F5EC, #FAF7F2)',
                border: data.isDelayed ? '1px solid #E4D5BC' : '1px solid var(--primary-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sparkles size={16} style={{ color: data.isDelayed ? '#8E4C0E' : 'var(--primary)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: data.isDelayed ? '#8E4C0E' : 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Smart Delivery Notice (Claude AI Telemetry Translation)
                </span>
              </div>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 500 }}>
                "{data.aiDelayMessage}"
              </p>
            </div>
          )}

          {/* ── Driver Contact Card ── */}
          <div
            style={{
              padding: '1.15rem 1.35rem',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FAF7F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                {data.driverName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Assigned Courier
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {data.driverName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Vehicle: <strong>{data.assignedVehicle}</strong>
                </div>
              </div>
            </div>

            <a
              href={`tel:${data.driverPhone}`}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
            >
              <Phone size={14} />
              <span>Call Courier ({data.driverPhone})</span>
            </a>
          </div>
        </div>

        {/* ── Live Map Card ── */}
        <div className="card animate-enter stagger-2" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Live Courier GPS Telemetry
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Satellite vehicle location for {data.id} in {data.zone}
              </p>
            </div>
            <span className="status-badge badge-olive" style={{ fontSize: '0.75rem' }}>
              <span className="live-pulse-dot" /> Real-Time Satellite Tracking
            </span>
          </div>

          <div style={{ height: '340px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <MapContainer center={[data.vehicleLat, data.vehicleLng]} zoom={13} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {data.routePolyline && data.routePolyline.length > 0 && (
                <Polyline
                  positions={data.routePolyline}
                  pathOptions={{
                    color: data.isDelayed ? '#8E4C0E' : '#4A5D3A',
                    weight: 5,
                    opacity: 0.85,
                    dashArray: '8, 8',
                    className: 'anim-route-polyline',
                  }}
                />
              )}

              <Marker position={currentCarPos} icon={createCustomerCarMarker(data.isDelayed)}>
                <Popup>
                  <div style={{ fontFamily: 'var(--font-sans)', padding: '0.2rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#201A16' }}>{data.driverName} ({data.vehiclePlate})</strong>
                    <div style={{ fontSize: '0.75rem', color: '#6E6457', marginTop: '0.15rem' }}>
                      Order: <strong>{data.id}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6E6457', marginTop: '0.1rem' }}>
                      En route to: {data.dropAddress}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        {/* ── Order Lifecycle Audit History ── */}
        <div className="card animate-enter stagger-3" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Delivery Audit Trail & Manifest History
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border-medium)', paddingLeft: '1.25rem', marginLeft: '0.5rem', marginTop: '0.5rem' }}>
            {data.history.map((h, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: i === data.history.length - 1 ? (data.isDelayed ? '#8E4C0E' : 'var(--primary)') : 'var(--border-medium)',
                    position: 'absolute',
                    left: '-1.55rem',
                    top: '0.2rem',
                    border: '2px solid #FFFFFF',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                    {h.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={11} /> {h.timestamp}
                  </span>
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {h.note}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Customer Tracking Modal */}
      <CustomerTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />
    </div>
  );
};
