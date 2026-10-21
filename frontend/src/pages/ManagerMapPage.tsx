import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ManagerLayout } from '../components/ManagerLayout';
import { Link } from 'react-router-dom';
import {
  Search,
  Truck,
  Sparkles,
  ExternalLink,
  Route,
  Gauge,
  BatteryCharging,
} from 'lucide-react';

// Helper to generate animated SVG pins with radar wave pulses in new palette
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

interface Vehicle {
  id: string;
  plateNo: string;
  driverName: string;
  driverPhone: string;
  status: 'on_time' | 'delayed' | 'unassigned' | 'maintenance';
  currentLat: number;
  currentLng: number;
  currentOrder: string;
  trackingUuid?: string;
  nextStop: string;
  eta: string;
  speed: string;
  batteryMileage: string;
  batteryPercent: number;
  locationName: string;
  routePolyline?: [number, number][];
  totalStops?: number;
  completedStops?: number;
}

const initialVehicles: Vehicle[] = [
  {
    id: 'V1',
    plateNo: 'KA-01-EA-1024',
    driverName: 'Rahul Sharma',
    driverPhone: '+91 98450 11223',
    status: 'on_time',
    currentLat: 12.9716,
    currentLng: 77.5946,
    currentOrder: 'ORD-8945',
    trackingUuid: 'e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e',
    nextStop: 'MG Road, Sector 4, #402',
    locationName: 'Indiranagar Hub',
    eta: '14:20 PM (On Time)',
    speed: '38 km/h',
    batteryMileage: '14,250 km',
    batteryPercent: 82,
    totalStops: 4,
    completedStops: 2,
    routePolyline: [
      [12.9716, 77.5946],
      [12.9735, 77.5980],
      [12.9750, 77.6010],
      [12.9775, 77.6045],
      [12.9800, 77.6080],
    ],
  },
  {
    id: 'V2',
    plateNo: 'KA-01-GB-5091',
    driverName: 'Priya Nair',
    driverPhone: '+91 99011 44556',
    status: 'delayed',
    currentLat: 12.9352,
    currentLng: 77.6245,
    currentOrder: 'ORD-8942',
    trackingUuid: 'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10',
    nextStop: 'Koramangala 5th Block, #12',
    locationName: 'HSR Layout Sector 2',
    eta: '14:55 PM (Delayed by 25m)',
    speed: '12 km/h',
    batteryMileage: '28,100 km',
    batteryPercent: 64,
    totalStops: 5,
    completedStops: 1,
    routePolyline: [
      [12.9352, 77.6245],
      [12.9335, 77.6275],
      [12.9320, 77.6300],
      [12.9300, 77.6325],
      [12.9280, 77.6350],
    ],
  },
  {
    id: 'V3',
    plateNo: 'KA-05-MC-8812',
    driverName: 'Amit Patel',
    driverPhone: '+91 97400 88990',
    status: 'on_time',
    currentLat: 12.9250,
    currentLng: 77.5897,
    currentOrder: 'ORD-8938',
    trackingUuid: 'c4d3b2a1-8e7f-4a5b-9c8d-1e2f3a4b5c6d',
    nextStop: 'Jayanagar 4th Block, #88',
    locationName: 'Jayanagar Depot',
    eta: '14:35 PM (On Time)',
    speed: '42 km/h',
    batteryMileage: '9,840 km',
    batteryPercent: 91,
    totalStops: 3,
    completedStops: 2,
    routePolyline: [
      [12.9250, 77.5897],
      [12.9225, 77.5865],
      [12.9200, 77.5840],
      [12.9175, 77.5815],
      [12.9150, 77.5790],
    ],
  },
  {
    id: 'V4',
    plateNo: 'KA-03-HA-3301',
    driverName: 'Vikram Singh',
    driverPhone: '+91 98800 22331',
    status: 'unassigned',
    currentLat: 12.9900,
    currentLng: 77.5700,
    currentOrder: 'Standby / Available',
    nextStop: 'Malleshwaram Standby Depot',
    locationName: 'Malleshwaram Central',
    eta: 'Ready for Dispatch',
    speed: '0 km/h',
    batteryMileage: '31,500 km',
    batteryPercent: 100,
  },
  {
    id: 'V5',
    plateNo: 'KA-04-MH-9920',
    driverName: 'Suresh Kumar',
    driverPhone: '+91 99887 66554',
    status: 'maintenance',
    currentLat: 12.9500,
    currentLng: 77.5400,
    currentOrder: 'In Service Bay #2',
    nextStop: 'Rajajinagar Service Center',
    locationName: 'Rajajinagar Workshop',
    eta: 'Scheduled Ready 18:00',
    speed: '0 km/h',
    batteryMileage: '45,200 km',
    batteryPercent: 45,
  },
  {
    id: 'V6',
    plateNo: 'KA-51-AB-9012',
    driverName: 'Rajesh Sharma',
    driverPhone: '+91 97711 33445',
    status: 'unassigned',
    currentLat: 12.9600,
    currentLng: 77.6400,
    currentOrder: 'Standby / Available',
    nextStop: 'Domlur Logistics Park',
    locationName: 'Domlur Layout',
    eta: 'Ready for Dispatch',
    speed: '0 km/h',
    batteryMileage: '16,400 km',
    batteryPercent: 95,
  },
  {
    id: 'V7',
    plateNo: 'KA-02-JL-4411',
    driverName: 'Deepak Kumar',
    driverPhone: '+91 98112 44556',
    status: 'unassigned',
    currentLat: 13.0100,
    currentLng: 77.5500,
    currentOrder: 'EV Scooter Standby',
    nextStop: 'Yeshwanthpur EV Hub',
    locationName: 'Yeshwanthpur Rail Station',
    eta: 'Ready for Quick Runs',
    speed: '0 km/h',
    batteryMileage: '4,800 km',
    batteryPercent: 98,
  },
];

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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'on_time' | 'delayed' | 'unassigned' | 'maintenance'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(initialVehicles[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [hasNoResults, setHasNoResults] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'inspector' | 'fleet'>('inspector');

  const vehicles = initialVehicles;
  const [motionProgress, setMotionProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMotionProgress((prev) => (prev >= 1 ? 0 : prev + 0.025));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const getInterpolatedPoint = (path: [number, number][], p: number): [number, number] => {
    if (!path || path.length < 2) return path[0];
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

  const activeVehicles = vehicles.map((v) => {
    if (v.routePolyline && (v.status === 'on_time' || v.status === 'delayed')) {
      const offset = v.id === 'V1' ? 0 : v.id === 'V2' ? 0.35 : 0.7;
      const effectiveP = (motionProgress + offset) % 1;
      const [newLat, newLng] = getInterpolatedPoint(v.routePolyline, effectiveP);
      return { ...v, currentLat: newLat, currentLng: newLng };
    }
    return v;
  });

  const defaultCenter: [number, number] = [12.9550, 77.5950];

  const filteredVehicles = activeVehicles.filter((v) => {
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
    const match = activeVehicles.find(
      (v) =>
        v.plateNo.toLowerCase().includes(query) ||
        v.currentOrder.toLowerCase().includes(query) ||
        v.driverName.toLowerCase().includes(query) ||
        v.locationName.toLowerCase().includes(query) ||
        v.nextStop.toLowerCase().includes(query)
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

  const handleVehicleSelect = (v: Vehicle) => {
    setSelectedVehicle(v);
    setFlyToTarget([v.currentLat, v.currentLng]);
    setSidebarTab('inspector');
  };

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
                <span className="live-pulse-dot" /> 7 Units Live Streaming
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Real-time vehicle GPS telemetry, animated 2-Opt path routes & exception management.
            </p>
          </div>

          {/* Search + Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search plate, driver, order, area..."
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
                  width: '260px',
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
                🟢 On Time (2)
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
                🟡 Delayed (1)
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
                ⚪ Standby (3)
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
                🔴 Workshop (1)
              </button>
            </div>
          </div>
        </div>

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

              {/* Active Animated Polylines */}
              {filteredVehicles.map((v) => (
                v.routePolyline && (
                  <Polyline
                    key={`poly-${v.id}`}
                    positions={v.routePolyline}
                    pathOptions={{
                      color: v.status === 'delayed' ? '#B86F28' : '#4A5D3A',
                      weight: 4,
                      opacity: 0.85,
                      dashArray: '8, 8',
                      className: 'anim-route-polyline',
                    }}
                  />
                )
              ))}

              {/* Vehicle Markers */}
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
                        Order: <span className="font-mono" style={{ color: '#4A5D3A', fontWeight: 700 }}>{v.currentOrder}</span>
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

            {/* Quick Map Overlay Helper */}
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
              <span>● Olive: On-Time</span>
              <span>● Amber: Delayed</span>
              <span>● Stone: Standby</span>
              <span>● Brick: Workshop</span>
            </div>
          </div>

          {/* ── Dispatcher Side Drawer ── */}
          <div
            className="card animate-enter stagger-2"
            style={{
              width: '390px',
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
                <span>Fleet Queue ({filteredVehicles.length})</span>
              </button>
            </div>

            {/* Tab 1: Telemetry Inspector */}
            {sidebarTab === 'inspector' && (
              selectedVehicle ? (
                <div className="drawer-slide-in" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
                  
                  {/* Vehicle Plate & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Vehicle Unit
                      </span>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {selectedVehicle.plateNo}
                      </h2>
                    </div>

                    <span
                      className={`status-badge ${
                        selectedVehicle.status === 'on_time'
                          ? 'badge-emerald'
                          : selectedVehicle.status === 'delayed'
                          ? 'badge-amber'
                          : selectedVehicle.status === 'unassigned'
                          ? 'badge-slate'
                          : 'badge-rose'
                      }`}
                    >
                      {selectedVehicle.status === 'on_time' && '🟢 On Time'}
                      {selectedVehicle.status === 'delayed' && '🟡 Delayed'}
                      {selectedVehicle.status === 'unassigned' && '⚪ Standby'}
                      {selectedVehicle.status === 'maintenance' && '🔴 Workshop'}
                    </span>
                  </div>

                  {/* Driver Card */}
                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          color: '#FAF7F2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {selectedVehicle.driverName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {selectedVehicle.driverName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {selectedVehicle.driverPhone}
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/driver/route"
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Driver App &rarr;
                    </Link>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: '#FFFFFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        <Gauge size={13} />
                        <span>CURRENT SPEED</span>
                      </div>
                      <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                        {selectedVehicle.speed}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: '#FFFFFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        <BatteryCharging size={13} />
                        <span>BATTERY / FUEL</span>
                      </div>
                      <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: selectedVehicle.batteryPercent > 50 ? 'var(--status-emerald-text)' : 'var(--status-amber-text)', marginTop: '0.2rem' }}>
                        {selectedVehicle.batteryPercent}%
                      </div>
                    </div>
                  </div>

                  {/* Destination & Order Manifest */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>CURRENT ORDER ASSIGNMENT</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                        <strong className="font-mono" style={{ color: 'var(--primary)' }}>{selectedVehicle.currentOrder}</strong>
                        {selectedVehicle.trackingUuid && (
                          <Link
                            to={`/track/${selectedVehicle.trackingUuid}`}
                            style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 600 }}
                          >
                            <span>Customer Track</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>
                    </div>

                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>NEXT DESTINATION STOP</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                        {selectedVehicle.nextStop}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        Zone: {selectedVehicle.locationName}
                      </div>
                    </div>

                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>ESTIMATED ARRIVAL (ETA)</span>
                      <div style={{ fontWeight: 700, color: selectedVehicle.status === 'delayed' ? 'var(--status-amber-text)' : 'var(--text-main)', marginTop: '0.15rem' }}>
                        {selectedVehicle.eta}
                      </div>
                    </div>
                  </div>

                  {/* Actions CTA buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                    <Link
                      to={`/manager/routes/${selectedVehicle.plateNo}`}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.825rem' }}
                    >
                      <Route size={14} />
                      <span>Inspect 2-Opt Multi-Stop Sequence</span>
                    </Link>

                    {selectedVehicle.status === 'delayed' && (
                      <Link
                        to="/manager/notifications"
                        className="btn btn-secondary"
                        style={{ width: '100%', fontSize: '0.825rem' }}
                      >
                        <Sparkles size={14} style={{ color: '#C49746' }} />
                        <span>Send Claude AI Delay Broadcast</span>
                      </Link>
                    )}
                  </div>

                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Select any vehicle on the map to inspect live telemetry.
                </div>
              )
            )}

            {/* Tab 2: Fleet Queue */}
            {sidebarTab === 'fleet' && (
              <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1 }}>
                {filteredVehicles.map((v, idx) => (
                  <div
                    key={v.id}
                    onClick={() => handleVehicleSelect(v)}
                    className={`animate-enter stagger-${Math.min(idx + 1, 5)}`}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: selectedVehicle?.id === v.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      backgroundColor: selectedVehicle?.id === v.id ? 'var(--primary-tint)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'transform var(--duration-fast) var(--ease-spring)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(3px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{v.plateNo}</strong>
                      <span
                        className={`status-badge ${
                          v.status === 'on_time' ? 'badge-emerald' : v.status === 'delayed' ? 'badge-amber' : v.status === 'unassigned' ? 'badge-slate' : 'badge-rose'
                        }`}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                      >
                        {v.status === 'on_time' && 'On Time'}
                        {v.status === 'delayed' && 'Delayed'}
                        {v.status === 'unassigned' && 'Standby'}
                        {v.status === 'maintenance' && 'Workshop'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Driver: {v.driverName}</span>
                      <span className="font-mono">{v.speed}</span>
                    </div>
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
