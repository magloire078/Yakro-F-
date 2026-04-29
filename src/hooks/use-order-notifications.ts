'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';

const STATUS_TITLES: Partial<Record<Order['statut'], string>> = {
  'En Préparation': 'Commande acceptée 🍳',
  'En Route': 'Livraison en route 🛵',
  'Livrée': 'Commande livrée ✅',
  'Annulée': 'Commande annulée',
};

const STATUS_DESCRIPTIONS: Partial<Record<Order['statut'], string>> = {
  'En Préparation': 'Le restaurant prépare votre commande.',
  'En Route': 'Le livreur est en route, suivez-le sur la carte.',
  'Livrée': 'Bon appétit ! N\'oubliez pas de noter votre expérience.',
  'Annulée': 'Votre commande a été annulée.',
};

const showBrowserNotification = (title: string, body: string) => {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return; // évite le doublon avec le toast
  try {
    new Notification(title, { body, icon: '/icon-192.png', tag: 'yakro-order' });
  } catch {
    /* ignore */
  }
};

/**
 * Surveille les commandes du client et émet une notification toast +
 * une Notification navigateur (si permission) à chaque transition de
 * statut depuis la dernière session.
 */
export function useOrderNotifications() {
  const { user, activeRole } = useAuth();
  const { orders } = useData();
  const { toast } = useToast();
  const previousStatusesRef = React.useRef<Map<string, Order['statut']>>(new Map());
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!user || activeRole !== 'client') return;

    const myOrders = orders.filter(o => o.userId === user.uid);

    // Initialise la map sans déclencher de notifications au premier passage.
    if (!initializedRef.current) {
      myOrders.forEach(o => previousStatusesRef.current.set(o.id, o.statut));
      initializedRef.current = true;
      return;
    }

    for (const order of myOrders) {
      const prev = previousStatusesRef.current.get(order.id);
      if (prev !== undefined && prev !== order.statut) {
        const title = STATUS_TITLES[order.statut];
        const description = STATUS_DESCRIPTIONS[order.statut];
        if (title) {
          toast({
            title,
            description: description ? `${order.nomRestaurant} — ${description}` : order.nomRestaurant,
          });
          showBrowserNotification(title, `${order.nomRestaurant} — ${description ?? ''}`);
        }
      }
      previousStatusesRef.current.set(order.id, order.statut);
    }
  }, [orders, user, activeRole, toast]);
}
