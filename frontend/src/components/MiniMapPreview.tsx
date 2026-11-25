import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

export interface MiniMapVehicle {
  id: number;
  plate_no: string;
  model: string | null;
  capacity_kg: number;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  mileage_km: number;
}

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
  on_route: createMiniMarker('#4A5D3A', '✓', true),
  maintenance: createMiniMarker('#A83C2C', 'W', false),
  available: createMiniMarker('#6E665C', 'P', false),
};

interface MiniMapPreviewProps {
  vehicles?: MiniMapVehicle[];
}

export const MiniMapPreview: React.FC<MiniMapPreviewProps> = ({ vehicles: propVehicles }) => {
  const [vehicles, setVehicles] = useState<MiniMapVehicle[]>(propVehicles || []);

  useEffect(() => {
    if (propVehicles) {
      setVehicles(propVehicles);
    } else {
      apiClient.get<MiniMapVehicle[]>('/vehicles')
        .then((res) => setVehicles(res.data))
        .catch(() => {});
    }
  }, [propVehicles]);

  const activeVehiclesWithCoords = vehicles.filter(
    (v) => v.current_lat != null && v.current_lng != null
  );

  const center: [number, number] = activeVehiclesWithCoords.length > 0
    ? [Number(activeVehiclesWithCoords[0].current_lat), Number(activeVehiclesWithCoords[0].current_lng)]
    : [12.9716, 77.5946]; // Bengaluru default

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '320px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Real-time Vehicle Markers from GET /vehicles */}
        {activeVehiclesWithCoords.map((v) => {
          const isLive = v.status === 'on_route';
          const icon = v.status === 'on_route'
            ? markerIcons.on_route
            : v.status === 'maintenance'
            ? markerIcons.maintenance
            : markerIcons.available;

          return (
            <Marker
              key={v.id}
              position={[Number(v.current_lat), Number(v.current_lng)]}
              icon={icon}
            >
              <Popup>
                <div style={{ padding: '0.2rem', fontFamily: 'var(--font-sans)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#201A16' }}>{v.plate_no}</div>
                  <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                    Model: <strong>{v.model || 'Commercial Van'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7D7468', marginTop: '0.15rem' }}>
                    Capacity: <strong>{v.capacity_kg} kg</strong>
                  </div>
                  <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      className={`status-badge ${
                        v.status === 'on_route'
                          ? 'badge-emerald'
                          : v.status === 'maintenance'
                          ? 'badge-rose'
                          : 'badge-slate'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {isLive && <span className="live-pulse-dot" />}
                      {v.status === 'on_route' ? 'En Route' : v.status === 'maintenance' ? 'In Bay' : 'Available'}
                    </span>
                    <Link
                      to={`/manager/routes/${v.id}`}
                      style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.5rem' }}
                    >
                      Route &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
