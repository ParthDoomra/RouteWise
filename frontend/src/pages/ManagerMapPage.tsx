import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ManagerLayout } from '../components/ManagerLayout';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import axios from 'axios';
import {
  Search,
  Truck,
  Route,
  Gauge,
  RefreshCw,
} from 'lucide-react';

// Helper to generate animated SVG pins with radar wave pulses in RouteWise palette
const createCustomMarkerIcon = (color: string, label: string, isLive: boolean = false) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
      <defs>
        <filter id="pin-shadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(43,36,30,0.35)"/>
        </filter>
      </defs>
      ${isLive ? `<circle cx="18" cy="18" r="16" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.6">
        <animate attributeName="r" values="14;24;30" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0.3;0" dur="2.2s" repeatCount="indefinite"/>
      </circle>` : ''}
      <path fill="${color}" stroke="#FAF7F2" stroke-width="2.2" filter="url(#pin-shadow)" d="M18 2C9.16 2 2 9.16 2 18c0 13 16 30 16 30s16-17 16-30c0-8.84-7.16-16-16-16z"/>
      <circle cx="18" cy="18" r="7" fill="#FAF7F2"/>
      <text x="18" y="22" font-size="10" font-weight="800" fill="${color}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">${label}</text>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-map-marker',
    html: svg,
    iconSize: [36, 48],
    iconAnchor: [18, 46],
    popupAnchor: [0, -42],
  });
};

const icons = {
  on_time: createCustomMarkerIcon('#4A5D3A', '✓', true),
  delayed: createCustomMarkerIcon('#B86F28', '!', true),
  unassigned: createCustomMarkerIcon('#6E665C', 'P', false),
  maintenance: createCustomMarkerIcon('#A83C2C', 'W', false),
};

export interface LiveMapVehicle {
  id: number;
  plateNo: string;
  model: string;
  driverName: string;
  status: 'on_time' | 'delayed' | 'unassigned' | 'maintenance';
  statusRaw: string;
  currentLat: number;
  currentLng: number;
  capacityKg: number;
  mileageKm: number;
}

export interface BackendVehicleRaw {
  id: number;
  plate_no: string;
  model: string | null;
  capacity_kg: number;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  mileage_km: number;
}

export interface BackendDriverRaw {
  id: number;
  name: string;
  vehicle_id: number | null;
}

const MapFlyToHandler: React.FC<{ targetLocation: [number, number] | null }> = ({ targetLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 14, { duration: 1.0 });
    }
  }, [targetLocation, map]);
  return null;
};

