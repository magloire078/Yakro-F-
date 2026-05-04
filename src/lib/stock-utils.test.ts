import { describe, it, expect } from 'vitest';
import type { Order } from './types';
import { aggregateIngredientDeductions } from './stock-utils';

const buildPlats = (overrides: Partial<Order['plats'][number]>[]) =>
  overrides as unknown as Order['plats'];

describe('aggregateIngredientDeductions', () => {
  it('returns an empty object when no plat carries ingredients', () => {
    const plats = buildPlats([{ id: 'p1', nom: 'Plat', quantite: 2 }]);
    expect(aggregateIngredientDeductions(plats)).toEqual({});
  });

  it('aggregates the same ingredient across plats and multiplies by quantity', () => {
    const plats = buildPlats([
      {
        id: 'p1',
        nom: 'Plat A',
        quantite: 2,
        ingredients: [
          { stockItemId: 's1', nom: 'Tomate', quantite: 3, unite: 'g' },
          { stockItemId: 's2', nom: 'Sel', quantite: 1, unite: 'g' },
        ],
      },
      {
        id: 'p2',
        nom: 'Plat B',
        quantite: 1,
        ingredients: [{ stockItemId: 's1', nom: 'Tomate', quantite: 4, unite: 'g' }],
      },
    ]);

    expect(aggregateIngredientDeductions(plats)).toEqual({
      s1: { nom: 'Tomate', quantite: 10 }, // 3*2 + 4*1
      s2: { nom: 'Sel', quantite: 2 }, // 1*2
    });
  });
});
