'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color: 'red' | 'blue' | 'green') => {
  const colors: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
  };
  return L.divIcon({
    html: `<div style="background:${colors[color]};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
};

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  color: 'red' | 'blue' | 'green';
}

interface LeafletMapProps {
  points: MapPoint[];
  className?: string;
}

export function LeafletMap({ points, className }: LeafletMapProps) {
  const validPoints = points.filter(p => p.lat !== 0 && p.lng !== 0);

  const center: [number, number] = validPoints.length > 0
    ? [
        validPoints.reduce((s, p) => s + p.lat, 0) / validPoints.length,
        validPoints.reduce((s, p) => s + p.lng, 0) / validPoints.length,
      ]
    : [5.354, -4.005]; // Abidjan par défaut

  const zoom = validPoints.length > 1 ? 13 : 15;

  const polyline: [number, number][] = validPoints.map(p => [p.lat, p.lng]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validPoints.length > 1 && (
        <Polyline positions={polyline} color="#6366f1" weight={3} dashArray="6 4" />
      )}
      {validPoints.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]} icon={makeIcon(p.color)}>
          <Popup>{p.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
