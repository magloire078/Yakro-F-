'use client';

import 'leaflet/dist/leaflet.css';
import * as React from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { useTheme } from 'next-themes';
import { LocateFixed } from 'lucide-react';
import { YAKRO_DEFAULT_COORDS } from '@/lib/geolocation';
import { MAP_ATTRIBUTION, MAP_MAX_ZOOM, MAP_TILE_URL, mapTileClassName, MARKER_KIND_STYLES, markerIcon } from './map-shared';
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
    const isDark = resolvedTheme === 'dark';

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
                <TileLayer
                    key={isDark ? 'dark' : 'light'}
                    url={MAP_TILE_URL}
                    attribution={MAP_ATTRIBUTION}
                    maxZoom={MAP_MAX_ZOOM}
                    className={mapTileClassName(isDark)}
                />
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
                                    {MARKER_KIND_STYLES[marker.kind].label.slice(0, -1)}
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
                    {(Object.keys(MARKER_KIND_STYLES) as MapMarkerKind[])
                        .filter((kind) => counts[kind] > 0)
                        .map((kind) => (
                            <span
                                key={kind}
                                className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground shadow-md backdrop-blur-md"
                            >
                                <span className={cn('h-2 w-2 rounded-full', MARKER_KIND_STYLES[kind].bg)} />
                                {counts[kind]} {MARKER_KIND_STYLES[kind].label}
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
