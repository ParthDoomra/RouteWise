import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ManagerLayout } from '../components/ManagerLayout';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { apiClient } from '../api/client';
import axios from 'axios';
import {
  Zap,
  ArrowLeft,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Package,
  Plus,
} from 'lucide-react';

const createNumberedIcon = (num: number, isDepot: boolean = false) => {
  const bg = isDepot ? '#4A5D3A' : '#2B241E';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 44" width="34" height="44">
      <defs>
        <filter id="num-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(43,36,30,0.35)"/>
        </filter>
      </defs>
      <path fill="${bg}" stroke="#FAF7F2" stroke-width="2" filter="url(#num-shadow)" d="M17 0C7.61 0 0 7.61 0 17c0 12.5 17 27 17 27s17-14.5 17-27c0-9.39-7.61-17-17-17z"/>
      <circle cx="17" cy="17" r="7.5" fill="#FAF7F2"/>
      <text x="17" y="21" font-size="11" font-weight="800" fill="${bg}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">${num}</text>
    </svg>
  `;
  return L.divIcon({
    className: 'numbered-marker',
    html: svg,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
  });
};

export interface RouteStopItem {
  id: number;
  route_id: number;
  order_id: number | null;
  sequence_no: number;
  stop_lat: number | null;
  stop_lng: number | null;
  eta: string | null;
  actual_arrival: string | null;
  delay_reason: string | null;
  status: string;
}

export interface RouteDetailData {
  id: number;
  vehicle_id: number;
  route_date: string;
  total_distance_km: number | null;
  total_time_min: number | null;
  status: string;
  stops: RouteStopItem[];
}

export interface OptimizationMetrics {
  total_km: number;
  nearest_neighbor_km: number;
  improvement_percent: number;
  runtime_ms: number;
  distance_source: string;
  leg_by_leg_km: number[];
}

export interface VehicleRecord {
  id: number;
  plate_no: string;
  model: string | null;
  capacity_kg: number;
  status: string;
}

export interface PendingOrder {
  id: number;
  order_code: string;
  tracking_uuid: string;
  customer_name: string | null;
  customer_phone: string | null;
  pickup_address: string | null;
  drop_address: string | null;
  weight_kg: number | null;
  status: string;
  vehicle_id: number | null;
}

export const ManagerRouteDetailPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [currentVehicle, setCurrentVehicle] = useState<VehicleRecord | null>(null);
  const [route, setRoute] = useState<RouteDetailData | null>(null);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [optMetrics, setOptMetrics] = useState<OptimizationMetrics | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Plan Route Panel state (for empty state or re-optimizing)
  const [isPlanning, setIsPlanning] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);

  // 1. Load Vehicles & Determine target vehicle
  const loadData = async () => {
    setIsLoading(true);
    setFetchError(null);
    setOptimizeError(null);

    try {
      const [vRes, oRes] = await Promise.all([
        apiClient.get<VehicleRecord[]>('/vehicles'),
        apiClient.get<PendingOrder[]>('/orders'),
      ]);
      setOrders(oRes.data);

      const target = vRes.data.find(
        (v) => String(v.id) === vehicleId || v.plate_no === vehicleId
      ) || (vRes.data.length > 0 ? vRes.data[0] : null);

      setCurrentVehicle(target);

      if (target) {
        try {
          const rRes = await apiClient.get<RouteDetailData>(`/routes/${target.id}`);
          setRoute(rRes.data);
        } catch (rErr: unknown) {
          if (axios.isAxiosError(rErr) && rErr.response?.status === 404) {
            // No route exists for vehicle -> empty state
            setRoute(null);
            setIsPlanning(true);
          } else {
            throw rErr;
          }
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFetchError(err.response?.data?.detail || err.message || 'Cannot reach server');
      } else {
        setFetchError('Failed to load route telemetry from server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  // Handle Order Selection in Plan Route Panel
  const toggleOrderSelect = (orderId: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Compute selected orders total weight
  const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
  const totalSelectedWeight = selectedOrders.reduce(
    (sum, o) => sum + (Number(o.weight_kg) || 0),
    0
  );

  // Execute Real Route Optimization via POST /routes/optimize
  const handleOptimizeRoute = async () => {
    if (!currentVehicle) return;
    if (selectedOrderIds.length === 0) {
      setOptimizeError('Please select at least one pending order to route.');
      return;
    }

    setIsOptimizing(true);
    setOptimizeError(null);

    try {
      const resp = await apiClient.post('/routes/optimize', {
        vehicle_id: currentVehicle.id,
        order_ids: selectedOrderIds,
      });

      const optData = resp.data;
      setOptMetrics({
        total_km: optData.total_km,
        nearest_neighbor_km: optData.nearest_neighbor_km,
        improvement_percent: optData.improvement_percent,
        runtime_ms: optData.runtime_ms,
        distance_source: optData.distance_source,
        leg_by_leg_km: optData.leg_by_leg_km,
      });

      // Update route in state
      setRoute({
        id: optData.route_id,
        vehicle_id: optData.vehicle_id,
        route_date: new Date().toISOString().split('T')[0],
        total_distance_km: optData.total_km,
        total_time_min: Math.round(optData.total_km * 2),
        status: 'active',
        stops: optData.stops,
      });

      setIsPlanning(false);
      setSelectedOrderIds([]);

      // Refresh orders list so assigned orders are up to date
      const refreshedOrders = await apiClient.get<PendingOrder[]>('/orders');
      setOrders(refreshedOrders.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setOptimizeError('Cannot reach server');
        } else if (err.response.status === 400 || err.response.status === 404 || err.response.status === 422) {
          const detail = err.response.data?.detail;
          if (Array.isArray(detail)) {
            setOptimizeError(detail.map((d: { msg?: string }) => d.msg).join(' | '));
          } else {
            setOptimizeError(typeof detail === 'string' ? detail : 'Optimization validation rejected by server.');
          }
        } else {
          setOptimizeError(err.response.data?.detail || 'Route optimization failed on server.');
        }
      } else {
        setOptimizeError('An unexpected error occurred during optimization.');
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  // Map coordinates computation
  const depotCoords: [number, number] = [12.9772, 77.5656]; // Majestic Central Depot default

  const stops = (route?.stops || []).sort((a, b) => a.sequence_no - b.sequence_no);

  const routePolyline: [number, number][] = [
    depotCoords,
    ...stops
      .filter((s) => s.stop_lat != null && s.stop_lng != null)
      .map((s) => [Number(s.stop_lat), Number(s.stop_lng)] as [number, number]),
    depotCoords,
  ];

  const mapCenter: [number, number] =
    stops.length > 0 && stops[0].stop_lat != null && stops[0].stop_lng != null
      ? [Number(stops[0].stop_lat), Number(stops[0].stop_lng)]
      : depotCoords;

  const pendingOrdersAvailable = orders.filter(
    (o) => o.status === 'pending' && !o.vehicle_id
  );

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* ── Top Back Navigation & Action Bar ── */}
        <div
          className="card animate-enter"
          style={{
            padding: '1.25rem 1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            backgroundColor: '#FFFFFF',
            borderLeft: '4px solid var(--primary)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link
                to="/manager/vehicles"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Fleet</span>
              </Link>
              <span style={{ color: 'var(--border-medium)' }}>|</span>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Multi-Stop Route Optimizer — Vehicle {currentVehicle ? currentVehicle.plate_no : vehicleId}
              </h1>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Nearest-Neighbor greedy tour + 2-Opt local search edge-swap matrix optimization.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {route && !isPlanning && (
              <button
                onClick={() => {
                  setOptimizeError(null);
                  setIsPlanning(true);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.825rem' }}
              >
                <Plus size={15} />
                <span>Plan New Route / Add Orders</span>
              </button>
            )}

            <button
              onClick={loadData}
              className="btn btn-secondary"
              style={{ fontSize: '0.825rem' }}
              title="Refresh route data"
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fetchError}</span>
            </div>
            <button onClick={loadData} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>Retry</button>
          </div>
        )}

        {/* ── Optimization Convergence Metrics Banner ── */}
        {optMetrics && (
          <div
            className="celebrate-pop"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--status-emerald-bg)',
              border: '1px solid var(--status-emerald-border)',
              borderRadius: '12px',
              color: 'var(--status-emerald-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.825rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle2 size={18} />
              <span>
                2-Opt Converged in {optMetrics.runtime_ms.toFixed(1)}ms: Distance reduced from{' '}
                <strong>{optMetrics.nearest_neighbor_km.toFixed(1)} km</strong> to{' '}
                <strong>{optMetrics.total_km.toFixed(1)} km</strong> ({optMetrics.improvement_percent.toFixed(1)}% improvement) via{' '}
                <strong>{optMetrics.distance_source}</strong>.
              </span>
            </div>
            <button
              onClick={() => setOptMetrics(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-emerald-text)', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Loading Spinner ── */}
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
              Retrieving vehicle route manifest & distance matrices...
            </span>
          </div>
        ) : !route && !isPlanning ? (
          /* Empty State When Vehicle Has No Route */
          <div
            style={{
              padding: '3.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
              textAlign: 'center',
            }}
          >
            <Package size={42} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
              No Active Route Assigned
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px' }}>
              Vehicle <strong>{currentVehicle?.plate_no}</strong> does not currently have an active delivery route.
              Assign pending orders to plan and optimize a new 2-Opt multi-stop manifest.
            </p>
            <button
              onClick={() => setIsPlanning(true)}
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Zap size={15} />
              <span>Plan Route with 2-Opt</span>
            </button>
          </div>
        ) : isPlanning ? (
          /* ── Plan Route Panel: Order Selection & Validation ── */
          <div
            className="card animate-enter"
            style={{
              padding: '1.75rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Plan Route for {currentVehicle?.plate_no}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Select pending delivery orders from the manifest. The optimizer will compute the shortest road tour starting and ending at Majestic Depot.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Vehicle Capacity: <strong>{currentVehicle?.capacity_kg} kg</strong>
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: totalSelectedWeight > (currentVehicle?.capacity_kg || 0) ? 'var(--status-rose-text)' : 'var(--status-emerald-text)',
                  }}
                >
                  Selected: {totalSelectedWeight.toFixed(1)} kg / {currentVehicle?.capacity_kg} kg
                </div>
              </div>
            </div>

            {/* Error Message for Overweight / Already Assigned / General */}
            {optimizeError && (
              <div
                style={{
                  padding: '0.85rem 1.15rem',
                  backgroundColor: 'var(--status-rose-bg, #FFF1F2)',
                  border: '1px solid var(--status-rose-border, #FECDD3)',
                  borderRadius: '10px',
                  color: 'var(--status-rose-text, #9F1239)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{optimizeError}</span>
              </div>
            )}

            {/* Pending Orders Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
              {pendingOrdersAvailable.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No pending unassigned orders found in database. Create orders first on the Orders page.
                </div>
              ) : (
                pendingOrdersAvailable.map((order) => {
                  const isChecked = selectedOrderIds.includes(order.id);
                  return (
                    <div
                      key={order.id}
                      onClick={() => toggleOrderSelect(order.id)}
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderRadius: '10px',
                        backgroundColor: isChecked ? 'var(--primary-tint)' : 'var(--bg-surface)',
                        border: isChecked ? '1px solid var(--primary-border)' : '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>
                              {order.order_code}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {order.customer_name || 'Customer'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            Drop: {order.drop_address || 'Bengaluru Delivery Address'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {order.weight_kg ? `${Number(order.weight_kg).toFixed(1)} kg` : '0 kg'}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Weight</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              {route && (
                <button
                  type="button"
                  onClick={() => setIsPlanning(false)}
                  className="btn btn-secondary"
                  disabled={isOptimizing}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleOptimizeRoute}
                disabled={isOptimizing || selectedOrderIds.length === 0}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isOptimizing ? <RefreshCw size={15} className="spin-icon" /> : <Zap size={15} />}
                <span>{isOptimizing ? 'Optimizing 2-Opt Road Route...' : `Optimize Route (${selectedOrderIds.length} orders)`}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── Active Route Display (Map + Stop Sequence + Metrics) ── */
          <>
            {/* ── Route Algorithm KPI Metrics ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="card card-hover-lift animate-enter stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TOTAL DISTANCE
                </span>
                <AnimatedCounter
                  value={route.total_distance_km || 0}
                  decimals={1}
                  suffix=" km"
                  style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary)' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--status-emerald-text)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                  <TrendingDown size={13} />
                  <span>
                    {optMetrics
                      ? `2-Opt saved ${(optMetrics.nearest_neighbor_km - optMetrics.total_km).toFixed(1)} km (${optMetrics.improvement_percent.toFixed(1)}%)`
                      : 'Optimized 2-Opt delivery tour'}
                  </span>
                </div>
              </div>

              <div className="card card-hover-lift animate-enter stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  DISTANCE SOURCE
                </span>
                <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C49746' }}>
                  {optMetrics?.distance_source || 'OSRM Road Matrix'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {optMetrics ? `Runtime: ${optMetrics.runtime_ms.toFixed(1)} ms` : 'Live routing provider'}
                </div>
              </div>

              <div className="card card-hover-lift animate-enter stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  STOPS IN MANIFEST
                </span>
                <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {stops.length + 1} Waypoints
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Depot Origin + {stops.length} Delivery Stop{stops.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="card card-hover-lift animate-enter stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#FFFFFF' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  ESTIMATED DURATION
                </span>
                <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {route.total_time_min ? `${Math.round(route.total_time_min)} min` : `${Math.round((route.total_distance_km || 0) * 2)} min`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Status: {route.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* ── Interactive Map + Ordered Stop Manifest ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
              
              {/* Map Container */}
              <div className="card animate-enter stagger-2" style={{ padding: 0, overflow: 'hidden', minHeight: '520px', boxShadow: 'var(--shadow-md)', backgroundColor: '#FFFFFF' }}>
                <MapContainer center={mapCenter} zoom={12} style={{ width: '100%', height: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Polyline of the route */}
                  <Polyline
                    positions={routePolyline}
                    pathOptions={{
                      color: '#4A5D3A',
                      weight: 5,
                      opacity: 0.85,
                      dashArray: '8, 8',
                      className: 'anim-route-polyline',
                    }}
                  />

                  {/* Depot Marker: Sequence 0 */}
                  <Marker position={depotCoords} icon={createNumberedIcon(0, true)}>
                    <Popup>
                      <div style={{ fontFamily: 'var(--font-sans)', padding: '0.2rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#201A16' }}>
                          Depot Origin (Majestic, Bengaluru)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                          Start and end depot for delivery vehicle
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Stops Numbered in Visit Order */}
                  {stops.map((stop) => {
                    if (stop.stop_lat == null || stop.stop_lng == null) return null;
                    const stopOrder = orders.find((o) => o.id === stop.order_id);

                    return (
                      <Marker
                        key={stop.id}
                        position={[Number(stop.stop_lat), Number(stop.stop_lng)]}
                        icon={createNumberedIcon(stop.sequence_no, false)}
                      >
                        <Popup>
                          <div style={{ fontFamily: 'var(--font-sans)', padding: '0.2rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#201A16' }}>
                              Stop #{stop.sequence_no}: {stopOrder?.order_code || `Order #${stop.order_id}`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                              {stopOrder?.drop_address || 'Delivery Location'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#201A16', marginTop: '0.15rem' }}>
                              Recipient: <strong>{stopOrder?.customer_name || 'Customer'}</strong>
                            </div>
                            {stopOrder?.weight_kg && (
                              <div style={{ fontSize: '0.75rem', color: '#4A5D3A', marginTop: '0.15rem' }}>
                                Weight: <strong>{Number(stopOrder.weight_kg).toFixed(1)} kg</strong>
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Sequenced Waypoints Manifest */}
              <div className="card animate-enter stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Numbered Stop Sequence
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Optimal delivery visit order solved by 2-Opt edge swaps
                    </p>
                  </div>

                  <span className="status-badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={12} /> 2-Opt Solved
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
                  {/* Origin Depot Stop */}
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: '#FAF7F2',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      0
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Majestic Central Hub (Depot)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Tour Origin & Final Return Station
                      </div>
                    </div>
                  </div>

                  {/* Delivery Stops */}
                  {stops.map((stop, idx) => {
                    const stopOrder = orders.find((o) => o.id === stop.order_id);
                    const legDist = optMetrics?.leg_by_leg_km && optMetrics.leg_by_leg_km[idx] != null
                      ? optMetrics.leg_by_leg_km[idx]
                      : null;

                    return (
                      <div
                        key={stop.id}
                        className={`animate-enter stagger-${Math.min(idx + 1, 5)}`}
                        style={{
                          padding: '0.9rem 1.15rem',
                          borderRadius: '12px',
                          backgroundColor: stop.status === 'in_transit' ? 'var(--primary-tint)' : 'var(--bg-surface)',
                          border: stop.status === 'in_transit' ? '1px solid var(--primary-border)' : '1px solid var(--border-light)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#2B241E',
                            color: '#FAF7F2',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {stop.sequence_no}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="font-mono" style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--primary)' }}>
                              Stop #{stop.sequence_no}: {stopOrder ? stopOrder.order_code : `Order #${stop.order_id}`}
                            </span>
                            {legDist != null && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                +{legDist.toFixed(1)} km leg
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                            {stopOrder?.drop_address || 'Bengaluru Destination'}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <span>
                              Recipient: <strong>{stopOrder?.customer_name || 'Customer'}</strong>
                              {stopOrder?.weight_kg ? ` (${Number(stopOrder.weight_kg).toFixed(1)} kg)` : ''}
                            </span>
                            {stopOrder && (
                              <Link
                                to={`/track/${stopOrder.tracking_uuid}`}
                                target="_blank"
                                style={{
                                  color: 'var(--primary)',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  textDecoration: 'none',
                                  fontSize: '0.75rem',
                                }}
                              >
                                <span>Track Order</span>
                                <ExternalLink size={11} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </ManagerLayout>
  );
};
