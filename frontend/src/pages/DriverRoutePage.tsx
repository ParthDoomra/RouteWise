import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MapPin,
  Sparkles,
  X,
  AlertTriangle,
  Truck,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export interface BackendRouteStop {
  id: number;
  route_id: number;
  order_id?: number | null;
  sequence_no: number;
  stop_lat?: number | null;
  stop_lng?: number | null;
  eta?: string | null;
  actual_arrival?: string | null;
  delay_reason?: string | null;
  status: string; // 'pending' | 'picked_up' | 'delivered'
  picked_up_at?: string | null;
  delivered_at?: string | null;
  is_estimated_eta?: boolean;
  order_code?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  address?: string | null;
  weight_kg?: number | null;
}

export interface BackendRoute {
  id: number;
  vehicle_id: number;
  route_date: string;
  total_distance_km?: number | null;
  total_time_min?: number | null;
  status: string;
  stops: BackendRouteStop[];
}

export const DriverRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const { displayName, logout } = useAuth();

  const [route, setRoute] = useState<BackendRoute | null>(null);
  const [stops, setStops] = useState<BackendRouteStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoRoute, setHasNoRoute] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [expandedSeq, setExpandedSeq] = useState<number | null>(null);
  const [actionLoadingStopId, setActionLoadingStopId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [celebrateId, setCelebrateId] = useState<number | null>(null);

  // Delay reporting modal state
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('Heavy traffic junction at Outer Ring Road');
  const [delayDuration, setDelayDuration] = useState('20 mins');
  const [aiNoticeSent, setAiNoticeSent] = useState<string | null>(null);

  // Load driver assigned route from GET /driver/route
  const fetchDriverRoute = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setHasNoRoute(false);
    setActionError(null);

    try {
      const resp = await apiClient.get<BackendRoute>('/driver/route');
      const loadedRoute = resp.data;
      setRoute(loadedRoute);

      const sortedStops = [...(loadedRoute.stops || [])].sort((a, b) => a.sequence_no - b.sequence_no);
      setStops(sortedStops);

      // Expand first unfinished stop
      const firstActive = sortedStops.find((s) => s.status !== 'delivered');
      if (firstActive) {
        setExpandedSeq(firstActive.sequence_no);
      } else if (sortedStops.length > 0) {
        setExpandedSeq(sortedStops[sortedStops.length - 1].sequence_no);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setHasNoRoute(true);
        } else {
          setFetchError(err.response?.data?.detail || err.message || 'Cannot load route manifest.');
        }
      } else {
        setFetchError('Unexpected error loading route.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverRoute();
  }, [fetchDriverRoute]);

  // Handle Mark Picked Up
  const handleMarkPickup = async (stop: BackendRouteStop) => {
    setActionLoadingStopId(stop.id);
    setActionError(null);

    try {
      const resp = await apiClient.post<BackendRouteStop>(`/driver/stops/${stop.id}/pickup`);
      const updatedStop = resp.data;

      setStops((prev) =>
        prev.map((s) => (s.id === stop.id ? { ...s, ...updatedStop, status: 'picked_up' } : s))
      );
      setCelebrateId(stop.sequence_no);
      setTimeout(() => setCelebrateId(null), 1000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.detail || 'Failed to mark stop picked up.';
        setActionError(msg);
      } else {
        setActionError('Failed to mark stop picked up.');
      }
    } finally {
      setActionLoadingStopId(null);
    }
  };

  // Handle Mark Delivered
  const handleMarkDeliver = async (stop: BackendRouteStop) => {
    setActionLoadingStopId(stop.id);
    setActionError(null);

    try {
      const resp = await apiClient.post<BackendRouteStop>(`/driver/stops/${stop.id}/deliver`);
      const updatedStop = resp.data;

      setStops((prev) => {
        const updated = prev.map((s) =>
          s.id === stop.id ? { ...s, ...updatedStop, status: 'delivered' } : s
        );

        // Advance to next uncompleted stop
        const nextActive = updated.find((s) => s.status !== 'delivered');
        if (nextActive) {
          setExpandedSeq(nextActive.sequence_no);
        }

        return updated;
      });

      setCelebrateId(stop.sequence_no);
      setTimeout(() => setCelebrateId(null), 1200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.detail || 'Failed to complete delivery.';
        setActionError(msg);
      } else {
        setActionError('Failed to complete delivery.');
      }
    } finally {
      setActionLoadingStopId(null);
    }
  };

  const handleSendDelayReport = (e: React.FormEvent) => {
    e.preventDefault();
    setDelayModalOpen(false);
    const activeStop = stops.find((s) => s.sequence_no === expandedSeq);
    setAiNoticeSent(
      `AI Dispatch Notice generated for ${activeStop?.order_code || 'Stop'}: Revised ETA +${delayDuration}`
    );
    setTimeout(() => setAiNoticeSent(null), 5000);
  };

  const completedCount = stops.filter((s) => s.status === 'delivered').length;
  const progressPercent = stops.length > 0 ? Math.round((completedCount / stops.length) * 100) : 0;
  const activeStop = stops.find((s) => s.sequence_no === expandedSeq);

  const formatEta = (stop: BackendRouteStop) => {
    if (!stop.eta) return 'Pending';
    try {
      const dt = new Date(stop.eta);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (stop.is_estimated_eta ? ' (Est)' : '');
    } catch {
      return String(stop.eta);
    }
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '0 1.5rem', height: '66px', backgroundColor: '#FAF7F2', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
            RouteWise Driver Portal
          </div>
        </header>
        <div style={{ maxWidth: '640px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <div className="card" style={{ padding: '2.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1.25rem', width: '36px', height: '36px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Loading Route Manifest...
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Fetching vehicle stop sequence and assigned package details
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (fetchError) {
    return (
      <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '0 1.5rem', height: '66px', backgroundColor: '#FAF7F2', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
            RouteWise Driver Portal
          </div>
        </header>
        <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <div className="card" style={{ padding: '2.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            <AlertTriangle size={36} style={{ color: 'var(--status-amber-text)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{fetchError}</h3>
            <button onClick={fetchDriverRoute} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty State: Driver Has No Route Assigned ──
  if (hasNoRoute || stops.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            padding: '0 1.5rem',
            height: '66px',
            backgroundColor: '#FAF7F2',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              RW
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
                Driver Portal
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {displayName || 'Driver'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </header>

        <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '0 1rem', width: '100%', textAlign: 'center' }}>
          <div
            className="card animate-enter"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '3rem 2rem',
              border: '1px solid var(--border-light)',
              boxShadow: '0 6px 24px rgba(43, 36, 30, 0.06)',
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
                backgroundColor: 'var(--primary-tint)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Truck size={32} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
              No Route Assigned Today
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.55, maxWidth: '400px' }}>
              Your fleet vehicle does not currently have an active delivery route assigned by dispatch. Please check back when new orders are optimized or verify with your dispatcher.
            </p>

            <button
              onClick={fetchDriverRoute}
              className="btn btn-primary"
              style={{ marginTop: '2rem', padding: '0.7rem 1.4rem', fontSize: '0.875rem' }}
            >
              <RefreshCw size={15} />
              <span>Check for New Route</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '100vh' }}>
      
      {/* ── Driver App Navigation Header ── */}
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
              {displayName || 'Driver'} • Route #{route?.id}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={fetchDriverRoute}
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-medium)',
              padding: '0.38rem 0.85rem',
              borderRadius: '9999px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <LogOut size={13} />
            <span>Logout</span>
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

        {/* Global Action Error Banner */}
        {actionError && (
          <div
            className="animate-enter"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '12px',
              backgroundColor: 'var(--status-amber-bg)',
              border: '1px solid var(--status-amber-border)',
              color: 'var(--status-amber-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AlertTriangle size={16} />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

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

        {/* ── Active Next Stop Card (Expanded) ── */}
        {activeStop && (
          <div
            className={`card animate-enter stagger-1 ${celebrateId === activeStop.sequence_no ? 'celebrate-pop' : ''}`}
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
                <span className="live-pulse-dot" /> ACTIVE TARGET STOP #{activeStop.sequence_no}
              </span>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                ETA: {formatEta(activeStop)}
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span className="font-mono" style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-tint)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  {activeStop.order_code || `ORDER #${activeStop.order_id}`}
                </span>
                <span className={`status-badge ${activeStop.status === 'delivered' ? 'badge-emerald' : activeStop.status === 'picked_up' ? 'badge-olive' : 'badge-slate'}`} style={{ fontSize: '0.7rem' }}>
                  {activeStop.status === 'delivered' ? '✓ Delivered' : activeStop.status === 'picked_up' ? '● Picked Up' : '○ Pending Pickup'}
                </span>
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {activeStop.customer_name || 'Recipient'}
              </h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.15rem' }} />
                <span>{activeStop.address || 'Address details in manifest'}</span>
              </div>
              {activeStop.weight_kg !== undefined && activeStop.weight_kg !== null && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginLeft: '1.4rem' }}>
                  Package Weight: <strong>{activeStop.weight_kg} kg</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              {activeStop.customer_phone ? (
                <a
                  href={`tel:${activeStop.customer_phone}`}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.825rem', padding: '0.55rem' }}
                >
                  <Phone size={14} />
                  <span>Call Recipient</span>
                </a>
              ) : (
                <button
                  disabled
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.825rem', padding: '0.55rem', opacity: 0.6 }}
                >
                  <Phone size={14} />
                  <span>No Phone Listed</span>
                </button>
              )}

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

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
              <button
                onClick={() => handleMarkPickup(activeStop)}
                disabled={activeStop.status === 'picked_up' || activeStop.status === 'delivered' || actionLoadingStopId === activeStop.id}
                className={`btn ${activeStop.status === 'picked_up' ? 'btn-secondary' : 'btn-primary'}`}
                style={{
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  opacity: activeStop.status === 'picked_up' || activeStop.status === 'delivered' ? 0.65 : 1,
                }}
              >
                {activeStop.status === 'picked_up' ? '✓ Picked Up' : 'Mark Picked Up'}
              </button>

              <button
                onClick={() => handleMarkDeliver(activeStop)}
                disabled={activeStop.status !== 'picked_up' || actionLoadingStopId === activeStop.id}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  opacity: activeStop.status !== 'picked_up' ? 0.5 : 1,
                }}
              >
                {activeStop.status === 'delivered' ? '✓ Delivered' : 'Mark Delivered'}
              </button>
            </div>
          </div>
        )}

        {/* ── Stop-by-Stop List (Upcoming Collapsed) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Full Route Waypoint Manifest ({stops.length} Stops)
          </h3>

          {stops.map((stop, idx) => {
            const isCurrent = stop.sequence_no === expandedSeq;
            const isCompleted = stop.status === 'delivered';
            const isPickedUp = stop.status === 'picked_up';

            return (
              <div
                key={stop.id}
                onClick={() => setExpandedSeq(stop.sequence_no)}
                className={`animate-enter stagger-${Math.min(idx + 1, 5)}`}
                style={{
                  backgroundColor: isCurrent ? '#FAF7F2' : '#FFFFFF',
                  border: isCurrent ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  opacity: isCompleted ? 0.7 : 1,
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
                    backgroundColor: isCompleted
                      ? 'var(--status-emerald-text)'
                      : isPickedUp
                      ? 'var(--status-amber-text)'
                      : isCurrent
                      ? 'var(--primary)'
                      : 'var(--border-medium)',
                    color: '#FAF7F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? '✓' : stop.sequence_no}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {stop.customer_name || stop.order_code || `Stop #${stop.sequence_no}`}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: isCompleted ? 'var(--status-emerald-text)' : isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >
                      {formatEta(stop)}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {stop.address || 'Address on file'}
                  </div>
                </div>

                <div>
                  <span className={`status-badge ${isCompleted ? 'badge-emerald' : isPickedUp ? 'badge-amber' : 'badge-slate'}`} style={{ fontSize: '0.68rem' }}>
                    {isCompleted ? 'Delivered' : isPickedUp ? 'Picked Up' : 'Pending'}
                  </span>
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
                  ✨ Tapping submit will generate a verified recipient notice for this route delay.
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
                    <span>Send Notice</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
