import { describe, expect, it } from 'vitest';
import {
  ORDER_TRACKING_STEPS,
  getOrderStepIndex,
  getStatusHeadline,
  isOrderCancellableByClient,
} from './order-status-info';

describe('order-status-info', () => {
  it('contient les 5 étapes standards dans le bon ordre chronologique', () => {
    expect(ORDER_TRACKING_STEPS).toHaveLength(5);
    expect(ORDER_TRACKING_STEPS.map((s) => s.status)).toEqual([
      'Placée',
      'En Préparation',
      'Prête',
      'En Route',
      'Livrée',
    ]);
  });

  it('calcule correctement les index d’étapes', () => {
    expect(getOrderStepIndex('Placée')).toBe(0);
    expect(getOrderStepIndex('En Préparation')).toBe(1);
    expect(getOrderStepIndex('Prête')).toBe(2);
    expect(getOrderStepIndex('En Route')).toBe(3);
    expect(getOrderStepIndex('Livrée')).toBe(4);
    expect(getOrderStepIndex('Annulée')).toBe(-1);
  });

  it('autorise l’annulation client uniquement lorsque la commande est Placée', () => {
    expect(isOrderCancellableByClient({ statut: 'Placée' })).toBe(true);
    expect(isOrderCancellableByClient({ statut: 'En Préparation' })).toBe(false);
    expect(isOrderCancellableByClient({ statut: 'Prête' })).toBe(false);
    expect(isOrderCancellableByClient({ statut: 'En Route' })).toBe(false);
    expect(isOrderCancellableByClient({ statut: 'Livrée' })).toBe(false);
    expect(isOrderCancellableByClient({ statut: 'Annulée' })).toBe(false);
  });

  it('fournit des titres et sous-titres contextuels pour chaque statut', () => {
    const statuses = ['Placée', 'En Préparation', 'Prête', 'En Route', 'Livrée', 'Annulée'] as const;
    statuses.forEach((st) => {
      const headline = getStatusHeadline(st);
      expect(headline.title).toBeTruthy();
      expect(headline.subtitle).toBeTruthy();
      expect(headline.accentColor).toBeTruthy();
    });
  });
});
