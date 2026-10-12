'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';
import type { LiveMapProps } from './live-map-inner';

export type { LiveMapProps };

/**
 * Carte temps réel (Leaflet + OpenStreetMap). Leaflet manipule `window` dès
 * l'import : le composant n'est donc chargé que côté navigateur.
 */
export const LiveMap = dynamic(() => import('./live-map-inner'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center bg-muted/40">
            <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
    ),
});
