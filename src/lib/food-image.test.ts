import { describe, it, expect } from 'vitest';
import { resolveFoodImageSource } from './food-image';

describe('resolveFoodImageSource', () => {
    it('renvoie null quand il n’y a pas de photo exploitable', () => {
        expect(resolveFoodImageSource(undefined)).toBeNull();
        expect(resolveFoodImageSource(null)).toBeNull();
        expect(resolveFoodImageSource('')).toBeNull();
        expect(resolveFoodImageSource('   ')).toBeNull();
        expect(resolveFoodImageSource('pas une url')).toBeNull();
        expect(resolveFoodImageSource('ftp://exemple.com/a.png')).toBeNull();
    });

    it('écarte les anciennes images aléatoires picsum', () => {
        expect(resolveFoodImageSource('https://picsum.photos/seed/6/600/400')).toBeNull();
        expect(resolveFoodImageSource('https://fastly.picsum.photos/id/1/600/400.jpg')).toBeNull();
    });

    it('reconnaît les photos Cloudinary', () => {
        const src = 'https://res.cloudinary.com/demo/image/upload/v1/plats/abc.jpg';
        expect(resolveFoodImageSource(src)).toEqual({ type: 'cloudinary', src });
    });

    it('optimise les hôtes déclarés et les fichiers locaux', () => {
        expect(resolveFoodImageSource('https://firebasestorage.googleapis.com/v0/b/x/o/a.jpg')?.type).toBe('optimized');
        expect(resolveFoodImageSource('/assets/marketing/hero-food.png')?.type).toBe('optimized');
    });

    it('affiche sans optimisation les aperçus locaux et hôtes inconnus (pas de plantage next/image)', () => {
        expect(resolveFoodImageSource('data:image/png;base64,AAAA')?.type).toBe('unoptimized');
        expect(resolveFoodImageSource('blob:http://localhost/123')?.type).toBe('unoptimized');
        expect(resolveFoodImageSource('https://image.pollinations.ai/prompt/attieke')?.type).toBe('unoptimized');
    });
});
