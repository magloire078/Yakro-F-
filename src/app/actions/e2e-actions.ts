'use server';

import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COMMISSION_RATE } from '@/lib/order-builder';
import type { CartItem, Order, PaymentMode } from '@/lib/types';
import { statusChangePush } from '@/lib/push-messages';
import { sendPushToUsers, availableLivreurIds } from '@/lib/push-server';

export interface SimulatedOrderParams {
  restaurantId?: string;
  nomRestaurant?: string;
  paymentMode?: PaymentMode;
  montantTotal?: number;
}

export interface E2ESimulationStepResult {
  success: boolean;
  orderId?: string;
  status?: Order['statut'];
  message: string;
  data?: Record<string, unknown>;
}

type DevAccess = { success: true; uid: string } | { success: false; error: string };

const ACCESS_DENIED = 'Accès refusé.';
const CONNEXION_REQUISE = 'Connexion requise pour cette action.';

// Statuts réels d'une commande (voir src/lib/types.ts) : la cible est un
// paramètre client, elle est donc revalidée ici à l'exécution.
const ORDER_STATUSES: ReadonlyArray<Order['statut']> = [
  'Placée',
  'En Préparation',
  'Prête',
  'En Route',
  'Livrée',
  'Annulée',
];

// Modes de paiement réels (voir src/lib/types.ts), revalidés à l'exécution.
const PAYMENT_MODES: ReadonlyArray<PaymentMode> = [
  'especes',
  'orange_money',
  'mtn_money',
  'moov_money',
];

// Identifiants Firestore acceptés pour les documents ciblés par ces actions.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// Points de repère réels à Yamoussoukro
const YAKRO_LOCATIONS = {
  maquisDuVal: { lat: 6.824, lng: -5.27, name: 'Maquis du Val (Quartier 2000)' },
  clientResidence: { lat: 6.816, lng: -5.278, name: 'Résidence Lacs (Yamoussoukro)' },
};

/**
 * Garde d'accès des actions de simulation E2E.
 *
 * Ces actions écrivent avec l'Admin SDK, donc contournent firestore.rules :
 * l'identité de l'appelant doit être vérifiée ici, et jamais seulement par
 * l'écran /dev (un simple contrôle d'UI n'est pas une protection).
 *
 * - jeton absent → refus ;
 * - jeton valide + profil `utilisateurs/{uid}.roleSysteme === 'SuperAdmin'` → autorisé ;
 * - jeton valide + `NODE_ENV === 'development'` → autorisé, pour que la
 *   console /dev locale reste utilisable sans compte SuperAdmin. Sur Vercel
 *   NODE_ENV vaut toujours 'production' : la dérogation ne s'active jamais
 *   en production.
 *
 * Aucun détail technique (code Firestore, message du SDK) n'est renvoyé au
 * client : il est seulement journalisé côté serveur.
 */
async function assertDevAccess(idToken: string): Promise<DevAccess> {
  if (!idToken) {
    return { success: false, error: CONNEXION_REQUISE };
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const profileSnap = await getAdminDb().collection('utilisateurs').doc(decoded.uid).get();
    if (profileSnap.exists && profileSnap.data()?.roleSysteme === 'SuperAdmin') {
      return { success: true, uid: decoded.uid };
    }
    if (process.env.NODE_ENV === 'development') {
      return { success: true, uid: decoded.uid };
    }
    return { success: false, error: ACCESS_DENIED };
  } catch (err) {
    console.error('assertDevAccess: jeton invalide', err);
    return { success: false, error: ACCESS_DENIED };
  }
}

/**
 * 1. Crée une commande test E2E complète dans Firestore
 */
