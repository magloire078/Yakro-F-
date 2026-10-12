'use client';

import 'leaflet/dist/leaflet.css';
import * as React from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { useTheme } from 'next-themes';
import { LocateFixed } from 'lucide-react';
import { YAKRO_DEFAULT_COORDS } from '@/lib/geolocation';
import type { MapMarker, MapMarkerKind, MapRoute } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface LiveMapProps {
    markers: MapMarker[];
    routes?: MapRoute[];
    className?: string;
    /** Affiche la légende (nombre de points par type). */
    showLegend?: boolean;
    /** Zoom utilisé quand un seul point est affiché. */
    singlePointZoom?: number;
}

// Tuiles CARTO (données © OpenStreetMap) : gratuites, sans clé, avec une
// variante sombre assortie au thème de l'app.
const TILES = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const ICON_PATHS: Record<MapMarkerKind, string> = {
    // lucide « utensils »
    restaurant:
        '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    // lucide « bike »
    livreur:
        '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    // lucide « user »
    client: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};

const KIND_STYLES: Record<MapMarkerKind, { bg: string; ring: string; label: string }> = {
    restaurant: { bg: 'bg-orange-500', ring: 'bg-orange-500/40', label: 'Restaurants' },
    livreur: { bg: 'bg-emerald-500', ring: 'bg-emerald-500/40', label: 'Livreurs' },
    client: { bg: 'bg-sky-500', ring: 'bg-sky-500/40', label: 'Clients' },
};

const iconCache = new Map<string, L.DivIcon>();

function markerIcon(kind: MapMarkerKind, live: boolean): L.DivIcon {
    const cacheKey = `${kind}-${live}`;
    const cached = iconCache.get(cacheKey);
    if (cached) return cached;
    const style = KIND_STYLES[kind];
    const pulse = live
        ? `<span class="absolute inset-0 rounded-full ${style.ring} animate-ping"></span>`
        : '';
    const icon = L.divIcon({
        className: 'yakro-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
        html: `<div class="relative h-9 w-9">${pulse}<div class="relative flex h-9 w-9 items-center justify-center rounded-full ${style.bg} text-white shadow-lg ring-2 ring-white dark:ring-slate-900"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[kind]}</svg></div></div>`,
    });
    iconCache.set(cacheKey, icon);
    return icon;
}

/**
 * Cadre la carte sur l'ensemble des points quand la liste des points change
 * (ajout/retrait), mais pas à chaque déplacement : l'utilisateur garde la
 * main sur le zoom pendant le suivi en direct.
 */
function FitToMarkers({ markers, singlePointZoom, recenterSignal }: { markers: MapMarker[]; singlePointZoom: number; recenterSignal: number }) {
    const map = useMap();
    const idsKey = markers.map((m) => m.id).sort().join('|');
    const markersRef = React.useRef(markers);
    markersRef.current = markers;

    React.useEffect(() => {
        const current = markersRef.current;
        if (current.length === 0) {
            map.setView([YAKRO_DEFAULT_COORDS.latitude, YAKRO_DEFAULT_COORDS.longitude], 13);
            return;
        }
        if (current.length === 1) {
            map.setView([current[0].latitude, current[0].longitude], singlePointZoom);
            return;
        }
        const bounds = L.latLngBounds(current.map((m) => [m.latitude, m.longitude] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }, [map, idsKey, singlePointZoom, recenterSignal]);

    return null;
}

export default function LiveMapInner({ markers, routes = [], className, showLegend = true, singlePointZoom = 15 }: LiveMapProps) {
    const { resolvedTheme } = useTheme();
    const [recenterSignal, setRecenterSignal] = React.useState(0);
    const tiles = resolvedTheme === 'dark' ? TILES.dark : TILES.light;

    const counts = React.useMemo(() => {
        const result: Record<MapMarkerKind, number> = { restaurant: 0, livreur: 0, client: 0 };
        markers.forEach((m) => { result[m.kind] += 1; });
        return result;
    }, [markers]);

    return (
        <div className={cn('relative isolate z-0 overflow-hidden', className)}>
            <MapContainer
                center={[YAKRO_DEFAULT_COORDS.latitude, YAKRO_DEFAULT_COORDS.longitude]}
                zoom={13}
                scrollWheelZoom
                className="h-full w-full bg-muted"
            >
                <TileLayer key={tiles} url={tiles} attribution={ATTRIBUTION} />
                <FitToMarkers markers={markers} singlePointZoom={singlePointZoom} recenterSignal={recenterSignal} />

                {routes.map((route) => (
                    <Polyline
                        key={route.id}
                        positions={route.points}
                        pathOptions={{
                            color: route.status === 'active' ? '#10b981' : '#f97316',
                            weight: route.status === 'active' ? 4 : 3,
                            opacity: 0.85,
                            dashArray: route.status === 'active' ? undefined : '6 8',
                        }}
                    />
                ))}

                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={[marker.latitude, marker.longitude]}
                        icon={markerIcon(marker.kind, !!marker.live)}
                    >
                        <Popup>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {KIND_STYLES[marker.kind].label.slice(0, -1)}
                                    {marker.live ? ' · en direct' : ''}
                                </p>
                                <p className="text-sm font-bold">{marker.label}</p>
                                {marker.sublabel && <p className="text-xs text-muted-foreground">{marker.sublabel}</p>}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {showLegend && (
                <div className="pointer-events-none absolute left-3 top-3 z-[400] flex flex-wrap gap-1.5">
                    {(Object.keys(KIND_STYLES) as MapMarkerKind[])
                        .filter((kind) => counts[kind] > 0)
                        .map((kind) => (
                            <span
                                key={kind}
                                className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground shadow-md backdrop-blur-md"
                            >
                                <span className={cn('h-2 w-2 rounded-full', KIND_STYLES[kind].bg)} />
                                {counts[kind]} {KIND_STYLES[kind].label}
                            </span>
                        ))}
                </div>
            )}

            <button
                type="button"
                onClick={() => setRecenterSignal((n) => n + 1)}
                aria-label="Recentrer la carte"
                className="absolute bottom-6 right-3 z-[400] flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/90 text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-primary hover:text-white"
            >
                <LocateFixed className="h-5 w-5" />
            </button>
        </div>
    );
}
