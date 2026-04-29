import type { SavedAddress, UserProfile } from './types';

/**
 * Reconstruit la liste effective d'adresses :
 * - profile.adresses si défini
 * - sinon, fallback sur adresseParDefaut (rétrocompat)
 */
export const getUserAddresses = (profile: UserProfile | null): SavedAddress[] => {
  if (!profile) return [];
  if (profile.adresses && profile.adresses.length > 0) {
    return profile.adresses;
  }
  if (profile.adresseParDefaut) {
    return [
      {
        id: 'legacy',
        libelle: 'Adresse principale',
        adresse: profile.adresseParDefaut,
        latitude: profile.latitude,
        longitude: profile.longitude,
        parDefaut: true,
      },
    ];
  }
  return [];
};

export const getDefaultAddress = (profile: UserProfile | null): SavedAddress | null => {
  const addresses = getUserAddresses(profile);
  if (addresses.length === 0) return null;
  return addresses.find(a => a.parDefaut) ?? addresses[0];
};

export const generateAddressId = (): string => {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

/** Garantit qu'une seule adresse est marquée par défaut. */
export const normalizeAddresses = (addresses: SavedAddress[]): SavedAddress[] => {
  if (addresses.length === 0) return [];
  const hasDefault = addresses.some(a => a.parDefaut);
  return addresses.map((a, i) => ({
    ...a,
    parDefaut: hasDefault ? !!a.parDefaut : i === 0,
  }));
};