export async function createSimulatedOrderAction(
  idToken: string,
  params?: SimulatedOrderParams
): Promise<E2ESimulationStepResult> {
  const access = await assertDevAccess(idToken);
  if (!access.success) {
    return { success: false, message: access.error };
  }

  const restaurantId = params?.restaurantId ?? 'resto-test-e2e';
  if (!ID_PATTERN.test(restaurantId)) {
    return { success: false, message: 'Restaurant de test invalide.' };
  }

  try {
    const db = getAdminDb();
    const orderRef = db.collection('commandes').doc();

    // `params` vient du client : les valeurs sont revalidées à l'exécution
    // (le typage TypeScript ne protège pas une Server Action).
    const paymentMode: PaymentMode =
      params?.paymentMode && PAYMENT_MODES.includes(params.paymentMode)
        ? params.paymentMode
        : 'especes';
    // Les articles valent 4 500 FCFA ; un montant supérieur est traité
    // comme des frais de livraison simulés (jamais de total incohérent).
    const sousTotal = 4500;
    const requestedTotal = params?.montantTotal;
    const total = Math.max(
      typeof requestedTotal === 'number' && Number.isFinite(requestedTotal) ? requestedTotal : sousTotal,
      sousTotal
    );
    const fraisDeLivraison = total - sousTotal;
    const montantCommission = sousTotal * COMMISSION_RATE;
    const nomRestaurant = params?.nomRestaurant ?? 'Maquis du Val Yamoussoukro';

    const plats: CartItem[] = [
      {
        id: 'item-alloco-1',
        nom: 'Alloco & Poulet Braisé',
        description: 'Alloco doré, poulet braisé et sauce piment doux.',
        prix: 3500,
        categorie: 'Plat',
        indiceImage: 'alloco-poulet',
        restaurantId,
        quantite: 1,
        accompagnementSelectionne: { nom: 'Sauce piment doux', prix: 0 },
      },
      {
        id: 'item-bissap-2',
        nom: 'Jus de Bissap Maison (50cl)',
        description: 'Bissap frais préparé sur place.',
        prix: sousTotal - 3500,
        categorie: 'Boisson',
        indiceImage: 'bissap',
        restaurantId,
        quantite: 1,
      },
    ];

    const testOrder: Omit<Order, 'id'> = {
      userId: 'e2e-client-test',
      plats,
      sousTotal,
      fraisDeLivraison,
      total,
      tauxCommission: COMMISSION_RATE,
      montantCommission,
      revenuNet: sousTotal - montantCommission,
      date: new Date().toISOString(),
      nomRestaurant,
      restaurantId,
      restaurateurId: 'e2e-restaurateur-test',
      statut: 'Placée',
      paiement: {
        mode: paymentMode,
        statut: paymentMode === 'especes' ? 'a_la_livraison' : 'en_attente',
        montant: total,
      },
      adresseClient: YAKRO_LOCATIONS.clientResidence.name,
      adresseRestaurant: YAKRO_LOCATIONS.maquisDuVal.name,
      telephoneClient: '+225 07 00 00 00 00',
      latitudeClient: YAKRO_LOCATIONS.clientResidence.lat,
      longitudeClient: YAKRO_LOCATIONS.clientResidence.lng,
      latitudeRestaurant: YAKRO_LOCATIONS.maquisDuVal.lat,
      longitudeRestaurant: YAKRO_LOCATIONS.maquisDuVal.lng,
    };

    await orderRef.set({
      ...testOrder,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      orderId: orderRef.id,
      status: testOrder.statut,
      message: `Commande #${orderRef.id.slice(-6)} créée avec succès (Total: ${total.toLocaleString('fr-FR')} FCFA).`,
      data: {
        orderId: orderRef.id,
        nomRestaurant,
        total,
        modePaiement: paymentMode,
      },
    };
  } catch (error) {
    console.error('createSimulatedOrderAction error:', error);
    return {
      success: false,
      message: 'Erreur lors de la création de la commande test.',
    };
  }
}

/**
 * 2. Avance le statut de la commande simulée
 */
export async function advanceSimulatedOrderStatusAction(
  idToken: string,
  orderId: string,
  targetStatus: Order['statut'],
  livreurId = 'livreur-e2e-test'
): Promise<E2ESimulationStepResult> {
  const access = await assertDevAccess(idToken);
  if (!access.success) {
    return { success: false, message: access.error };
  }
  if (!ID_PATTERN.test(orderId)) {
    return { success: false, message: 'Commande test invalide.' };
  }
  if (!ORDER_STATUSES.includes(targetStatus)) {
    return { success: false, message: 'Statut cible invalide.' };
  }
  if (!ID_PATTERN.test(livreurId)) {
    return { success: false, message: 'Livreur de test invalide.' };
  }

  try {
    const db = getAdminDb();
    const orderRef = db.collection('commandes').doc(orderId);
    const snap = await orderRef.get();

    if (!snap.exists) {
      return { success: false, message: 'Commande test introuvable.' };
    }

    const currentOrder = { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };
    const updateData: Partial<Order> & { updatedAt: FieldValue } = {
      statut: targetStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Le livreur n'est affecté qu'au départ réel de la course.
    if (targetStatus === 'En Route') {
      updateData.livreurId = livreurId;
    }

    if (targetStatus === 'Livrée') {
      updateData.paiement = {
        ...currentOrder.paiement,
        statut: 'paye',
        dateConfirmation: new Date().toISOString(),
      };
    }

    await orderRef.update(updateData);

    // Même logique que notifyOrderStatusAction : le contenu dépend du
    // statut, et l'audience est le client ou les livreurs en service.
    const push = statusChangePush(
      { id: currentOrder.id, nomRestaurant: currentOrder.nomRestaurant, total: currentOrder.total },
      targetStatus
    );
    if (push) {
      // La notification est secondaire : un statut bien mis à jour ne doit
      // jamais être signalé comme un échec à cause d'un souci d'envoi
      // (sendPushToUsers ne lève pas, mais la lecture des livreurs si).
      try {
        const recipients =
          push.audience === 'client' ? [currentOrder.userId] : await availableLivreurIds();
        if (recipients.length > 0) {
          await sendPushToUsers(recipients, push.message);
        }
      } catch (pushError) {
        console.error('advanceSimulatedOrderStatusAction: échec de la notification', pushError);
      }
    }

    return {
      success: true,
      orderId,
      status: targetStatus,
      message: `Statut passé à « ${targetStatus} ».`,
    };
  } catch (error) {
    console.error('advanceSimulatedOrderStatusAction error:', error);
    return {
      success: false,
      message: 'Erreur de mise à jour du statut.',
    };
  }
}

/**
 * 3. Met à jour la position GPS simulée du livreur pour le suivi en direct
 */
export async function updateSimulatedLivreurPositionAction(
  idToken: string,
  livreurId: string,
  progressRatio: number // de 0 (Restaurant) à 1 (Client)
): Promise<E2ESimulationStepResult> {
  const access = await assertDevAccess(idToken);
  if (!access.success) {
    return { success: false, message: access.error };
  }
  if (!ID_PATTERN.test(livreurId)) {
    return { success: false, message: 'Livreur de test invalide.' };
  }

  const ratio = Math.max(0, Math.min(1, Number.isFinite(progressRatio) ? progressRatio : 0));

  try {
    const db = getAdminDb();

    // Interpolation linéaire entre le restaurant et le client
    const lat = YAKRO_LOCATIONS.maquisDuVal.lat + (YAKRO_LOCATIONS.clientResidence.lat - YAKRO_LOCATIONS.maquisDuVal.lat) * ratio;
    const lng = YAKRO_LOCATIONS.maquisDuVal.lng + (YAKRO_LOCATIONS.clientResidence.lng - YAKRO_LOCATIONS.maquisDuVal.lng) * ratio;

    const livreurPublicRef = db.collection('livreurs_public').doc(livreurId);
    await livreurPublicRef.set({
      nom: 'Samba Livreur (Test E2E)',
      telephone: '+225 05 55 55 55 55',
      statutService: 'En service',
      latitude: lat,
      longitude: lng,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      message: `Position GPS livreur : [${lat.toFixed(4)}, ${lng.toFixed(4)}] (${Math.round(ratio * 100)}% du trajet).`,
      data: { latitude: lat, longitude: lng, progress: ratio },
    };
  } catch (error) {
    console.error('updateSimulatedLivreurPositionAction error:', error);
    return {
      success: false,
      message: 'Erreur GPS livreur.',
    };
  }
}

/**
 * 4. Nettoyage de la commande et du livreur de test
 */
export async function cleanupSimulatedOrderAction(
  idToken: string,
  orderId: string,
  livreurId = 'livreur-e2e-test'
): Promise<E2ESimulationStepResult> {
  const access = await assertDevAccess(idToken);
  if (!access.success) {
    return { success: false, message: access.error };
  }
  if (!ID_PATTERN.test(orderId) || !ID_PATTERN.test(livreurId)) {
    return { success: false, message: 'Données de test invalides.' };
  }

  try {
    const db = getAdminDb();
    await db.collection('commandes').doc(orderId).delete();
    await db.collection('livreurs_public').doc(livreurId).delete();

    return {
      success: true,
      message: 'Données de test nettoyées avec succès de Firestore.',
    };
  } catch (error) {
    console.error('cleanupSimulatedOrderAction error:', error);
    return {
      success: false,
      message: 'Erreur de nettoyage.',
    };
  }
}
