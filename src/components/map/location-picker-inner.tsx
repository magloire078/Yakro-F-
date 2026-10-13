'use client';

import 'leaflet/dist/leaflet.css';
import * as React from 'react';
import type L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useTheme } from 'next-themes';
import { YAKRO_DEFAULT_COORDS, type GeoLocationCoords } from '@/lib/geolocation';
import { cn } from '@/lib/utils';
import { MAP_ATTRIBUTION, MAP_MAX_ZOOM, MAP_TILE_URL, mapTileClassName, markerIcon } from './map-shared';

export interface LocationPickerProps {
    value: GeoLocationCoords | null;
    onChange: (value: GeoLocationCoords) => void;
    className?: string;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

function ClickToPlace({ onChange }: { onChange: (value: GeoLocationCoords) => void }) {
    useMapEvents({
        click(event) {
            onChange({ latitude: round6(event.latlng.lat), longitude: round6(event.latlng.lng) });
        },
    });
    return null;
}

/** Recentre la carte quand la position change depuis l'extérieur (saisie, GPS). */
function FollowValue({ value }: { value: GeoLocationCoords | null }) {
    const map = useMap();
    React.useEffect(() => {
        if (!value) return;
        if (!map.getBounds().contains([value.latitude, value.longitude])) {
            map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 16));
        }
    }, [map, value]);
    return null;
}

export default function LocationPickerInner({ value, onChange, className }: LocationPickerProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const center = value ?? YAKRO_DEFAULT_COORDS;

    const markerHandlers = React.useMemo(
        () => ({
            dragend(event: L.LeafletEvent) {
                const { lat, lng } = (event.target as L.Marker).getLatLng();
                onChange({ latitude: round6(lat), longitude: round6(lng) });
            },
        }),
        [onChange],
    );

    return (
        <div className={cn('relative isolate z-0 overflow-hidden', className)}>
            <MapContainer
                center={[center.latitude, center.longitude]}
                zoom={value ? 16 : 13}
                scrollWheelZoom
                className="h-full w-full cursor-crosshair bg-muted"
            >
                <TileLayer
                    key={isDark ? 'dark' : 'light'}
                    url={MAP_TILE_URL}
                    attribution={MAP_ATTRIBUTION}
                    maxZoom={MAP_MAX_ZOOM}
                    className={mapTileClassName(isDark)}
                />
                <ClickToPlace onChange={onChange} />
                <FollowValue value={value} />
                {value && (
                    <Marker
                        position={[value.latitude, value.longitude]}
                        icon={markerIcon('restaurant', false)}
                        draggable
                        eventHandlers={markerHandlers}
                    />
                )}
            </MapContainer>
            {!value && (
                <div className="pointer-events-none absolute inset-x-3 top-3 z-[400] rounded-xl border border-border bg-card/90 px-3 py-2 text-center text-xs font-bold text-foreground shadow-md backdrop-blur-md">
                    Touchez la carte à l&apos;emplacement exact de l&apos;entrée du restaurant
                </div>
            )}
        </div>
    );
}
