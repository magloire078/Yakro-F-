import { describe, it, expect } from 'vitest';
import { newOrderPush, statusChangePush } from './push-messages';

const order = { id: 'abcdef123456', nomRestaurant: 'Chez Tantie', total: 12500 };

describe('newOrderPush', () => {
    it('annonce la commande au restaurateur avec son montant', () => {
        const message = newOrderPush(order);
        expect(message.body).toContain('#123456');
        expect(message.body).toMatch(/12\s?500 FCFA/);
        expect(message.link).toBe('/dashboard/orders');
    });
});

describe('statusChangePush', () => {
    it('prévient le client quand la commande est acceptée, en route, livrée ou annulée', () => {
        for (const statut of ['En Préparation', 'En Route', 'Livrée', 'Annulée'] as const) {
            const push = statusChangePush(order, statut);
            expect(push?.audience).toBe('client');
            expect(push?.message.link).toBe('/orders/track?id=abcdef123456');
        }
    });

    it('propose la course aux livreurs quand la commande est prête', () => {
        const push = statusChangePush(order, 'Prête');
        expect(push?.audience).toBe('livreurs');
        expect(push?.message.link).toBe('/livreur');
    });

    it('ne notifie rien pour une commande simplement placée', () => {
        expect(statusChangePush(order, 'Placée')).toBeNull();
    });

    it('regroupe les notifications d’une même commande', () => {
        expect(statusChangePush(order, 'En Route')?.message.tag).toBe(statusChangePush(order, 'Livrée')?.message.tag);
    });
});
