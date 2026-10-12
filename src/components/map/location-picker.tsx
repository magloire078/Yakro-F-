'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';
import type { LocationPickerProps } from './location-picker-inner';

export type { LocationPickerProps };

/** Sélecteur de position sur carte (clic ou glisser-déposer du repère), chargé côté navigateur uniquement. */
export const LocationPicker = dynamic(() => import('./location-picker-inner'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center bg-muted/40">
            <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
    ),
});
