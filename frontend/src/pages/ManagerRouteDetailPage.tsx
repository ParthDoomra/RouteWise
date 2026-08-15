import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ManagerLayout } from '../components/ManagerLayout';

// Numbered Custom Marker Icon Helper
const createNumberedIcon = (num: number, isStart: boolean = false) => {
  const bg = isStart ? '#10b981' : '#2563eb';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="32" height="32">
      <circle cx="15" cy="15" r="13" fill="${bg}" stroke="#ffffff" stroke-width="2"/>
      <text x="15" y="19" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${num}</text>
    </svg>
  `;
  return L.divIcon({
    className: 'numbered-marker',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface RouteStop {
  seqNo: number;
  orderId: string;
  address: string;
  eta: string;
  status: 'completed' | 'current' | 'upcoming' | 'delayed';
  lat: number;
  lng: number;
}

const dummyStops: RouteStop[] = [
  { seqNo: 1, orderId: 'DEPOT', address: 'Indiranagar Central Hub (Depot)', eta: '09:00 AM', status: 'completed', lat: 12.9716, lng: 77.5946 },
  { seqNo: 2, orderId: 'ORD-8940', address: 'MG Road, Sector 4, #402', eta: '09:45 AM', status: 'completed', lat: 12.9750, lng: 77.6010 },
  { seqNo: 3, orderId: 'ORD-8942', address: 'Ulsoor Lake Road, #15', eta: '10:30 AM', status: 'current', lat: 12.9800, lng: 77.6080 },
  { seqNo: 4, orderId: 'ORD-8944', address: 'Koramangala 5th Block, #12', eta: '11:15 AM (Est)', status: 'delayed', lat: 12.9352, lng: 77.6245 },
  { seqNo: 5, orderId: 'ORD-8945', address: 'HSR Layout Sector 2, #88', eta: '12:00 PM (Est)', status: 'upcoming', lat: 12.9150, lng: 77.6350 },
];

export const ManagerRouteDetailPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [stops] = useState<RouteStop[]>(dummyStops);
  const [isReoptimizing, setIsReoptimizing] = useState(false);

  const routePolyline: [number, number][] = stops.map((s) => [s.lat, s.lng]);
  const center: [number, number] = [12.9550, 77.6100];

  const handleReoptimize = () => {
    setIsReoptimizing(true);
    setTimeout(() => {
      setIsReoptimizing(false);
      alert(`Route for Vehicle ${vehicleId || 'V101'} re-optimized using 2-opt heuristic algorithm!\nTotal distance reduced by 1.8 km.`);
    }, 1200);
  };

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Optimized Sequence Inspection
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Route Detail & Sequence — Vehicle {vehicleId || 'V101'}
            </h1>
          </div>

          <button
            onClick={handleReoptimize}
            disabled={isReoptimizing}
            style={{
              backgroundColor: isReoptimizing ? '#64748b' : 'var(--accent-blue)',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isReoptimizing ? '🔄 Running 2-opt Heuristic...' : '⚡ Trigger 2-opt Re-optimization'}
          </button>
        </div>

        {/* Summary Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div className="card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Vehicle</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>KA-01-EA-1024</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Driver: Rahul Sharma</div>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Stops</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>5 Stops (4 Deliveries)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 Completed • 1 Current</div>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Route Distance</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--accent-blue)' }}>
              24.6 km
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Haversine Nearest Neighbor + 2-opt</div>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Total Time</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>
              3 hrs 15 mins
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. completion: 12:15 PM</div>
          </div>
        </div>

        {/* Map & Stop List Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', minHeight: '500px' }}>
          
          {/* Interactive Leaflet Map for Route */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '450px' }}>
            <MapContainer center={center} zoom={12} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Polyline positions={routePolyline} color="#2563eb" weight={5} opacity={0.8} />

              {stops.map((stop) => (
                <Marker
                  key={stop.seqNo}
                  position={[stop.lat, stop.lng]}
                  icon={createNumberedIcon(stop.seqNo, stop.seqNo === 1)}
                >
                  <Popup>
                    <strong>Stop #{stop.seqNo}: {stop.orderId}</strong><br />
                    {stop.address}<br />
                    ETA: {stop.eta}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Stop-by-Stop Sequenced List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Ordered Visit Sequence
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
              {stops.map((stop) => (
                <div
                  key={stop.seqNo}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: stop.status === 'current' ? '#eff6ff' : '#f8fafc',
                    border: stop.status === 'current' ? '1px solid #bfdbfe' : '1px solid var(--border-color)',
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
                      backgroundColor: stop.seqNo === 1 ? '#10b981' : 'var(--primary-navy)',
                      color: '#fff',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      flexShrink: 0,
                    }}
                  >
                    {stop.seqNo}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                        {stop.orderId}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '10px',
                          backgroundColor:
                            stop.status === 'completed'
                              ? '#d1fae5'
                              : stop.status === 'current'
                              ? '#dbeafe'
                              : stop.status === 'delayed'
                              ? '#fef3c7'
                              : '#f1f5f9',
                          color:
                            stop.status === 'completed'
                              ? '#065f46'
                              : stop.status === 'current'
                              ? '#1e40af'
                              : stop.status === 'delayed'
                              ? '#92400e'
                              : '#475569',
                        }}
                      >
                        {stop.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {stop.address}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Scheduled ETA: <strong>{stop.eta}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </ManagerLayout>
  );
};
