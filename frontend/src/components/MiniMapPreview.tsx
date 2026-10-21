import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create SVG colored markers for mini map preview with live radar pulse
const createMiniMarker = (color: string, letter: string, isLive: boolean = false) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 44" width="34" height="44">
      <defs>
        <filter id="m-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(43,36,30,0.35)"/>
        </filter>
      </defs>
      ${isLive ? `<circle cx="17" cy="17" r="15" fill="none" stroke="${color}" stroke-width="2.2" opacity="0.6">
        <animate attributeName="r" values="12;22;26" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0.3;0" dur="2s" repeatCount="indefinite"/>
      </circle>` : ''}
      <path fill="${color}" stroke="#FAF7F2" stroke-width="2.2" filter="url(#m-shadow)" d="M17 2C9.27 2 3 8.27 3 16c0 10.5 14 24 14 24s14-13.5 14-24c0-7.73-6.27-14-14-14z"/>
      <circle cx="17" cy="16" r="6" fill="#FAF7F2"/>
      <text x="17" y="19.5" font-size="9" font-weight="800" fill="${color}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">${letter}</text>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-mini-marker',
    html: svg,
    iconSize: [34, 44],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
  });
};

const markerIcons = {
  on_route: createMiniMarker('#4A5D3A', '1', true),
  delayed: createMiniMarker('#B86F28', '2', true),
  idle: createMiniMarker('#6E665C', '3', false),
};

const routePaths: Record<string, [number, number][]> = {
  v1: [
    [12.9716, 77.5946],
    [12.9730, 77.5970],
    [12.9750, 77.6010],
    [12.9780, 77.6050],
    [12.9800, 77.6080],
  ],
  v2: [
    [12.9352, 77.6245],
    [12.9330, 77.6270],
    [12.9300, 77.6310],
    [12.9280, 77.6350],
  ],
};

export const MiniMapPreview: React.FC = () => {
  const center: [number, number] = [12.9550, 77.6050];

  // Animated vehicle progress interpolation (0 to 1)
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 1 ? 0 : prev + 0.04));
    }, 400);
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

  const v1Pos = getInterpolatedPoint(routePaths.v1, progress);
  const v2Pos = getInterpolatedPoint(routePaths.v2, (progress + 0.3) % 1);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '320px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Animated Polyline Paths with Moving Dashes in Olive & Amber */}
        <Polyline
          positions={routePaths.v1}
          pathOptions={{ color: '#4A5D3A', weight: 4, opacity: 0.85, dashArray: '6, 8', className: 'anim-route-polyline' }}
        />
        <Polyline
          positions={routePaths.v2}
          pathOptions={{ color: '#B86F28', weight: 4, opacity: 0.85, dashArray: '6, 8', className: 'anim-route-polyline' }}
        />

        {/* Real-time Moving Vehicle Markers */}
        <Marker position={v1Pos} icon={markerIcons.on_route}>
          <Popup>
            <div style={{ padding: '0.2rem', fontFamily: 'var(--font-sans)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#201A16' }}>KA-01-EA-1024</div>
              <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                Driver: <strong>Rahul Sharma</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                Order: <span className="font-mono" style={{ color: '#4A5D3A', fontWeight: 700 }}>ORD-8945</span>
              </div>
              <div style={{ marginTop: '0.35rem' }}>
                <span className="status-badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                  <span className="live-pulse-dot" /> En Route (38 km/h)
                </span>
              </div>
            </div>
          </Popup>
        </Marker>

        <Marker position={v2Pos} icon={markerIcons.delayed}>
          <Popup>
            <div style={{ padding: '0.2rem', fontFamily: 'var(--font-sans)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#201A16' }}>KA-01-GB-5091</div>
              <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                Driver: <strong>Priya Nair</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                Order: <span className="font-mono" style={{ color: '#B86F28', fontWeight: 700 }}>ORD-8942</span>
              </div>
              <div style={{ marginTop: '0.35rem' }}>
                <span className="status-badge badge-amber" style={{ fontSize: '0.68rem' }}>
                  ⚠ Traffic Delay (12 km/h)
                </span>
              </div>
            </div>
          </Popup>
        </Marker>

        <Marker position={[12.9250, 77.5897]} icon={markerIcons.idle}>
          <Popup>
            <div style={{ padding: '0.2rem', fontFamily: 'var(--font-sans)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#201A16' }}>KA-05-MC-8812</div>
              <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                Driver: <strong>Amit Patel</strong>
              </div>
              <div style={{ marginTop: '0.35rem' }}>
                <span className="status-badge badge-slate" style={{ fontSize: '0.68rem' }}>
                  Standby Jayanagar Hub
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
