
import { doc, getDoc, writeBatch, increment, Firestore } from 'firebase/firestore';
import type { Order, StockItem } from './types';

/**
 * Déduit les ingrédients du stock lorsqu'une commande est livrée.
 * @param db Instance Firestore
 * @param order La commande livrée
 */
export async function decrementStockForOrder(db: Firestore, order: Order) {
    // On regroupe tous les ingrédients à déduire pour éviter les écritures multiples sur le même item
    const deductions: { [stockItemId: string]: { nom: string, quantite: number } } = {};

    for (const plat of order.plats) {
        if (plat.ingredients && plat.ingredients.length > 0) {
            for (const ingredient of plat.ingredients) {
                const totalQuantiteADeduire = ingredient.quantite * plat.quantite;
                if (!deductions[ingredient.stockItemId]) {
                    deductions[ingredient.stockItemId] = { nom: ingredient.nom, quantite: 0 };
                }
                deductions[ingredient.stockItemId].quantite += totalQuantiteADeduire;
            }
        }
    }

    const stockItemIds = Object.keys(deductions);
    if (stockItemIds.length === 0) {
        return;
    }

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const stockItemId of stockItemIds) {
        const stockRef = doc(db, 'stocks', stockItemId);
        const { quantite } = deductions[stockItemId];
        
        batch.update(stockRef, {
            quantite: increment(-quantite),
            derniereMiseAJour: now
        });
    }

    try {
        await batch.commit();
    } catch (error) {
        console.error(`[STOCK] ERREUR CRITIQUE lors du commit du batch:`, error);
        throw error; // On propage pour que l'appelant (server action) soit au courant
    }
}

/**
 * Vérifie si le stock est suffisant pour les plats d'une commande.
 * (Optionnel - pour validation future)
 */
export async function checkStockAvailability(db: Firestore, plats: Order['plats']): Promise<{ available: boolean; missingItems: string[] }> {
    const requirements: { [stockItemId: string]: { nom: string; quantite: number } } = {};

    for (const plat of plats) {
        if (plat.ingredients) {
            for (const ing of plat.ingredients) {
                if (!requirements[ing.stockItemId]) {
                    requirements[ing.stockItemId] = { nom: ing.nom, quantite: 0 };
                }
                requirements[ing.stockItemId].quantite += ing.quantite * plat.quantite;
            }
        }
    }

    const missingItems: string[] = [];
    const stockItemIds = Object.keys(requirements);

    for (const id of stockItemIds) {
        const stockDoc = await getDoc(doc(db, 'stocks', id));
        if (stockDoc.exists()) {
            const stockData = stockDoc.data() as StockItem;
            if (stockData.quantite < requirements[id].quantite) {
                missingItems.push(requirements[id].nom);
            }
        } else {
            missingItems.push(requirements[id].nom + " (Non trouvé)");
        }
    }

    return {
        available: missingItems.length === 0,
        missingItems
    };
}
