import 'server-only';

import { getAdminDb, getAdminMessaging } from '@/firebase/admin';
import { ORDER_CHANNEL_ID, type PushMessage } from '@/lib/push-messages';

// Envoi des notifications push (Firebase Cloud Messaging).
//
// Les jetons d'appareil sont stockés dans `push_tokens/{jeton}` = { uid } :
// un utilisateur peut en avoir plusieurs (téléphone, ordinateur). Cette
// collection n'est déclarée dans aucune règle Firestore : elle est donc
// inaccessible aux clients et n'est lue/écrite que par le serveur.
export const PUSH_TOKENS_COLLECTION = 'push_tokens';

// Erreurs FCM signifiant que le jeton ne sert plus (app désinstallée,
// permission retirée, jeton expiré) : on le supprime.
const DEAD_TOKEN_ERRORS = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/invalid-argument',
]);

async function tokensForUsers(uids: string[]): Promise<string[]> {
    const db = getAdminDb();
    const unique = Array.from(new Set(uids.filter(Boolean)));
    const tokens: string[] = [];
    // L'opérateur `in` accepte au plus 30 valeurs.
    for (let i = 0; i < unique.length; i += 30) {
        const snap = await db.collection(PUSH_TOKENS_COLLECTION).where('uid', 'in', unique.slice(i, i + 30)).get();
        snap.forEach((doc) => tokens.push(doc.id));
    }
    return tokens;
}

/**
 * Envoie une notification à tous les appareils des utilisateurs donnés.
 * Ne lève jamais d'erreur : une notification ratée ne doit pas faire échouer
 * l'opération métier (commande, changement de statut) qui la déclenche.
 */
export async function sendPushToUsers(uids: string[], message: PushMessage): Promise<number> {
    try {
        const tokens = await tokensForUsers(uids);
        if (tokens.length === 0) return 0;

        // Navigateurs : message « data » seul, affiché par notre service worker
        // (même rendu partout). App Android : le système n'affiche une
        // notification app fermée que si elle est décrite dans `android`
        // (ignoré par les navigateurs) ; `data.link` sert au toucher.
        const response = await getAdminMessaging().sendEachForMulticast({
            tokens,
            data: { title: message.title, body: message.body, link: message.link, tag: message.tag },
            webpush: { headers: { Urgency: 'high', TTL: '3600' } },
            android: {
                priority: 'high',
                ttl: 3600 * 1000,
                notification: {
                    title: message.title,
                    body: message.body,
                    tag: message.tag,
                    channelId: ORDER_CHANNEL_ID,
                    defaultSound: true,
                    defaultVibrateTimings: true,
                },
            },
        });

        const dead = response.responses
            .map((r, index) => (!r.success && r.error && DEAD_TOKEN_ERRORS.has(r.error.code) ? tokens[index] : null))
            .filter((token): token is string => !!token);
        if (dead.length > 0) {
            const db = getAdminDb();
            const batch = db.batch();
            dead.forEach((token) => batch.delete(db.collection(PUSH_TOKENS_COLLECTION).doc(token)));
            await batch.commit();
        }
        return response.successCount;
    } catch (error) {
        console.error('sendPushToUsers: échec de l’envoi', error);
        return 0;
    }
}

/** Livreurs actuellement « En service ». */
export async function availableLivreurIds(): Promise<string[]> {
    const snap = await getAdminDb()
        .collection('utilisateurs')
        .where('role', '==', 'livreur')
        .where('statutService', '==', 'En service')
        .get();
    return snap.docs.map((doc) => doc.id);
}
