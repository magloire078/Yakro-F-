import type { CartItem, MenuItem } from './types';
import { getPlaceholderImage } from './placeholder-images';

export interface PriceCartItemInput {
  menuItemId: string;
  quantite: number;
  accompagnementNom?: string;
  boissonNom?: string;
}

export type PriceCartItemResult =
  | { success: true; item: CartItem }
  | { success: false; error: string };

/**
 * Reconstruit un `CartItem` à partir du VRAI plat lu en base (prix,
 * description, options disponibles) plutôt que de faire confiance à ce que
 * le client prétend — c'est la pièce centrale qui ferme la brèche de
 * tarification : un client ne transmet plus qu'un id, une quantité et le
 * nom d'une option, jamais un prix.
 */
export function priceCartItem(input: PriceCartItemInput, menuItem: MenuItem): PriceCartItemResult {
  if (!Number.isFinite(input.quantite) || input.quantite <= 0) {
    return { success: false, error: `Quantité invalide pour ${menuItem.nom}.` };
  }

  let accompagnementSelectionne: CartItem['accompagnementSelectionne'];
  if (input.accompagnementNom) {
    accompagnementSelectionne = menuItem.accompagnementsDisponibles?.find(
      (option) => option.nom === input.accompagnementNom
    );
    if (!accompagnementSelectionne) {
      return { success: false, error: `Option "${input.accompagnementNom}" indisponible pour ${menuItem.nom}.` };
    }
  }

  let boissonSelectionnee: CartItem['boissonSelectionnee'];
  if (input.boissonNom) {
    boissonSelectionnee = menuItem.boissonsDisponibles?.find(
      (option) => option.nom === input.boissonNom
    );
    if (!boissonSelectionnee) {
      return { success: false, error: `Boisson "${input.boissonNom}" indisponible pour ${menuItem.nom}.` };
    }
  }

  const placeholder = getPlaceholderImage(menuItem.indiceImage);
  const image = menuItem.image && !menuItem.image.includes('picsum.photos')
    ? menuItem.image
    : placeholder.url;

  return {
    success: true,
    item: {
      id: menuItem.id,
      nom: menuItem.nom,
      description: menuItem.description,
      prix: menuItem.prix,
      categorie: menuItem.categorie,
      image,
      indiceImage: menuItem.indiceImage,
      restaurantId: menuItem.restaurantId,
      quantite: input.quantite,
      ...(accompagnementSelectionne && { accompagnementSelectionne }),
      ...(boissonSelectionnee && { boissonSelectionnee }),
    },
  };
}

/** Somme le sous-total d'un panier déjà tarifé (prix + options, par quantité). */
export function computeCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const sidePrice = item.accompagnementSelectionne?.prix || 0;
    const drinkPrice = item.boissonSelectionnee?.prix || 0;
    return total + (item.prix + sidePrice + drinkPrice) * item.quantite;
  }, 0);
}
