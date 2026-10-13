// Éléments communs aux cartes Leaflet. Ce module importe Leaflet (qui
// touche `window`) : il ne doit être importé que par des composants chargés
// côté navigateur (voir les wrappers `next/dynamic` de ce dossier).
import L from 'leaflet';
import type { MapMarkerKind } from '@/lib/types';

// Tuiles OpenStreetMap standard : gratuites et sans clé. (Les fonds CARTO
// utilisés auparavant exigent désormais une clé API et renvoyaient des
// tuiles barrées « API KEY REQUIRED ».) OSM n'a pas de variante sombre :
// le mode sombre est obtenu par un filtre CSS (classe yakro-tiles-dark).
export const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAP_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const MAP_MAX_ZOOM = 19;

/** Classe des tuiles selon le thème (filtre sombre en mode dark). */
export function mapTileClassName(isDark: boolean): string | undefined {
    return isDark ? 'yakro-tiles-dark' : undefined;
}

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

export const MARKER_KIND_STYLES: Record<MapMarkerKind, { bg: string; ring: string; label: string }> = {
    restaurant: { bg: 'bg-orange-500', ring: 'bg-orange-500/40', label: 'Restaurants' },
    livreur: { bg: 'bg-emerald-500', ring: 'bg-emerald-500/40', label: 'Livreurs' },
    client: { bg: 'bg-sky-500', ring: 'bg-sky-500/40', label: 'Clients' },
};

const iconCache = new Map<string, L.DivIcon>();

export function markerIcon(kind: MapMarkerKind, live: boolean): L.DivIcon {
    const cacheKey = `${kind}-${live}`;
    const cached = iconCache.get(cacheKey);
    if (cached) return cached;
    const style = MARKER_KIND_STYLES[kind];
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
