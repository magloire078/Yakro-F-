import { describe, expect, it } from 'vitest';
import {
  buildShareMessage,
  canUseFilleulDiscount,
  generateReferralCode,
  isValidReferralCodeFormat,
  normalizeReferralCode,
  FILLEUL_DISCOUNT_FCFA,
  PARRAIN_BONUS_POINTS,
} from './referrals';
import type { UserProfile } from './types';

const buildProfile = (over: Partial<UserProfile> = {}): UserProfile => ({
  uid: 'u1',
  email: 'a@b.c',
  dateCreation: null,
  role: 'client',
  ...over,
});

describe('generateReferralCode', () => {
  it('produit le format YAK-XXXX-XXXX', () => {
    const code = generateReferralCode('abc123', 'Aïcha');
    expect(code).toMatch(/^YAK-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('est déterministe pour un même UID', () => {
    expect(generateReferralCode('uid-1', 'Aïcha')).toBe(generateReferralCode('uid-1', 'Aïcha'));
  });

  it('change si le UID change (pas le nom)', () => {
    expect(generateReferralCode('a', 'Bob')).not.toBe(generateReferralCode('b', 'Bob'));
  });

  it('reste stable même si le nom est vide', () => {
    expect(generateReferralCode('uid-x')).toMatch(/^YAK-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('strip caractères spéciaux du nom', () => {
    const code = generateReferralCode('uid-test', 'Aicha-K!');
    // 'AichaK' → 'AICHA' tronqué à 4 → 'AICH'
    expect(code).toContain('AICH');
  });

  it('drop les caractères non-ASCII (accents) du nom', () => {
    const code = generateReferralCode('uid-test', 'Aïcha');
    // 'Acha' (le ï est filtré par la regex ASCII), tronqué à 4
    expect(code).toContain('ACHA');
  });
});

describe('isValidReferralCodeFormat', () => {
  it('accepte le format canonique', () => {
    expect(isValidReferralCodeFormat('YAK-AICH-2K9X')).toBe(true);
  });

  it('rejette les formats invalides', () => {
    expect(isValidReferralCodeFormat('PAS-VALIDE')).toBe(false);
    expect(isValidReferralCodeFormat('YAK-AICH')).toBe(false);
    expect(isValidReferralCodeFormat('yak-aich-2k9x')).toBe(true); // normalisé en majuscules
    expect(isValidReferralCodeFormat('YAK-AICH-2K9!')).toBe(false);
  });
});

describe('normalizeReferralCode', () => {
  it('majuscule et trim', () => {
    expect(normalizeReferralCode('  yak-abcd-1234  ')).toBe('YAK-ABCD-1234');
  });
});

describe('canUseFilleulDiscount', () => {
  it('false si profil null', () => {
    expect(canUseFilleulDiscount(null, false)).toBe(false);
  });

  it('false si pas de parraineParCode', () => {
    expect(canUseFilleulDiscount(buildProfile(), false)).toBe(false);
  });

  it('false si bonus déjà utilisé', () => {
    expect(canUseFilleulDiscount(buildProfile({ parraineParCode: 'YAK-XXXX-XXXX', bonusParrainageUtilise: true }), false)).toBe(false);
  });

  it('false si auto-parrainage', () => {
    expect(canUseFilleulDiscount(buildProfile({ codeParrainage: 'YAK-MOI-1234', parraineParCode: 'YAK-MOI-1234' }), false)).toBe(false);
  });

  it('false si déjà des commandes livrées', () => {
    expect(canUseFilleulDiscount(buildProfile({ parraineParCode: 'YAK-XXXX-XXXX' }), true)).toBe(false);
  });

  it('true sinon', () => {
    expect(canUseFilleulDiscount(buildProfile({ parraineParCode: 'YAK-AICH-2K9X' }), false)).toBe(true);
  });
});

describe('buildShareMessage', () => {
  it('inclut le code et le montant', () => {
    const msg = buildShareMessage('YAK-TEST-XXXX');
    expect(msg).toContain('YAK-TEST-XXXX');
    expect(msg).toContain(FILLEUL_DISCOUNT_FCFA.toLocaleString('fr-FR'));
  });
});

describe('constantes', () => {
  it('montant filleul = 1000, bonus parrain = 500', () => {
    expect(FILLEUL_DISCOUNT_FCFA).toBe(1000);
    expect(PARRAIN_BONUS_POINTS).toBe(500);
  });
});
