import type { Order } from './types';

export type StandardStepStatus = 'Placée' | 'En Préparation' | 'Prête' | 'En Route' | 'Livrée';

export interface OrderTrackingStep {
  status: StandardStepStatus;
  label: string;
  shortLabel: string;
  description: string;
}

export const ORDER_TRACKING_STEPS: readonly OrderTrackingStep[] = [
  {
    status: 'Placée',
    label: 'Commande Reçue',
    shortLabel: 'Reçue',
    description: 'Votre commande a été transmise au restaurant.',
  },
  {
    status: 'En Préparation',
    label: 'En Préparation',
    shortLabel: 'En cuisine',
    description: 'Le chef prépare vos plats avec soin.',
  },
  {
    status: 'Prête',
    label: 'Commande Prête',
    shortLabel: 'Prête',
    description: 'Plats emballés, en attente de prise en charge par le livreur.',
  },
  {
    status: 'En Route',
    label: 'En Livraison',
    shortLabel: 'En route',
    description: 'Le livreur file vers votre adresse de livraison.',
  },
  {
    status: 'Livrée',
    label: 'Commande Livrée',
    shortLabel: 'Livrée',
    description: 'Remise effectuée avec succès. Bon appétit !',
  },
] as const;

/**
 * Renvoie l'index (0 à 4) de l'étape correspondante.
 * Pour 'Annulée', renvoie -1.
 */
export function getOrderStepIndex(status: Order['statut']): number {
  switch (status) {
    case 'Placée':
      return 0;
    case 'En Préparation':
      return 1;
    case 'Prête':
      return 2;
    case 'En Route':
      return 3;
    case 'Livrée':
      return 4;
    case 'Annulée':
      return -1;
    default:
      return 0;
  }
}

/**
 * Détermine si le client peut encore annuler sa commande directement.
 * Selon firestore.rules, seule une commande au statut 'Placée' peut être annulée par le client.
 */
export function isOrderCancellableByClient(order: Pick<Order, 'statut'>): boolean {
  return order.statut === 'Placée';
}

export interface StatusHeadline {
  title: string;
  subtitle: string;
  accentColor: string;
}

export function getStatusHeadline(status: Order['statut']): StatusHeadline {
  switch (status) {
    case 'Placée':
      return {
        title: 'Commande transmise',
        subtitle: 'En attente de prise en charge par le restaurant',
        accentColor: 'text-amber-500',
      };
    case 'En Préparation':
      return {
        title: 'En cours de préparation',
        subtitle: 'Les cuisines s’activent pour mitonner vos plats',
        accentColor: 'text-orange-500',
      };
    case 'Prête':
      return {
        title: 'Commande prête',
        subtitle: 'Vos plats sont emballés et n’attendent plus que le livreur',
        accentColor: 'text-emerald-500',
      };
    case 'En Route':
      return {
        title: 'Livreur en route',
        subtitle: 'Votre repas arrive à toute vitesse à votre adresse',
        accentColor: 'text-orange-500',
      };
    case 'Livrée':
      return {
        title: 'Commande livrée',
        subtitle: 'Remise en mains propres effectuée · Bon appétit !',
        accentColor: 'text-emerald-500',
      };
    case 'Annulée':
      return {
        title: 'Commande annulée',
        subtitle: 'Cette commande a été annulée.',
        accentColor: 'text-rose-500',
      };
  }
}
