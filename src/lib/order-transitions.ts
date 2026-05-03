import type { Order } from './types';

export type OrderStatus = Order['statut'];
export type ActorRole = 'restaurateur' | 'livreur' | 'superadmin';

/**
 * Mirror of the status transitions enforced server-side in `firestore.rules`.
 * Use this for client-side guards (disabling buttons, optimistic UI),
 * not as a replacement for the rules.
 */
export function canTransitionOrder(
  current: OrderStatus,
  next: OrderStatus,
  role: ActorRole,
): boolean {
  if (role === 'superadmin') return current !== next;
  if (current === next) return false;

  if (role === 'restaurateur') {
    if (next === 'En Préparation') return current === 'Placée';
    if (next === 'Prête') return current === 'En Préparation';
    return false;
  }

  if (role === 'livreur') {
    if (next === 'En Route') {
      return current === 'Placée' || current === 'En Préparation' || current === 'Prête';
    }
    if (next === 'Livrée') {
      return current === 'En Route';
    }
  }

  return false;
}
