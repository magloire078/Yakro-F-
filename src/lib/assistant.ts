import type { MenuItem, Restaurant } from './types';
import type { AssistantMenuItem } from '@/ai/flows/assistant-flow';

/**
 * Aplati le catalogue (plats + restaurants) dans la forme attendue par
 * l'Assistant YakroFe, en excluant les restaurants suspendus — inutile de
 * suggérer un établissement fermé.
 */
export function buildAssistantCatalog(menuItems: MenuItem[], restaurants: Restaurant[]): AssistantMenuItem[] {
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));

  return menuItems.reduce<AssistantMenuItem[]>((catalog, item) => {
    const restaurant = restaurantById.get(item.restaurantId);
    if (!restaurant || restaurant.suspendu) return catalog;

    catalog.push({
      id: item.id,
      nom: item.nom,
      description: item.description,
      prix: item.prix,
      restaurantId: restaurant.id,
      nomRestaurant: restaurant.nom,
      cuisine: restaurant.cuisine,
      tempsDeLivraison: restaurant.tempsDeLivraison,
      fraisDeLivraison: restaurant.fraisDeLivraison,
      ...(restaurant.adresse && { adresseRestaurant: restaurant.adresse }),
    });
    return catalog;
  }, []);
}
