import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiClient } from '../api/client';
import axios from 'axios';
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Package,
  Search,
  ChevronRight,
  ArrowLeft,
  Truck,
} from 'lucide-react';
import { CustomerTrackingModal } from '../components/CustomerTrackingModal';

export interface PublicTrackingData {
  order_code: string;
  status: string;
  stepper_status: string;
  eta?: string | null;
  estimated_arrival?: string | null;
  driver_first_name?: string | null;
  vehicle_position?: { lat: number; lng: number } | null;
  delay_message?: string | null;
}

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
  const [data, setData] = useState<PublicTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTracking = async (isInitial: boolean = false) => {
      if (!trackingId) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      // If user provided order_code instead of UUID (e.g. starts with ORD-)
      if (trackingId.startsWith('ORD-')) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      if (isInitial) {
        setIsLoading(true);
        setIsNotFound(false);
        setFetchError(null);
      }

      try {
        const resp = await apiClient.get<PublicTrackingData>(`/track/${trackingId}`);
        if (isMounted) {
          setData(resp.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            setIsNotFound(true);
          } else if (isInitial) {
            setFetchError('Unable to connect to live tracking server.');
          }
        }
      } finally {
        if (isMounted && isInitial) {
          setIsLoading(false);
        }
      }
    };

    fetchTracking(true);

    // Stop polling when the order is delivered
    if (data?.status === 'delivered') {
      return () => {
        isMounted = false;
      };
    }

    // Poll GET /track/{id} every 5 seconds so marker and status update live
    const pollTimer = setInterval(() => {
      fetchTracking(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [trackingId, data?.status]);

  const steps = [
    { key: 'assigned', label: 'Order Intake' },
    { key: 'picked_up', label: 'Loaded at Hub' },
    { key: 'in_transit', label: 'Driver En Route' },
    { key: 'delivered', label: 'Doorstep Delivered' },
  ];

  const getStepIndex = (stepperStatus?: string, orderStatus?: string) => {
    const s = (stepperStatus || orderStatus || '').toLowerCase();
    if (s === 'delivered') return 3;
    if (s === 'in_transit') return 2;
    if (s === 'picked_up') return 1;
    return 0; // assigned / pending
  };

  const currentIndex = data ? getStepIndex(data.stepper_status, data.status) : 0;
  const isDelayed = data?.status === 'delayed' || Boolean(data?.delay_message);

  // ── 404 State: Friendly "Tracking link not found" ──
  if (isNotFound) {
    return (
      <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#FAF7F2', borderBottom: '1px solid var(--border-light)', padding: '0.9rem 2rem' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                RW
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
                Route<span style={{ color: 'var(--accent-gold)' }}>Wise</span>
              </div>
            </Link>
          </div>
        </header>

        <main style={{ maxWidth: '520px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div
            className="card animate-enter"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '3rem 2rem',
              border: '1px solid var(--border-light)',
              boxShadow: '0 8px 30px rgba(43, 36, 30, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-amber-bg)',
                color: 'var(--status-amber-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <Package size={32} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
              Tracking Link Not Found
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '2rem' }}>
              We could not locate an active delivery corresponding to this tracking link. Please ensure you clicked the full tracking link provided in your delivery SMS or email notification.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(true)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <Search size={16} />
                <span>Search by Order Tracking Link</span>
              </button>

              <Link
                to="/"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.75rem', textDecoration: 'none' }}
              >
                <ArrowLeft size={16} />
                <span>Return to RouteWise Home</span>
              </Link>
            </div>
          </div>
        </main>

        <CustomerTrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
        />
      </div>
    );
  }

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#FAF7F2', borderBottom: '1px solid var(--border-light)', padding: '0.9rem 2rem' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                RW
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
                RouteWise
              </div>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '920px', margin: '3rem auto', padding: '0 1rem', width: '100%', textAlign: 'center' }}>
          <div className="card" style={{ padding: '3rem', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border-light)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Connecting to Live Satellite Telemetry...
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Retrieving verified stop status and driver coordinates
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#FAF7F2', borderBottom: '1px solid var(--border-light)', padding: '0.9rem 2rem' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>RouteWise</Link>
          </div>
        </header>
        <main style={{ maxWidth: '500px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <div className="card" style={{ padding: '2.5rem', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border-light)' }}>
            <AlertTriangle size={36} style={{ color: 'var(--status-amber-text)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{fetchError || 'Unable to load tracking details'}</h2>
            <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Retry Connection
            </button>
          </div>
        </main>
      </div>
    );
  }

  const defaultPosition = data.vehicle_position
    ? [data.vehicle_position.lat, data.vehicle_position.lng] as [number, number]
    : [12.9716, 77.5946] as [number, number];

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
                <span className={`status-badge ${isDelayed ? 'badge-amber' : data.status === 'delivered' ? 'badge-emerald' : 'badge-olive'}`}>
                  {isDelayed ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                  {isDelayed ? 'Traffic Delay Notified' : data.status === 'delivered' ? 'Package Delivered' : 'On Schedule'}
                </span>
              </div>

              {/* Order Code Label */}
              <h1 className="font-mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0' }}>
                {data.order_code}
              </h1>

              <div style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>Assigned Fleet Courier: <strong style={{ color: 'var(--text-main)' }}>{data.driver_first_name || 'Fleet Driver'}</strong></span>
                </p>
              </div>
            </div>

            {/* Estimated Arrival Badge */}
            <div
              style={{
                backgroundColor: isDelayed ? 'var(--status-amber-bg)' : data.status === 'delivered' ? 'var(--status-emerald-bg)' : 'var(--status-olive-bg)',
                border: `1px solid ${isDelayed ? 'var(--status-amber-border)' : data.status === 'delivered' ? 'var(--status-emerald-border)' : 'var(--status-olive-border)'}`,
                borderRadius: '14px',
                padding: '1rem 1.4rem',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isDelayed ? 'var(--status-amber-text)' : data.status === 'delivered' ? 'var(--status-emerald-text)' : 'var(--status-olive-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {data.status === 'delivered' ? 'DELIVERY COMPLETED' : 'ESTIMATED ARRIVAL (ETA)'}
              </span>
              <div className="font-mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: isDelayed ? 'var(--status-amber-text)' : data.status === 'delivered' ? 'var(--status-emerald-text)' : 'var(--text-main)', marginTop: '0.1rem' }}>
                {data.estimated_arrival || (data.eta ? new Date(data.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Live GPS Algorithm Calculation
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
                backgroundColor: isDelayed ? '#8E4C0E' : 'var(--primary)',
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
                        backgroundColor: isPassed ? (isDelayed && isCurrent ? '#8E4C0E' : 'var(--primary)') : '#FFFFFF',
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

          {/* ── Delay Card (Shown only if delay_message is present) ── */}
          {data.delay_message && (
            <div
              className="animate-enter stagger-1"
              style={{
                padding: '1.35rem 1.5rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #FAF4E6, #F8EFE0)',
                border: '1px solid #E4D5BC',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sparkles size={16} style={{ color: '#8E4C0E' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8E4C0E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Smart Delivery Notice (Route Telemetry Delay)
                </span>
              </div>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 500 }}>
                "{data.delay_message}"
              </p>
            </div>
          )}

          {/* ── Driver Info Card ── */}
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
                {data.driver_first_name ? data.driver_first_name.charAt(0) : 'D'}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Assigned Courier
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {data.driver_first_name ? `${data.driver_first_name} (Verified Route Driver)` : 'RouteWise Fleet Driver'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Status: <strong>{data.status === 'delivered' ? 'Package Delivered' : 'On Active Delivery Tour'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Truck size={18} />
              <span>Dedicated Fleet Vehicle</span>
            </div>
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
                Satellite vehicle location for {data.order_code}
              </p>
            </div>
            <span className="status-badge badge-olive" style={{ fontSize: '0.75rem' }}>
              <span className="live-pulse-dot" /> Real-Time Satellite Tracking
            </span>
          </div>

          <div style={{ height: '340px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <MapContainer center={defaultPosition} zoom={13} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {data.vehicle_position && (
                <Marker position={[data.vehicle_position.lat, data.vehicle_position.lng]} icon={createCustomerCarMarker(isDelayed)}>
                  <Popup>
                    <div style={{ fontFamily: 'var(--font-sans)', padding: '0.2rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#201A16' }}>{data.driver_first_name || 'Driver'}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#6E6457', marginTop: '0.15rem' }}>
                        Order: <strong>{data.order_code}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6E6457', marginTop: '0.1rem' }}>
                        Status: {data.status}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
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
