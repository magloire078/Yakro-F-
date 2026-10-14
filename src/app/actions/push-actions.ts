'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { statusChangePush } from '@/lib/push-messages';
import { availableLivreurIds, PUSH_TOKENS_COLLECTION, sendPushToUsers } from '@/lib/push-server';
import type { Order } from '@/lib/types';

type PushActionResult = { success: true } | { success: false; error: string };

async function verifiedUid(idToken: string): Promise<string | null> {
    if (!idToken) return null;
    try {
        return (await getAdminAuth().verifyIdToken(idToken)).uid;
    } catch {
        return null;
    }
}

// Un jeton FCM est une chaîne opaque d'environ 150-200 caractères.
const isPlausibleToken = (token: string) => /^[\w:.-]{20,4096}$/.test(token);

/** Enregistre l'appareil courant pour recevoir les notifications de l'utilisateur. */
export async function registerPushTokenAction(idToken: string, token: string): Promise<PushActionResult> {
    const uid = await verifiedUid(idToken);
    if (!uid) return { success: false, error: 'Authentification invalide.' };
    if (!isPlausibleToken(token)) return { success: false, error: 'Jeton invalide.' };

    // Un appareil appartient au dernier compte connecté dessus : un jeton
    // déjà associé à un autre compte lui est réattribué.
    await getAdminDb().collection(PUSH_TOKENS_COLLECTION).doc(token).set({
        uid,
        updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
}

/** Désinscrit l'appareil courant (déconnexion, notifications désactivées). */
export async function unregisterPushTokenAction(idToken: string, token: string): Promise<PushActionResult> {
    const uid = await verifiedUid(idToken);
    if (!uid) return { success: false, error: 'Authentification invalide.' };
    if (!isPlausibleToken(token)) return { success: false, error: 'Jeton invalide.' };

    const ref = getAdminDb().collection(PUSH_TOKENS_COLLECTION).doc(token);
    const snap = await ref.get();
    if (snap.exists && snap.data()?.uid === uid) await ref.delete();
    return { success: true };
}

/**
 * Notifie les personnes concernées par le statut ACTUEL d'une commande
 * (client, ou livreurs en service quand elle est prête). Appelée juste
 * après chaque changement de statut ; le statut est relu côté serveur, et
 * chaque (commande, statut) n'est notifié qu'une fois.
 */
export async function notifyOrderStatusAction(orderId: string, idToken: string): Promise<PushActionResult> {
    const uid = await verifiedUid(idToken);
    if (!uid) return { success: false, error: 'Authentification invalide.' };
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(orderId)) return { success: false, error: 'Commande invalide.' };

    const db = getAdminDb();
    const snap = await db.collection('commandes').doc(orderId).get();
    if (!snap.exists) return { success: false, error: 'Commande introuvable.' };
    const order = { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };

    // Seuls les acteurs de la commande peuvent déclencher sa notification.
    const isParty = [order.userId, order.restaurateurId, order.livreurId].includes(uid);
    if (!isParty) {
        const caller = await db.collection('utilisateurs').doc(uid).get();
        if (caller.data()?.roleSysteme !== 'SuperAdmin') return { success: false, error: 'Accès refusé.' };
    }

    const push = statusChangePush(order, order.statut);
    if (!push) return { success: true };

    // Anti-doublon : create() échoue si ce (commande, statut) a déjà été notifié.
    try {
        await db.collection('push_log').doc(`${order.id}_${order.statut}`).create({
            orderId: order.id,
            statut: order.statut,
            date: FieldValue.serverTimestamp(),
        });
    } catch {
        return { success: true };
    }

    const recipients = push.audience === 'client' ? [order.userId] : await availableLivreurIds();
    await sendPushToUsers(recipients, push.message);
    return { success: true };
}
