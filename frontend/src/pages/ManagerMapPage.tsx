import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ManagerLayout } from '../components/ManagerLayout';

// Helper to generate SVG data URIs for color-coded map pin icons
const createCustomMarkerIcon = (color: string, isUnassigned: boolean = false) => {
  const svg = isUnassigned
    ? `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="42">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2 2" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z"/>
      <circle cx="12" cy="12" r="4" fill="#ffffff"/>
      <text x="12" y="15" font-size="9" font-weight="bold" fill="${color}" text-anchor="middle">P</text>
    </svg>
  `
    : `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="42">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-map-marker',
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
};

const icons = {
  on_time: createCustomMarkerIcon('#10b981'),      // Green
  delayed: createCustomMarkerIcon('#f59e0b'),      // Yellow/Amber
  unassigned: createCustomMarkerIcon('#94a3b8', true), // Gray with parking indicator
  maintenance: createCustomMarkerIcon('#ef4444'),   // Red
};

interface Vehicle {
  id: string;
  plateNo: string;
  driverName: string;
  status: 'on_time' | 'delayed' | 'unassigned' | 'maintenance';
  currentLat: number;
  currentLng: number;
  currentOrder: string;
  nextStop: string;
  eta: string;
  speed: string;
  batteryMileage: string;
  locationName: string;
  routePolyline?: [number, number][];
}

// Extended Bengaluru vehicle fleet (active + unassigned)
const dummyVehicles: Vehicle[] = [
  {
    id: 'V1',
    plateNo: 'KA-01-EA-1024',
    driverName: 'Rahul Sharma',
    status: 'on_time',
    currentLat: 12.9716,
    currentLng: 77.5946,
    currentOrder: 'ORD-8940',
    nextStop: 'MG Road, Sector 4',
    locationName: 'Indiranagar Hub',
    eta: '14:20 PM (On Time)',
    speed: '38 km/h',
    batteryMileage: '14,250 km',
    routePolyline: [
      [12.9716, 77.5946],
      [12.9750, 77.6010],
      [12.9800, 77.6080],
      [12.9850, 77.6150],
    ],
  },
  {
    id: 'V2',
    plateNo: 'KA-01-GB-5091',
    driverName: 'Priya Nair',
    status: 'delayed',
    currentLat: 12.9352,
    currentLng: 77.6245,
    currentOrder: 'ORD-8942',
    nextStop: 'Koramangala 5th Block',
    locationName: 'HSR Layout Sector 2',
    eta: '14:55 PM (Delayed by 25m)',
    speed: '12 km/h',
    batteryMileage: '28,100 km',
    routePolyline: [
      [12.9352, 77.6245],
      [12.9320, 77.6300],
      [12.9280, 77.6350],
    ],
  },
  {
    id: 'V3',
    plateNo: 'KA-05-MC-8812',
    driverName: 'Amit Patel',
    status: 'on_time',
    currentLat: 12.9250,
    currentLng: 77.5897,
    currentOrder: 'ORD-8945',
    nextStop: 'Jayanagar 4th Block',
    locationName: 'Jayanagar Depot',
    eta: '14:35 PM (On Time)',
    speed: '42 km/h',
    batteryMileage: '9,840 km',
    routePolyline: [
      [12.9250, 77.5897],
      [12.9200, 77.5840],
      [12.9150, 77.5790],
      [12.9100, 77.5720],
    ],
  },
  {
    id: 'V4',
    plateNo: 'KA-03-HA-3301',
    driverName: 'Vikram Singh',
    status: 'unassigned',
    currentLat: 12.9900,
    currentLng: 77.5700,
    currentOrder: 'None (Unassigned / Standby)',
    nextStop: 'Malleshwaram Standby Depot',
    locationName: 'Malleshwaram Central',
    eta: 'N/A',
    speed: '0 km/h',
    batteryMileage: '31,500 km',
  },
  {
    id: 'V5',
    plateNo: 'KA-04-MH-9920',
    driverName: 'Suresh Kumar',
    status: 'maintenance',
    currentLat: 12.9500,
    currentLng: 77.5400,
    currentOrder: 'None (In Workshop)',
    nextStop: 'Rajajinagar Service Depot',
    locationName: 'Rajajinagar Workshop',
    eta: 'Under Maintenance',
    speed: '0 km/h',
    batteryMileage: '45,200 km',
  },
  {
    id: 'V6',
    plateNo: 'KA-51-AB-9012',
    driverName: 'Rajesh Sharma',
    status: 'unassigned',
    currentLat: 12.9600,
    currentLng: 77.6400,
    currentOrder: 'None (Unassigned / Idle)',
    nextStop: 'Domlur Logistics Park',
    locationName: 'Domlur Layout',
    eta: 'Available for Assignment',
    speed: '0 km/h',
    batteryMileage: '16,400 km',
  },
  {
    id: 'V7',
    plateNo: 'KA-02-JL-4411',
    driverName: 'Deepak Kumar',
    status: 'unassigned',
    currentLat: 13.0100,
    currentLng: 77.5500,
    currentOrder: 'None (Unassigned EV Scooter)',
    nextStop: 'Yeshwanthpur EV Hub',
    locationName: 'Yeshwanthpur Rail Station',
    eta: 'Available for Immediate Dispatch',
    speed: '0 km/h',
    batteryMileage: '4,800 km',
  },
];

// Component to clear selected vehicle on blank map click
const MapClickHandler: React.FC<{ onMapClick: () => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: () => onMapClick(),
  });
  return null;
};

// Component to handle smooth flyTo pan/zoom when a vehicle is selected via search
const MapFlyToHandler: React.FC<{ targetLocation: [number, number] | null }> = ({ targetLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 14, { duration: 1.2 });
    }
  }, [targetLocation, map]);
  return null;
};

export const ManagerMapPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'on_time' | 'delayed' | 'unassigned' | 'maintenance'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(dummyVehicles[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [hasNoResults, setHasNoResults] = useState(false);

  const defaultCenter: [number, number] = [12.9550, 77.5950];

  const filteredVehicles = dummyVehicles.filter((v) => {
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
    const match = dummyVehicles.find(
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
      setHasNoResults(false);
    } else {
      setHasNoResults(true);
    }
  };

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)', gap: '1rem' }}>
        
        {/* Header & Filter Controls Bar */}
        <div className="card" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Fleet Live Tracking Map</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time location, status filters & route trajectory inspect</p>
          </div>

          {/* Search Form + Status Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            
            {/* Integrated Search Bar */}
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search Plate, Order ID, Driver, Location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (hasNoResults) setHasNoResults(false);
                }}
                style={{
                  padding: '0.45rem 2.2rem 0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: hasNoResults ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  width: '280px',
                  outline: 'none',
                  backgroundColor: hasNoResults ? '#fef2f2' : '#ffffff',
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '6px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                🔍
              </button>
            </form>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.2rem' }}>Filter:</span>
              
              <button
                onClick={() => setSelectedFilter('all')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedFilter === 'all' ? 'var(--primary-navy)' : '#ffffff',
                  color: selectedFilter === 'all' ? '#ffffff' : 'var(--text-main)',
                }}
              >
                All ({dummyVehicles.length})
              </button>

              <button
                onClick={() => setSelectedFilter('on_time')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedFilter === 'on_time' ? '#10b981' : '#ecfdf5',
                  color: selectedFilter === 'on_time' ? '#ffffff' : '#065f46',
                }}
              >
                🟢 On Time (2)
              </button>

              <button
                onClick={() => setSelectedFilter('delayed')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid #fde68a',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedFilter === 'delayed' ? '#f59e0b' : '#fffbeb',
                  color: selectedFilter === 'delayed' ? '#ffffff' : '#92400e',
                }}
              >
                🟡 Delayed (1)
              </button>

              <button
                onClick={() => setSelectedFilter('unassigned')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedFilter === 'unassigned' ? '#64748b' : '#f8fafc',
                  color: selectedFilter === 'unassigned' ? '#ffffff' : '#334155',
                }}
              >
                ⚪ Unassigned (3)
              </button>

              <button
                onClick={() => setSelectedFilter('maintenance')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid #fca5a5',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedFilter === 'maintenance' ? '#ef4444' : '#fef2f2',
                  color: selectedFilter === 'maintenance' ? '#ffffff' : '#991b1b',
                }}
              >
                🔴 Workshop (1)
              </button>
            </div>
          </div>
        </div>

        {/* Search Warning Toast Banner */}
        {hasNoResults && (
          <div
            style={{
              padding: '0.6rem 1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>⚠️ No matching vehicle, order ID, driver, or location found for "{searchQuery}". Try searching "KA-01", "ORD-8942", or "Malleshwaram".</span>
            <button onClick={() => setHasNoResults(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Map & Detail Side Panel Layout */}
        <div style={{ flex: 1, display: 'flex', gap: '1rem', position: 'relative', overflow: 'hidden' }}>

          {/* Leaflet Map */}
          <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative' }}>
            <MapContainer center={defaultCenter} zoom={12} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapClickHandler onMapClick={() => setSelectedVehicle(null)} />
              <MapFlyToHandler targetLocation={flyToTarget} />

              {/* Render Polylines for Active Vehicles */}
              {filteredVehicles.map((v) => (
                v.routePolyline && (
                  <Polyline
                    key={`poly-${v.id}`}
                    positions={v.routePolyline}
                    color={v.status === 'delayed' ? '#f59e0b' : '#2563eb'}
                    weight={4}
                    dashArray={v.status === 'delayed' ? '6, 6' : undefined}
                    opacity={0.85}
                  />
                )
              ))}

              {/* Render Markers */}
              {filteredVehicles.map((v) => (
                <Marker
                  key={v.id}
                  position={[v.currentLat, v.currentLng]}
                  icon={icons[v.status]}
                  eventHandlers={{
                    click: () => {
                      setSelectedVehicle(v);
                      setFlyToTarget([v.currentLat, v.currentLng]);
                    },
                  }}
                />
              ))}
            </MapContainer>
          </div>

          {/* Vehicle Inspection Side Panel */}
          {selectedVehicle ? (
            <div
              className="card"
              style={{
                width: '350px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Vehicle Inspector
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                    {selectedVehicle.plateNo}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor:
                      selectedVehicle.status === 'on_time'
                        ? '#d1fae5'
                        : selectedVehicle.status === 'delayed'
                        ? '#fef3c7'
                        : selectedVehicle.status === 'unassigned'
                        ? '#f1f5f9'
                        : '#fee2e2',
                    color:
                      selectedVehicle.status === 'on_time'
                        ? '#065f46'
                        : selectedVehicle.status === 'delayed'
                        ? '#92400e'
                        : selectedVehicle.status === 'unassigned'
                        ? '#334155'
                        : '#991b1b',
                  }}
                >
                  {selectedVehicle.status === 'on_time'
                    ? '🟢 On Time'
                    : selectedVehicle.status === 'delayed'
                    ? '🟡 Delayed'
                    : selectedVehicle.status === 'unassigned'
                    ? '⚪ Unassigned / Standby'
                    : '🔴 Under Maintenance'}
                </span>
              </div>

              {/* Vehicle Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.875rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ASSIGNED DRIVER</span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedVehicle.driverName}</strong>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>CURRENT ASSIGNED ORDER</span>
                  {selectedVehicle.status === 'unassigned' ? (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No active order — Available for assignment
                    </span>
                  ) : (
                    <strong style={{ color: 'var(--accent-blue)' }}>{selectedVehicle.currentOrder}</strong>
                  )}
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>LAST KNOWN LOCATION / DESTINATION</span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedVehicle.nextStop}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    Zone: {selectedVehicle.locationName}
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ESTIMATED TIME OF ARRIVAL (ETA)</span>
                  <strong style={{ color: selectedVehicle.status === 'delayed' ? '#dc2626' : 'var(--text-main)' }}>
                    {selectedVehicle.eta}
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>SPEED</span>
                    <strong>{selectedVehicle.speed}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>CUMULATIVE KM</span>
                    <strong>{selectedVehicle.batteryMileage}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                width: '350px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                padding: '2rem',
              }}
            >
              Click any vehicle marker or use the search bar above to pan & inspect fleet telemetry.
            </div>
          )}

        </div>

      </div>
    </ManagerLayout>
  );
};