export const ManagerMapPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<LiveMapVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'on_time' | 'delayed' | 'unassigned' | 'maintenance'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<LiveMapVehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [hasNoResults, setHasNoResults] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'inspector' | 'fleet'>('inspector');

  const fetchMapData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [vRes, dRes] = await Promise.all([
        apiClient.get<BackendVehicleRaw[]>('/vehicles'),
        apiClient.get<BackendDriverRaw[]>('/drivers').catch(() => ({ data: [] as BackendDriverRaw[] })),
      ]);

      const mapped: LiveMapVehicle[] = vRes.data.map((v) => {
        const driver = dRes.data.find((d) => d.vehicle_id === v.id);
        const statusKey =
          v.status === 'on_route'
            ? 'on_time'
            : v.status === 'delayed'
            ? 'delayed'
            : v.status === 'maintenance'
            ? 'maintenance'
            : 'unassigned';

        return {
          id: v.id,
          plateNo: v.plate_no,
          model: v.model || 'Commercial Vehicle',
          driverName: driver ? driver.name : 'Unassigned',
          status: statusKey,
          statusRaw: v.status,
          currentLat: v.current_lat != null ? Number(v.current_lat) : 12.9716,
          currentLng: v.current_lng != null ? Number(v.current_lng) : 77.5946,
          capacityKg: Number(v.capacity_kg),
          mileageKm: Number(v.mileage_km || 0),
        };
      });

      setVehicles(mapped);
      if (mapped.length > 0 && !selectedVehicle) {
        setSelectedVehicle(mapped[0]);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFetchError(err.response?.data?.detail || err.message || 'Cannot reach server');
      } else {
        setFetchError('Failed to load fleet coordinates from server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const defaultCenter: [number, number] = vehicles.length > 0
    ? [vehicles[0].currentLat, vehicles[0].currentLng]
    : [12.9716, 77.5946];

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedFilter === 'all') return true;
    return v.status === selectedFilter;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setHasNoResults(false);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const match = vehicles.find(
      (v) =>
        v.plateNo.toLowerCase().includes(query) ||
        v.driverName.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query)
    );

    if (match) {
      setSelectedVehicle(match);
      setFlyToTarget([match.currentLat, match.currentLng]);
      setSidebarTab('inspector');
      setHasNoResults(false);
    } else {
      setHasNoResults(true);
    }
  };

  const handleVehicleSelect = (v: LiveMapVehicle) => {
    setSelectedVehicle(v);
    setFlyToTarget([v.currentLat, v.currentLng]);
    setSidebarTab('inspector');
  };

  const onRouteCount = vehicles.filter((v) => v.status === 'on_time').length;
  const delayedCount = vehicles.filter((v) => v.status === 'delayed').length;
  const standbyCount = vehicles.filter((v) => v.status === 'unassigned').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'maintenance').length;

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)', gap: '1rem' }}>
        
        {/* ── Top Floating Command Bar ── */}
        <div
          className="card animate-enter"
          style={{
            padding: '0.9rem 1.4rem',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Live Dispatch & Fleet Map
              </h1>
              <span className="status-badge badge-olive" style={{ fontSize: '0.7rem' }}>
                <span className="live-pulse-dot" /> {vehicles.length} Units Online
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Real-time vehicle GPS telemetry, status filters, and direct route optimizer inspection.
            </p>
          </div>

          {/* Search + Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              onClick={fetchMapData}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
              title="Refresh vehicle telemetry"
            >
              <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>

            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search plate, driver, model..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (hasNoResults) setHasNoResults(false);
                }}
                style={{
                  padding: '0.45rem 2.2rem 0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: hasNoResults ? '1px solid var(--status-rose-border)' : '1px solid var(--border-medium)',
                  fontSize: '0.825rem',
                  width: '240px',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-main)',
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <Search size={14} />
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => setSelectedFilter('all')}
                className={`btn ${selectedFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                All ({vehicles.length})
              </button>

              <button
                onClick={() => setSelectedFilter('on_time')}
                className="btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  backgroundColor: selectedFilter === 'on_time' ? 'var(--primary)' : 'var(--status-emerald-bg)',
                  color: selectedFilter === 'on_time' ? '#FAF7F2' : 'var(--status-emerald-text)',
                  border: '1px solid var(--status-emerald-border)',
                }}
              >
                🟢 On Route ({onRouteCount})
              </button>

              <button
                onClick={() => setSelectedFilter('delayed')}
                className="btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  backgroundColor: selectedFilter === 'delayed' ? '#B86F28' : 'var(--status-amber-bg)',
                  color: selectedFilter === 'delayed' ? '#FAF7F2' : 'var(--status-amber-text)',
                  border: '1px solid var(--status-amber-border)',
                }}
              >
                🟡 Delayed ({delayedCount})
              </button>

              <button
                onClick={() => setSelectedFilter('unassigned')}
                className="btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  backgroundColor: selectedFilter === 'unassigned' ? '#6E665C' : 'var(--status-slate-bg)',
                  color: selectedFilter === 'unassigned' ? '#FAF7F2' : 'var(--status-slate-text)',
                  border: '1px solid var(--status-slate-border)',
                }}
              >
                ⚪ Standby ({standbyCount})
              </button>

              <button
                onClick={() => setSelectedFilter('maintenance')}
                className="btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  backgroundColor: selectedFilter === 'maintenance' ? '#A83C2C' : 'var(--status-rose-bg)',
                  color: selectedFilter === 'maintenance' ? '#FAF7F2' : 'var(--status-rose-text)',
                  border: '1px solid var(--status-rose-border)',
                }}
              >
                🔴 Workshop ({maintenanceCount})
              </button>
            </div>
          </div>
        </div>

        {/* ── Error Notification ── */}
        {fetchError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--status-rose-bg, #FFF1F2)',
              border: '1px solid var(--status-rose-border, #FECDD3)',
              borderRadius: '10px',
              color: 'var(--status-rose-text, #9F1239)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.825rem',
            }}
          >
            <span>{fetchError}</span>
            <button onClick={fetchMapData} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>Retry</button>
          </div>
        )}

        {/* ── Main Map + Dispatcher Side Panel ── */}
        <div style={{ flex: 1, display: 'flex', gap: '1rem', minHeight: 0, position: 'relative' }}>
          
          {/* Leaflet Map Frame */}
          <div
            className="card animate-enter stagger-1"
            style={{
              flex: 1,
              padding: 0,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <MapContainer center={defaultCenter} zoom={12} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFlyToHandler targetLocation={flyToTarget} />

              {/* Real Vehicle Markers */}
              {filteredVehicles.map((v) => (
                <Marker
                  key={v.id}
                  position={[v.currentLat, v.currentLng]}
                  icon={icons[v.status]}
                  eventHandlers={{
                    click: () => handleVehicleSelect(v),
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'var(--font-sans)', padding: '0.2rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#201A16' }}>{v.plateNo}</div>
                      <div style={{ fontSize: '0.78rem', color: '#7D7468', marginTop: '0.2rem' }}>
                        Driver: <strong>{v.driverName}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#7D7468' }}>
                        Model: <strong>{v.model}</strong> • {v.capacityKg} kg
                      </div>
                      <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleVehicleSelect(v)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            backgroundColor: '#201A16',
                            color: '#FAF7F2',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Inspect Unit
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Quick Map Legend Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                backgroundColor: 'rgba(32, 26, 22, 0.9)',
                backdropFilter: 'blur(8px)',
                color: '#FAF7F2',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <span>● Olive: On Route</span>
              <span>● Amber: Delayed</span>
              <span>● Stone: Available</span>
              <span>● Brick: Workshop</span>
            </div>
          </div>

          {/* ── Dispatcher Side Drawer ── */}
          <div
            className="card animate-enter stagger-2"
            style={{
              width: '380px',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
            }}
          >
            {/* Drawer Header Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <button
                onClick={() => setSidebarTab('inspector')}
                style={{
                  flex: 1,
                  padding: '0.9rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: sidebarTab === 'inspector' ? '2px solid var(--primary)' : '2px solid transparent',
                  backgroundColor: sidebarTab === 'inspector' ? '#FFFFFF' : 'transparent',
                  color: sidebarTab === 'inspector' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Gauge size={14} />
                <span>Telemetry Inspector</span>
              </button>

              <button
                onClick={() => setSidebarTab('fleet')}
                style={{
                  flex: 1,
                  padding: '0.9rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: sidebarTab === 'fleet' ? '2px solid var(--primary)' : '2px solid transparent',
                  backgroundColor: sidebarTab === 'fleet' ? '#FFFFFF' : 'transparent',
                  color: sidebarTab === 'fleet' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Truck size={14} />
                <span>Fleet Roster ({vehicles.length})</span>
              </button>
            </div>

            {/* Tab 1: Telemetry Inspector View */}
            {sidebarTab === 'inspector' && selectedVehicle && (
              <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                
                {/* Vehicle Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedVehicle.plateNo}
                    </span>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {selectedVehicle.model}
                    </div>
                  </div>

                  <span
                    className={`status-badge ${
                      selectedVehicle.status === 'on_time'
                        ? 'badge-emerald'
                        : selectedVehicle.status === 'delayed'
                        ? 'badge-amber'
                        : selectedVehicle.status === 'maintenance'
                        ? 'badge-rose'
                        : 'badge-slate'
                    }`}
                  >
                    {selectedVehicle.status === 'on_time' && '✓ On Route'}
                    {selectedVehicle.status === 'delayed' && '⚠ Delayed'}
                    {selectedVehicle.status === 'unassigned' && '○ Available'}
                    {selectedVehicle.status === 'maintenance' && '⚙ In Bay'}
                  </span>
                </div>

                {/* Driver Card */}
                <div style={{ padding: '0.9rem 1rem', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Assigned Driver
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {selectedVehicle.driverName}
                  </div>
                </div>

                {/* Telemetry Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Payload Capacity
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {selectedVehicle.capacityKg} kg
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Odometer Reading
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                      {selectedVehicle.mileageKm.toLocaleString()} km
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates Box */}
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    GPS Live Telemetry Fix
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>
                    Lat: {selectedVehicle.currentLat.toFixed(5)}, Lng: {selectedVehicle.currentLng.toFixed(5)}
                  </div>
                </div>

                {/* Inspect Route Action Button */}
                <Link
                  to={`/manager/routes/${selectedVehicle.id}`}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    marginTop: 'auto',
                  }}
                >
                  <Route size={16} />
                  <span>Open Route Optimizer &rarr;</span>
                </Link>

              </div>
            )}

            {/* Tab 2: Full Fleet List Quick Switcher */}
            {sidebarTab === 'fleet' && (
              <div style={{ padding: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleVehicleSelect(v)}
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: '10px',
                      backgroundColor: selectedVehicle?.id === v.id ? 'var(--primary-tint)' : 'var(--bg-surface)',
                      border: selectedVehicle?.id === v.id ? '1px solid var(--primary-border)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div className="font-mono" style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {v.plateNo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {v.model} • {v.driverName}
                      </div>
                    </div>

                    <span
                      className={`status-badge ${
                        v.status === 'on_time'
                          ? 'badge-emerald'
                          : v.status === 'delayed'
                          ? 'badge-amber'
                          : v.status === 'maintenance'
                          ? 'badge-rose'
                          : 'badge-slate'
                      }`}
                      style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                    >
                      {v.status === 'on_time' ? 'En Route' : v.status === 'maintenance' ? 'Workshop' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </ManagerLayout>
  );
};
