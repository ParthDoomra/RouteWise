import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MapPin,
  Sparkles,
  X,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import {
  getStoredDriver,
  clearStoredDriver,
  DRIVER_ROUTE_MANIFESTS,
  type DriverProfile,
  type DriverStop,
} from '../data/mockDrivers';
import { DriverLoginModal } from '../components/DriverLoginModal';

const initialDriverStops: DriverStop[] = [
  {
    seqNo: 1,
    orderId: 'DEPOT',
    customerName: 'Indiranagar Central Hub',
    customerPhone: '+91 80 2211 4455',
    address: 'Indiranagar Depot, 100ft Rd',
    items: 'Vehicle Loading & Inventory Manifest Check',
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
    items: 'Electronics Package (1x Dell XPS Laptop)',
    weightKg: 4.5,
    eta: '10:15 AM (On Schedule)',
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
    items: 'Ergonomic Office Chair & Workstation Gear',
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
    items: 'Home Appliance (HEPA Air Purifier)',
    weightKg: 12.0,
    eta: '12:45 PM',
    status: 'upcoming',
    lat: 12.9352,
    lng: 77.6245,
  },
];

export const DriverRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverProfile | null>(() => getStoredDriver());
  const [loginModalOpen, setLoginModalOpen] = useState(() => !getStoredDriver());

  const [stops, setStops] = useState<DriverStop[]>(() => {
    const active = getStoredDriver();
    return (active && DRIVER_ROUTE_MANIFESTS[active.id]) || initialDriverStops;
  });

  const [expandedSeq, setExpandedSeq] = useState<number>(2);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('Heavy traffic junction at Outer Ring Road');
  const [delayDuration, setDelayDuration] = useState('20 mins');
  const [aiNoticeSent, setAiNoticeSent] = useState<string | null>(null);
  const [celebrateId, setCelebrateId] = useState<number | null>(null);

  useEffect(() => {
    if (driver && DRIVER_ROUTE_MANIFESTS[driver.id]) {
      setStops(DRIVER_ROUTE_MANIFESTS[driver.id]);
    }
  }, [driver]);

  const handleAction = (seqNo: number, _action: 'picked_up' | 'delivered') => {
    setCelebrateId(seqNo);
    setStops((prev) =>
      prev.map((s) => (s.seqNo === seqNo ? { ...s, status: 'completed' as const } : s))
    );
    if (seqNo < stops.length) {
      setExpandedSeq(seqNo + 1);
    }
    setTimeout(() => setCelebrateId(null), 1200);
  };

  const handleSendDelayReport = (e: React.FormEvent) => {
    e.preventDefault();
    setDelayModalOpen(false);
    setAiNoticeSent(`AI Customer Notice dispatched to Siddharth Rao for ORD-8942: Revised ETA +${delayDuration}`);
    setTimeout(() => setAiNoticeSent(null), 5000);
  };

  const completedCount = stops.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / stops.length) * 100);

  // If no driver session exists, require driver authentication
  if (!driver) {
    return (
      <div
        style={{
          backgroundColor: '#F5F1EA',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div
          className="card modal-pop-in"
          style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'var(--primary-tint)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 12px rgba(63, 82, 46, 0.15)',
            }}
          >
            <Truck size={28} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            Driver Console Authentication
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Please authenticate with your fleet driver profile to access your designated route manifest.
          </p>

          <button
            type="button"
            onClick={() => setLoginModalOpen(true)}
            className="btn btn-primary"
            style={{
              marginTop: '1.5rem',
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              fontSize: '0.925rem',
              width: '100%',
            }}
          >
            <span>Open Driver Login</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              marginTop: '0.75rem',
              background: 'none',
              border: 'none',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Back to Dispatcher Portal
          </button>
        </div>

        <DriverLoginModal
          isOpen={loginModalOpen}
          onClose={() => navigate('/login')}
          onSuccess={(d) => {
            setDriver(d);
            setStops(DRIVER_ROUTE_MANIFESTS[d.id] || initialDriverStops);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '100vh' }}>
      
      {/* ── Driver App Navigation Header (Light Warm Theme) ── */}
      <header
        style={{
          padding: '0 1.5rem',
          height: '66px',
          backgroundColor: '#FAF7F2',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
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
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)', lineHeight: 1.1 }}>
              Driver Route Console
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {driver.name} • {driver.vehiclePlate} ({driver.vehicleModel})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setLoginModalOpen(true)}
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-medium)',
              padding: '0.38rem 0.85rem',
              borderRadius: '9999px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--duration-fast) ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
          >
            Switch Driver
          </button>

          <button
            type="button"
            onClick={() => {
              clearStoredDriver();
              setDriver(null);
              navigate('/login');
            }}
            style={{
              fontSize: '0.78rem',
              color: '#FAF7F2',
              backgroundColor: '#201A16',
              padding: '0.4rem 0.95rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'transform var(--duration-fast) var(--ease-spring)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Exit Driver Mode
          </button>
        </div>
      </header>

      {/* ── Mobile Container ── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Route Progress Bar Card */}
        <div
          className="card animate-enter"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Today's Delivery Progress
            </span>
            <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
              {completedCount} of {stops.length} Stops Completed ({progressPercent}%)
            </span>
          </div>

          <div style={{ height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: 'var(--primary)',
                borderRadius: '9999px',
                transition: 'width 0.5s var(--ease-out)',
              }}
            />
          </div>
        </div>

        {/* AI Notice Toast */}
        {aiNoticeSent && (
          <div
            className="animate-enter"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-tint)',
              border: '1px solid var(--primary-border)',
              color: 'var(--primary)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
            }}
          >
            <Sparkles size={16} />
            <span>{aiNoticeSent}</span>
          </div>
        )}

        {/* ── Active Next Stop Card ── */}
        {stops.find((s) => s.seqNo === expandedSeq) && (
          <div
            className={`card animate-enter stagger-1 ${celebrateId === expandedSeq ? 'celebrate-pop' : ''}`}
            style={{
              backgroundColor: '#FAF7F2',
              border: '2px solid var(--primary)',
              borderRadius: '18px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 8px 24px rgba(74, 93, 58, 0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="status-badge badge-olive" style={{ fontSize: '0.75rem' }}>
                <span className="live-pulse-dot" /> ACTIVE TARGET STOP #{expandedSeq}
              </span>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                ETA: {stops.find((s) => s.seqNo === expandedSeq)?.eta}
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {stops.find((s) => s.seqNo === expandedSeq)?.customerName}
              </h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.15rem' }} />
                <span>{stops.find((s) => s.seqNo === expandedSeq)?.address}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <a
                href={`tel:${stops.find((s) => s.seqNo === expandedSeq)?.customerPhone}`}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.825rem', padding: '0.55rem' }}
              >
                <Phone size={14} />
                <span>Call Customer</span>
              </a>

              <button
                onClick={() => setDelayModalOpen(true)}
                className="btn"
                style={{
                  flex: 1,
                  fontSize: '0.825rem',
                  padding: '0.55rem',
                  backgroundColor: 'var(--status-amber-bg)',
                  color: 'var(--status-amber-text)',
                  border: '1px solid var(--status-amber-border)',
                }}
              >
                <AlertTriangle size={14} />
                <span>Report Delay</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
              <button
                onClick={() => handleAction(expandedSeq, 'picked_up')}
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                ✓ Mark Picked Up
              </button>
              <button
                onClick={() => handleAction(expandedSeq, 'delivered')}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                }}
              >
                ✓ Complete Delivery
              </button>
            </div>
          </div>
        )}

        {/* ── Stop-by-Stop List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Full Route Waypoint Manifest
          </h3>

          {stops.map((stop, idx) => {
            const isCurrent = stop.seqNo === expandedSeq;
            const isCompleted = stop.status === 'completed';

            return (
              <div
                key={stop.seqNo}
                onClick={() => setExpandedSeq(stop.seqNo)}
                className={`animate-enter stagger-${idx + 1}`}
                style={{
                  backgroundColor: isCurrent ? '#FAF7F2' : '#FFFFFF',
                  border: isCurrent ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  opacity: isCompleted ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  transition: 'transform var(--duration-fast) var(--ease-spring)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? 'var(--status-emerald-text)' : isCurrent ? 'var(--primary)' : 'var(--border-medium)',
                    color: '#FAF7F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? '✓' : stop.seqNo}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {stop.customerName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: isCompleted ? 'var(--status-emerald-text)' : isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >
                      {stop.eta}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {stop.address}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Driver Delay Reporting Modal ── */}
        {delayModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(32, 26, 22, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setDelayModalOpen(false)}
          >
            <div
              className="modal-pop-in"
              style={{
                width: '460px',
                maxWidth: '100%',
                backgroundColor: '#FAF7F2',
                borderRadius: '16px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                border: '1px solid var(--border-light)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} style={{ color: '#B86F28' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Report Traffic Delay
                  </h3>
                </div>
                <button
                  onClick={() => setDelayModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendDelayReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Disruption Reason
                  </label>
                  <select
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', backgroundColor: '#FFFFFF', color: 'var(--text-main)', border: '1px solid var(--border-medium)', fontSize: '0.825rem' }}
                  >
                    <option value="Heavy traffic junction at Outer Ring Road">Heavy traffic junction at Outer Ring Road</option>
                    <option value="Monsoon rain and waterlogging">Monsoon rain & waterlogging</option>
                    <option value="Road construction barricade detour">Road construction barricade detour</option>
                    <option value="Flat tire / quick tire puncture fix">Flat tire / quick puncture check</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Estimated Delay
                  </label>
                  <select
                    value={delayDuration}
                    onChange={(e) => setDelayDuration(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', backgroundColor: '#FFFFFF', color: 'var(--text-main)', border: '1px solid var(--border-medium)', fontSize: '0.825rem' }}
                  >
                    <option value="15 mins">~15 mins</option>
                    <option value="20 mins">~20 mins</option>
                    <option value="30 mins">~30 mins</option>
                    <option value="45 mins">~45 mins</option>
                  </select>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--primary-tint)', border: '1px solid var(--primary-border)', fontSize: '0.78rem', color: 'var(--primary)', lineHeight: 1.5 }}>
                  ✨ Tapping submit will prompt Claude AI to generate a reassuring explanation and dispatch it to the customer automatically.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setDelayModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Sparkles size={14} />
                    <span>Send AI Customer Notice</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Driver Login / Switch Modal */}
      <DriverLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(d) => {
          setDriver(d);
          setStops(DRIVER_ROUTE_MANIFESTS[d.id] || initialDriverStops);
        }}
      />
    </div>
  );
};
