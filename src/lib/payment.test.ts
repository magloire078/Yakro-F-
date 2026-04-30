import { describe, expect, it } from 'vitest';
import { PAYMENT_METHODS, getPaymentMethod, validatePaymentReference } from './payment';

describe('PAYMENT_METHODS', () => {
  it('expose les 5 modes attendus', () => {
    const ids = PAYMENT_METHODS.map(m => m.id);
    expect(ids).toEqual(['especes', 'wave', 'orange-money', 'mtn-momo', 'carte']);
  });

  it('espèces : statut initial "A la livraison", non prépayé', () => {
    const cash = getPaymentMethod('especes');
    expect(cash.initialStatus).toBe('A la livraison');
    expect(cash.prepayé).toBe(false);
  });

  it('mobile money : prépayé, requiert un téléphone', () => {
    const wave = getPaymentMethod('wave');
    expect(wave.prepayé).toBe(true);
    expect(wave.needsPhone).toBe(true);
    expect(wave.needsCard).toBe(false);
  });

  it('carte : prépayé, requiert les 4 derniers chiffres', () => {
    const card = getPaymentMethod('carte');
    expect(card.prepayé).toBe(true);
    expect(card.needsPhone).toBe(false);
    expect(card.needsCard).toBe(true);
  });
});

describe('validatePaymentReference', () => {
  it('valide un téléphone Mobile Money 10 chiffres', () => {
    expect(validatePaymentReference('wave', '0701020304').ok).toBe(true);
    expect(validatePaymentReference('orange-money', '07010203').ok).toBe(true);
  });

  it('rejette téléphone trop court', () => {
    expect(validatePaymentReference('wave', '0701').ok).toBe(false);
  });

  it('rejette téléphone avec lettres', () => {
    expect(validatePaymentReference('wave', '070102ABCD').ok).toBe(false);
  });

  it('valide 4 derniers chiffres carte', () => {
    expect(validatePaymentReference('carte', '4242').ok).toBe(true);
  });

  it('rejette carte avec autre chose que 4 chiffres', () => {
    expect(validatePaymentReference('carte', '12345').ok).toBe(false);
    expect(validatePaymentReference('carte', '12A4').ok).toBe(false);
  });

  it('espèces : pas de référence requise → toujours ok', () => {
    expect(validatePaymentReference('especes', '').ok).toBe(true);
  });

  it('ignore les espaces dans le numéro Mobile Money', () => {
    expect(validatePaymentReference('wave', '07 01 02 03 04').ok).toBe(true);
    expect(validatePaymentReference('orange-money', '01\t02\t03 04').ok).toBe(true);
  });
});
