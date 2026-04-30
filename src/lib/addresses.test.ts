import { describe, expect, it } from 'vitest';
import {
  generateAddressId,
  getDefaultAddress,
  getUserAddresses,
  normalizeAddresses,
} from './addresses';
import type { SavedAddress, UserProfile } from './types';

const buildProfile = (over: Partial<UserProfile> = {}): UserProfile => ({
  uid: 'u1',
  email: 'a@b.c',
  dateCreation: null,
  role: 'client',
  ...over,
});

describe('getUserAddresses', () => {
  it('renvoie [] si profil null', () => {
    expect(getUserAddresses(null)).toEqual([]);
  });

  it('renvoie le tableau adresses si présent', () => {
    const list: SavedAddress[] = [
      { id: 'a1', libelle: 'Maison', adresse: 'Yamoussoukro' },
    ];
    expect(getUserAddresses(buildProfile({ adresses: list }))).toEqual(list);
  });

  it('fallback sur adresseParDefaut (rétrocompat)', () => {
    const result = getUserAddresses(buildProfile({ adresseParDefaut: 'Quartier Lacs' }));
    expect(result).toHaveLength(1);
    expect(result[0].libelle).toBe('Adresse principale');
    expect(result[0].adresse).toBe('Quartier Lacs');
    expect(result[0].parDefaut).toBe(true);
  });

  it('renvoie [] si aucune source', () => {
    expect(getUserAddresses(buildProfile())).toEqual([]);
  });
});

describe('getDefaultAddress', () => {
  it('null si aucune adresse', () => {
    expect(getDefaultAddress(null)).toBeNull();
    expect(getDefaultAddress(buildProfile())).toBeNull();
  });

  it('renvoie celle marquée parDefaut', () => {
    const list: SavedAddress[] = [
      { id: 'a1', libelle: 'Maison', adresse: 'A1' },
      { id: 'a2', libelle: 'Travail', adresse: 'A2', parDefaut: true },
    ];
    expect(getDefaultAddress(buildProfile({ adresses: list }))?.id).toBe('a2');
  });

  it('fallback sur la première si aucune marquée', () => {
    const list: SavedAddress[] = [
      { id: 'a1', libelle: 'Maison', adresse: 'A1' },
      { id: 'a2', libelle: 'Travail', adresse: 'A2' },
    ];
    expect(getDefaultAddress(buildProfile({ adresses: list }))?.id).toBe('a1');
  });
});

describe('normalizeAddresses', () => {
  it('ne change rien si une adresse est déjà par défaut', () => {
    const list: SavedAddress[] = [
      { id: 'a1', libelle: 'Maison', adresse: 'A1', parDefaut: true },
      { id: 'a2', libelle: 'Travail', adresse: 'A2' },
    ];
    const result = normalizeAddresses(list);
    expect(result[0].parDefaut).toBe(true);
    expect(result[1].parDefaut).toBe(false);
  });

  it('marque la première par défaut si aucune ne l\'est', () => {
    const list: SavedAddress[] = [
      { id: 'a1', libelle: 'Maison', adresse: 'A1' },
      { id: 'a2', libelle: 'Travail', adresse: 'A2' },
    ];
    const result = normalizeAddresses(list);
    expect(result[0].parDefaut).toBe(true);
    expect(result[1].parDefaut).toBe(false);
  });

  it('renvoie [] sur une liste vide', () => {
    expect(normalizeAddresses([])).toEqual([]);
  });
});

describe('generateAddressId', () => {
  it('produit un ID préfixé "addr-"', () => {
    expect(generateAddressId()).toMatch(/^addr-\d+-[a-z0-9]{6}$/);
  });

  it('est unique d\'un appel à l\'autre', () => {
    expect(generateAddressId()).not.toBe(generateAddressId());
  });
});
