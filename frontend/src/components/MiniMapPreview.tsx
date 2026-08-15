import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon paths in React bundle
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface VehicleMarker {
  id: string;
  plateNo: string;
  driver: string;
  status: 'on_route' | 'idle' | 'delayed';
  lat: number;
  lng: number;
}

const dummyVehicles: VehicleMarker[] = [
  { id: 'v1', plateNo: 'KA-01-EA-1024', driver: 'Rahul Sharma', status: 'on_route', lat: 12.9716, lng: 77.5946 },
  { id: 'v2', plateNo: 'KA-01-GB-5091', driver: 'Priya Nair', status: 'delayed', lat: 12.9352, lng: 77.6245 },
  { id: 'v3', plateNo: 'KA-05-MC-8812', driver: 'Amit Patel', status: 'idle', lat: 12.9250, lng: 77.5897 },
];

export const MiniMapPreview: React.FC = () => {
  const center: [number, number] = [12.9550, 77.6050];

  return (
    <div style={{ width: '100%', height: '280px', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {dummyVehicles.map((vehicle) => (
          <Marker key={vehicle.id} position={[vehicle.lat, vehicle.lng]}>
            <Popup>
              <strong>{vehicle.plateNo}</strong><br />
              Driver: {vehicle.driver}<br />
              Status: <span style={{ textTransform: 'capitalize' }}>{vehicle.status.replace('_', ' ')}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
