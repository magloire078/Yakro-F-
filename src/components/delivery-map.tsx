'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface DeliveryMapProps {
  restaurant?: Coordinates & { name?: string };
  client?: Coordinates & { name?: string };
  livreur?: Coordinates & { name?: string };
  className?: string;
}

const buildIcon = (color: string, label: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="18" r="9" fill="white"/>
      <text x="18" y="22" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${color}">${label}</text>
    </svg>`;
  return L.divIcon({
    className: 'delivery-map-marker',
    html: svg,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -42],
  });
};

const restaurantIcon = buildIcon('#dc2626', 'R');
const livreurIcon = buildIcon('#2563eb', 'L');
const clientIcon = buildIcon('#16a34a', 'C');

export function DeliveryMap({ restaurant, client, livreur, className }: DeliveryMapProps) {
  const points: [number, number][] = [];
  if (restaurant) points.push([restaurant.latitude, restaurant.longitude]);
  if (livreur) points.push([livreur.latitude, livreur.longitude]);
  if (client) points.push([client.latitude, client.longitude]);

  if (points.length === 0) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
        Aucune position disponible.
      </div>
    );
  }

  const center: [number, number] = points.reduce(
    (acc, p) => [acc[0] + p[0] / points.length, acc[1] + p[1] / points.length],
    [0, 0] as [number, number]
  );

  const bounds = points.length > 1 ? L.latLngBounds(points) : undefined;

  return (
    <MapContainer
      center={center}
      zoom={14}
      bounds={bounds}
      boundsOptions={{ padding: [40, 40] }}
      scrollWheelZoom={false}
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {restaurant && (
        <Marker position={[restaurant.latitude, restaurant.longitude]} icon={restaurantIcon}>
          <Popup>{restaurant.name || 'Restaurant'}</Popup>
        </Marker>
      )}
      {livreur && (
        <Marker position={[livreur.latitude, livreur.longitude]} icon={livreurIcon}>
          <Popup>{livreur.name || 'Livreur'} (en mouvement)</Popup>
        </Marker>
      )}
      {client && (
        <Marker position={[client.latitude, client.longitude]} icon={clientIcon}>
          <Popup>{client.name || 'Adresse de livraison'}</Popup>
        </Marker>
      )}
      {points.length > 1 && (
        <Polyline positions={points} pathOptions={{ color: '#2563eb', weight: 3, dashArray: '6 8', opacity: 0.7 }} />
      )}
    </MapContainer>
  );
}
