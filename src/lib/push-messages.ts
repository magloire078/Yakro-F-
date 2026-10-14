// Contenu des notifications push liées aux commandes. Module pur (sans
// Firebase) : partagé par le serveur et testable.
import type { Order } from '@/lib/types';

export interface PushMessage {
    title: string;
    body: string;
    /** Page ouverte au toucher de la notification. */
    link: string;
    /** Regroupe les notifications d'une même commande (la plus récente remplace l'ancienne). */
    tag: string;
}

/** Destinataires d'une notification de changement de statut. */
export type PushAudience = 'client' | 'livreurs';

export interface StatusPush {
    audience: PushAudience;
    message: PushMessage;
}

type OrderSummary = Pick<Order, 'id' | 'nomRestaurant' | 'total'>;

const shortId = (orderId: string) => orderId.slice(-6).toUpperCase();
const fcfa = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;

/** Nouvelle commande, pour le restaurateur. */
export function newOrderPush(order: OrderSummary): PushMessage {
    return {
        title: '🛎️ Nouvelle commande',
        body: `Commande #${shortId(order.id)} · ${fcfa(order.total)} — à accepter.`,
        link: '/dashboard/orders',
        tag: `commande-${order.id}`,
    };
}

/**
 * Notification à envoyer quand une commande passe au statut donné, ou null
 * si ce statut ne déclenche rien (ex. « Placée », gérée à la création).
 */
export function statusChangePush(order: OrderSummary, statut: Order['statut']): StatusPush | null {
    const track = `/orders/track?id=${order.id}`;
    const tag = `commande-${order.id}`;
    switch (statut) {
        case 'En Préparation':
            return { audience: 'client', message: { title: '👨‍🍳 Commande acceptée', body: `${order.nomRestaurant} prépare votre commande.`, link: track, tag } };
        case 'Prête':
            return { audience: 'livreurs', message: { title: '🛵 Nouvelle course disponible', body: `Commande #${shortId(order.id)} prête chez ${order.nomRestaurant}.`, link: '/livreur', tag } };
        case 'En Route':
            return { audience: 'client', message: { title: '🛵 Votre commande est en route', body: 'Suivez votre livreur en direct.', link: track, tag } };
        case 'Livrée':
            return { audience: 'client', message: { title: '✅ Commande livrée', body: `Bon appétit ! Donnez votre avis sur ${order.nomRestaurant}.`, link: track, tag } };
        case 'Annulée':
            return { audience: 'client', message: { title: 'Commande annulée', body: `Votre commande chez ${order.nomRestaurant} a été annulée.`, link: track, tag } };
        default:
            return null;
    }
}
