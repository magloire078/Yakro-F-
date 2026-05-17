import { describe, it, expect } from 'vitest';
import { canTransitionOrder } from './order-transitions';

describe('canTransitionOrder', () => {
  describe('restaurateur', () => {
    it('accepts Placée → En Préparation', () => {
      expect(canTransitionOrder('Placée', 'En Préparation', 'restaurateur')).toBe(true);
    });

    it('accepts En Préparation → Prête', () => {
      expect(canTransitionOrder('En Préparation', 'Prête', 'restaurateur')).toBe(true);
    });

    it('rejects every other transition', () => {
      expect(canTransitionOrder('Placée', 'En Route', 'restaurateur')).toBe(false);
      expect(canTransitionOrder('Placée', 'Prête', 'restaurateur')).toBe(false);
      expect(canTransitionOrder('En Préparation', 'Livrée', 'restaurateur')).toBe(false);
      expect(canTransitionOrder('Prête', 'En Route', 'restaurateur')).toBe(false);
      expect(canTransitionOrder('En Route', 'Livrée', 'restaurateur')).toBe(false);
    });
  });

  describe('livreur', () => {
    it('accepts Placée → En Route (fallback when restaurateur absent)', () => {
      expect(canTransitionOrder('Placée', 'En Route', 'livreur')).toBe(true);
    });

    it('accepts En Préparation → En Route', () => {
      expect(canTransitionOrder('En Préparation', 'En Route', 'livreur')).toBe(true);
    });

    it('accepts Prête → En Route (nominal handoff)', () => {
      expect(canTransitionOrder('Prête', 'En Route', 'livreur')).toBe(true);
    });

    it('accepts En Route → Livrée', () => {
      expect(canTransitionOrder('En Route', 'Livrée', 'livreur')).toBe(true);
    });

    it('rejects skipping straight to Livrée', () => {
      expect(canTransitionOrder('Placée', 'Livrée', 'livreur')).toBe(false);
      expect(canTransitionOrder('En Préparation', 'Livrée', 'livreur')).toBe(false);
      expect(canTransitionOrder('Prête', 'Livrée', 'livreur')).toBe(false);
    });

    it('rejects accepting orders (Placée → En Préparation)', () => {
      expect(canTransitionOrder('Placée', 'En Préparation', 'livreur')).toBe(false);
    });
  });

  describe('client', () => {
    it('accepts Placée → Annulée (client cancellation)', () => {
      expect(canTransitionOrder('Placée', 'Annulée', 'client')).toBe(true);
    });

    it('rejects cancellation once cooking has started', () => {
      expect(canTransitionOrder('En Préparation', 'Annulée', 'client')).toBe(false);
    });
  });

  describe('superadmin', () => {
    it('can move between any two distinct statuses', () => {
      expect(canTransitionOrder('Placée', 'Annulée', 'superadmin')).toBe(true);
      expect(canTransitionOrder('Livrée', 'Placée', 'superadmin')).toBe(true);
    });

    it('still rejects no-op transitions', () => {
      expect(canTransitionOrder('Placée', 'Placée', 'superadmin')).toBe(false);
    });
  });

  it('rejects identical statuses for non-admin roles', () => {
    expect(canTransitionOrder('En Route', 'En Route', 'livreur')).toBe(false);
  });
});
