import { describe, it, expect } from 'vitest';
import { entityImageBaseId, isSafeEntityId, publicIdFromCloudinaryUrl, selectEntityImagesToDelete } from './cloudinary-ids';

describe('publicIdFromCloudinaryUrl', () => {
    it('extrait le public_id d’une URL versionnée', () => {
        expect(publicIdFromCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/v1712/plats/abc-1712.jpg')).toBe('plats/abc-1712');
    });

    it('ignore une transformation placée avant la version', () => {
        expect(publicIdFromCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/c_fill,w_400/v1712/restaurants/r1.webp')).toBe('restaurants/r1');
    });

    it('renvoie null pour une image non Cloudinary ou invalide', () => {
        expect(publicIdFromCloudinaryUrl('https://picsum.photos/600/400')).toBeNull();
        expect(publicIdFromCloudinaryUrl('pas une url')).toBeNull();
        expect(publicIdFromCloudinaryUrl(undefined)).toBeNull();
    });
});

describe('selectEntityImagesToDelete', () => {
    const base = entityImageBaseId('plat', 'abc');

    it('sélectionne l’ancienne image et les versions horodatées', () => {
        expect(selectEntityImagesToDelete(['plats/abc', 'plats/abc-1700', 'plats/abc-1800'], base))
            .toEqual(['plats/abc', 'plats/abc-1700', 'plats/abc-1800']);
    });

    it('conserve l’image actuelle', () => {
        expect(selectEntityImagesToDelete(['plats/abc', 'plats/abc-1700', 'plats/abc-1800'], base, 'plats/abc-1800'))
            .toEqual(['plats/abc', 'plats/abc-1700']);
    });

    it('ne touche jamais aux images d’une autre entité au préfixe proche', () => {
        expect(selectEntityImagesToDelete(['plats/abcd', 'plats/abc2-1700', 'plats/abc-x'], base)).toEqual([]);
    });
});

describe('isSafeEntityId', () => {
    it('accepte un identifiant Firestore et refuse les caractères de chemin', () => {
        expect(isSafeEntityId('Xy12_ab-CD')).toBe(true);
        expect(isSafeEntityId('../restaurants')).toBe(false);
        expect(isSafeEntityId('a/b')).toBe(false);
        expect(isSafeEntityId('')).toBe(false);
    });
});
