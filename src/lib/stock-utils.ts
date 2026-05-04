import type { Order } from './types';

export interface IngredientDeduction {
  nom: string;
  quantite: number;
}

/**
 * Pure aggregation helper: sums ingredient deductions across an order's plats.
 * Returns a map keyed by `stockItemId`. Used by the privileged delivery
 * server action to compute per-stock deltas before writing.
 */
export function aggregateIngredientDeductions(
  plats: Order['plats'],
): Record<string, IngredientDeduction> {
  const deductions: Record<string, IngredientDeduction> = {};
  for (const plat of plats) {
    if (!plat.ingredients) continue;
    for (const ing of plat.ingredients) {
      const total = ing.quantite * plat.quantite;
      if (!deductions[ing.stockItemId]) {
        deductions[ing.stockItemId] = { nom: ing.nom, quantite: 0 };
      }
      deductions[ing.stockItemId].quantite += total;
    }
  }
  return deductions;
}
