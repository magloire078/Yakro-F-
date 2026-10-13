'use client';

import * as React from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Store, UtensilsCrossed } from 'lucide-react';
import { resolveFoodImageSource } from '@/lib/food-image';
import { cn } from '@/lib/utils';

interface FoodImageProps {
    src?: string | null;
    alt: string;
    /** Choisit l'icône du visuel de remplacement. */
    kind: 'plat' | 'restaurant';
    sizes?: string;
    priority?: boolean;
    /** Classes appliquées à l'image (ex. effet de zoom au survol). */
    className?: string;
}

/**
 * Photo de plat ou de restaurant. Remplit son parent, qui doit être en
 * `position: relative` avec une taille définie.
 *
 * Sans photo exploitable, ou si elle ne se charge pas (lien cassé, image
 * supprimée), affiche un visuel de marque plutôt qu'une image cassée ou
 * une photo aléatoire sans rapport.
 */
export function FoodImage({ src, alt, kind, sizes = '(max-width: 640px) 50vw, 33vw', priority, className }: FoodImageProps) {
    const source = resolveFoodImageSource(src);
    const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
    const imageClassName = cn('object-cover', className);
    const handleError = () => setFailedSrc(source?.src ?? null);

    if (!source || failedSrc === source.src) {
        const Icon = kind === 'restaurant' ? Store : UtensilsCrossed;
        return (
            <div
                role="img"
                aria-label={alt}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-emerald-50 dark:from-orange-950/50 dark:via-slate-900 dark:to-emerald-950/40"
            >
                <Icon className="h-1/4 w-1/4 max-h-16 max-w-16 min-h-6 min-w-6 text-orange-400/70 dark:text-orange-500/50" strokeWidth={1.5} />
            </div>
        );
    }

    if (source.type === 'cloudinary') {
        return (
            <CldImage
                src={source.src}
                alt={alt}
                fill
                crop="fill"
                gravity="auto"
                sizes={sizes}
                priority={priority}
                className={imageClassName}
                onError={handleError}
            />
        );
    }

    return (
        <Image
            src={source.src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            unoptimized={source.type === 'unoptimized'}
            className={imageClassName}
            onError={handleError}
        />
    );
}
