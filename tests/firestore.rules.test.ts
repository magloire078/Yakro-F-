import { readFileSync } from 'fs';
import path from 'path';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

const PROJECT_ID = 'yakro-rules-test';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  if (env) await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

const RESTAURATEUR_UID = 'resto-owner-1';
const OTHER_USER_UID = 'client-1';
const LIVREUR_UID = 'livreur-1';
const RESTAURANT_ID = 'rest-1';

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'utilisateurs', RESTAURATEUR_UID), {
      role: 'restaurateur',
    });
    await setDoc(doc(db, 'utilisateurs', OTHER_USER_UID), {
      role: 'client',
    });
    await setDoc(doc(db, 'utilisateurs', LIVREUR_UID), {
      role: 'livreur',
    });
    await setDoc(doc(db, 'restaurants', RESTAURANT_ID), {
      proprietaireId: RESTAURATEUR_UID,
      nom: 'Chez Test',
      fraisDeLivraison: 500,
    });
  });
}

const baseOrder = (overrides: Record<string, unknown> = {}) => ({
  userId: OTHER_USER_UID,
  restaurantId: RESTAURANT_ID,
  restaurateurId: RESTAURATEUR_UID,
  statut: 'Placée',
  total: 5000,
  sousTotal: 4500,
  fraisDeLivraison: 500,
  tauxCommission: 0.15,
  montantCommission: 450,
  revenuNet: 4050,
  plats: [{ id: 'p1', quantite: 1 }],
  date: '2026-05-03T12:00:00.000Z',
  paiement: { mode: 'especes', statut: 'a_la_livraison', montant: 5000 },
  ...overrides,
});

describe('firestore.rules — restaurants & plats', () => {
  beforeEach(seed);

  it('blocks unauthenticated reads on restaurants', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'restaurants', RESTAURANT_ID)));
  });

  it('allows authenticated reads on restaurants', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(getDoc(doc(db, 'restaurants', RESTAURANT_ID)));
  });
});

describe('firestore.rules — /commandes create', () => {
  beforeEach(seed);

  // Les commandes ne sont plus créées par écriture directe du client :
  // createOrderAction (Admin SDK) est désormais l'unique voie, car les
  // rules ne peuvent pas sommer `plats` pour vérifier `sousTotal`/`total`
  // contre le vrai contenu du panier. `allow create` est donc `if false`
  // sans conditions — ces tests couvrent que la porte reste bien fermée,
  // quelle que soit la forme du document envoyé.
  it('rejects a direct client write, even a well-formed order', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'commandes', 'o1'), baseOrder()));
  });

  it('rejects the exact payload produced by buildOrderFromCart', async () => {
    const { buildOrderFromCart } = await import('../src/lib/order-builder');
    const cartItem = {
      id: 'p1',
      nom: 'Attiéké',
      description: 'Plat',
      prix: 3000,
      categorie: 'Plat',
      indiceImage: 'plat-1',
      restaurantId: RESTAURANT_ID,
      quantite: 2,
      image: 'https://res.cloudinary.com/demo/image/upload/plat.jpg',
    };
    const order = buildOrderFromCart({
      user: { uid: OTHER_USER_UID },
      userProfile: { adresseParDefaut: 'Belleville', telephone: '+225' },
      cartItems: [cartItem],
      restaurant: {
        id: RESTAURANT_ID,
        proprietaireId: RESTAURATEUR_UID,
        nom: 'Chez Test',
        cuisine: 'Locale',
        note: 4.5,
        tempsDeLivraison: 30,
        fraisDeLivraison: 500,
        image: 'r.jpg',
        indiceImage: 'rest-1',
      },
      cartSubtotal: 6000,
      cartDeliveryFee: 500,
      cartTotal: 6500,
      paymentMode: 'especes' as const,
      now: new Date('2026-05-04T12:00:00.000Z'),
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'commandes', 'placed'), order));
  });

  it('rejects a direct write even when impersonating another user', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'commandes', 'o1'), baseOrder({ userId: 'someone-else' })),
    );
  });
});

describe('firestore.rules — /abonnements', () => {
  beforeEach(seed);

  const baseSubscription = (overrides: Record<string, unknown> = {}) => ({
    userId: OTHER_USER_UID,
    montant: 2000,
    dureeJours: 30,
    paiement: { mode: 'orange_money', statut: 'en_attente', montant: 2000 },
    dateCreation: '2026-06-01T00:00:00.000Z',
    ...overrides,
  });

  it('lets a client create their own pending Premium subscription', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'abonnements', 'sub1'), baseSubscription()));
  });

  it('rejects a subscription created for someone else', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'abonnements', 'sub1'), baseSubscription({ userId: RESTAURATEUR_UID })),
    );
  });

  it('rejects cash as a payment mode for a subscription', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'abonnements', 'sub1'), baseSubscription({
        paiement: { mode: 'especes', statut: 'en_attente', montant: 2000 },
      })),
    );
  });

  it('rejects a subscription pre-marked as already paid', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'abonnements', 'sub1'), baseSubscription({
        paiement: { mode: 'orange_money', statut: 'paye', montant: 2000 },
      })),
    );
  });

  it('rejects a subscription that pre-sets a transactionId at creation', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'abonnements', 'sub1'), baseSubscription({
        paiement: { mode: 'orange_money', statut: 'en_attente', montant: 2000, transactionId: 'forged' },
      })),
    );
  });

  it('rejects a subscription priced below the official Premium price', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'abonnements', 'sub1'), baseSubscription({
        montant: 1,
        paiement: { mode: 'orange_money', statut: 'en_attente', montant: 1 },
      })),
    );
  });

  it('rejects a subscription with a duration different from the official 30 days', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'abonnements', 'sub1'), baseSubscription({ dureeJours: 365 })),
    );
  });

  it('lets the subscriber read their own subscription', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'abonnements', 'sub1'), baseSubscription());
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(getDoc(doc(db, 'abonnements', 'sub1')));
  });

  it('forbids reading someone else\'s subscription', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'abonnements', 'sub1'), baseSubscription());
    });
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(getDoc(doc(db, 'abonnements', 'sub1')));
  });

  it('forbids the client from updating their own subscription', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'abonnements', 'sub1'), baseSubscription());
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'abonnements', 'sub1'), { 'paiement.statut': 'paye' }),
    );
  });
});

describe('firestore.rules — /coupons', () => {
  const COUPON_CODE = 'YAKRO10';

  beforeEach(seed);

  const baseCoupon = (overrides: Record<string, unknown> = {}) => ({
    code: COUPON_CODE,
    restaurantId: RESTAURANT_ID,
    restaurateurId: RESTAURATEUR_UID,
    type: 'montant_fixe',
    valeur: 1000,
    dateExpiration: Timestamp.fromDate(new Date(Date.now() + 86400_000)),
    actif: true,
    ...overrides,
  });

  it('lets the restaurant owner create a coupon for their own restaurant', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'coupons', COUPON_CODE), baseCoupon()));
  });

  it('rejects a coupon created by someone other than the restaurant owner', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'coupons', COUPON_CODE), baseCoupon()));
  });

  it('rejects a document id that does not match the code', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(setDoc(doc(db, 'coupons', 'MISMATCH'), baseCoupon()));
  });

  it('rejects a malformed code', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(setDoc(doc(db, 'coupons', 'ab'), baseCoupon({ code: 'ab' })));
  });

  it('rejects a percentage coupon above 100%', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'coupons', COUPON_CODE), baseCoupon({ type: 'pourcentage', valeur: 150 })),
    );
  });

  it('lets the owner toggle actif and nothing else', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'coupons', COUPON_CODE), baseCoupon());
    });
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'coupons', COUPON_CODE), { actif: false }));
  });

  it('forbids changing the discount value through an update', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'coupons', COUPON_CODE), baseCoupon());
    });
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(updateDoc(doc(db, 'coupons', COUPON_CODE), { valeur: 5000 }));
  });

  it('lets the owner delete their own coupon', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'coupons', COUPON_CODE), baseCoupon());
    });
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'coupons', COUPON_CODE)));
  });

  it('lets any authenticated user read a coupon by its code', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'coupons', COUPON_CODE), baseCoupon());
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(getDoc(doc(db, 'coupons', COUPON_CODE)));
  });

  it('lets the owner list their own coupons', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'coupons', COUPON_CODE), baseCoupon());
    });
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    const snap = await assertSucceeds(
      getDocs(query(collection(db, 'coupons'), where('restaurateurId', '==', RESTAURATEUR_UID))),
    );
    expect(snap.docs.map((d) => d.id)).toEqual([COUPON_CODE]);
  });

  it('forbids another authenticated user from listing someone else\'s coupons', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'coupons', COUPON_CODE), baseCoupon());
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      getDocs(query(collection(db, 'coupons'), where('restaurateurId', '==', RESTAURATEUR_UID))),
    );
  });
});

describe('firestore.rules — /commandes list', () => {
  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'commandes', 'o-mine'), baseOrder({ userId: OTHER_USER_UID }));
      await setDoc(doc(db, 'commandes', 'o-other'), baseOrder({ userId: 'stranger' }));
    });
  });

  it('rejects unfiltered list queries', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(getDocs(collection(db, 'commandes')));
  });

  it('allows the client to list their own orders with where(userId)', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    const snap = await assertSucceeds(
      getDocs(query(collection(db, 'commandes'), where('userId', '==', OTHER_USER_UID))),
    );
    expect(snap.docs.map((d) => d.id)).toEqual(['o-mine']);
  });

  it('lets a livreur list orders still Placée (not yet accepted by a restaurateur)', async () => {
    // A livreur must be able to discover new deliveries before any
    // restaurateur has accepted them — restricting visibility to
    // 'En Préparation' only would make 'Placée'/'Prête' orders invisible
    // to every livreur, even though the update rule lets them pick those
    // orders up directly.
    const db = env.authenticatedContext(LIVREUR_UID).firestore();
    const snap = await assertSucceeds(
      getDocs(query(collection(db, 'commandes'), where('statut', '==', 'Placée'))),
    );
    expect(snap.docs.map((d) => d.id).sort()).toEqual(['o-mine', 'o-other']);
  });
});

describe('firestore.rules — /commandes update', () => {
  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'commandes', 'o1'), baseOrder());
    });
  });

  it('lets the restaurateur accept (Placée → En Préparation)', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'commandes', 'o1'), { statut: 'En Préparation' }));
  });

  it('forbids the restaurateur from also bumping the total in the same update', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'commandes', 'o1'), { statut: 'En Préparation', total: 999999 }),
    );
  });

  it('forbids a stranger from changing statuses', async () => {
    const db = env.authenticatedContext('stranger').firestore();
    await assertFails(updateDoc(doc(db, 'commandes', 'o1'), { statut: 'En Préparation' }));
  });

  it('lets the livreur take an order (En Préparation → En Route)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'commandes', 'o1'), { statut: 'En Préparation' });
    });
    const db = env.authenticatedContext(LIVREUR_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'commandes', 'o1'), { statut: 'En Route', livreurId: LIVREUR_UID }),
    );
  });

  it('lets the livreur take an order straight from Placée (never accepted by the restaurateur)', async () => {
    const db = env.authenticatedContext(LIVREUR_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'commandes', 'o1'), { statut: 'En Route', livreurId: LIVREUR_UID }),
    );
  });

  it('lets the client cancel their own order while still Placée', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'commandes', 'o1'), { statut: 'Annulée' }));
  });

  it('forbids the client from cancelling an order already accepted by the restaurateur', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'commandes', 'o1'), { statut: 'En Préparation' });
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'commandes', 'o1'), { statut: 'Annulée' }));
  });

  it('forbids a stranger from cancelling someone else\'s order', async () => {
    const db = env.authenticatedContext('stranger').firestore();
    await assertFails(updateDoc(doc(db, 'commandes', 'o1'), { statut: 'Annulée' }));
  });

  it('forbids the client from also changing the total while cancelling', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'commandes', 'o1'), { statut: 'Annulée', total: 1 }),
    );
  });

  it('forbids deleting an order when not SuperAdmin', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'commandes', 'o1')));
  });

  it('forbids a restaurateur from also setting livraisonTraitee while accepting an order', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'commandes', 'o1'), { statut: 'En Préparation', livraisonTraitee: true }),
    );
  });

  it('forbids a restaurateur from adding prioritaire while accepting an order', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'commandes', 'o1'), { statut: 'En Préparation', prioritaire: true }),
    );
  });

  it('forbids a restaurateur from adding a codePromo while accepting an order', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'commandes', 'o1'), {
        statut: 'En Préparation',
        codePromo: { code: 'FORGED', montantReduction: 1000 },
      }),
    );
  });
});

describe('firestore.rules — /utilisateurs', () => {
  beforeEach(seed);

  it('lets a user create their own profile with a valid role', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'utilisateurs', 'newbie'), {
        email: 'n@x.io',
        role: 'client',
        roleSysteme: 'User',
      }),
    );
  });

  it('rejects self-creation with roleSysteme = SuperAdmin', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(
      setDoc(doc(db, 'utilisateurs', 'newbie'), {
        email: 'n@x.io',
        role: 'client',
        roleSysteme: 'SuperAdmin',
      }),
    );
  });

  it('rejects self-creation with an unknown role', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(
      setDoc(doc(db, 'utilisateurs', 'newbie'), {
        email: 'n@x.io',
        role: 'admin',
        roleSysteme: 'User',
      }),
    );
  });

  it('lets a user update benign fields on their own profile', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { telephone: '+225...' }),
    );
  });

  it('forbids a user from promoting their own role', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { role: 'restaurateur' }),
    );
  });

  it('forbids a user from setting roleSysteme = SuperAdmin', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { roleSysteme: 'SuperAdmin' }),
    );
  });

  it('forbids reading another user’s profile', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(getDoc(doc(db, 'utilisateurs', RESTAURATEUR_UID)));
  });

  it('forbids deleting a user profile when not SuperAdmin', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'utilisateurs', OTHER_USER_UID)));
  });

  it('lets a user create their profile with a valid parrainId', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'utilisateurs', 'newbie'), {
        email: 'n@x.io',
        role: 'client',
        roleSysteme: 'User',
        parrainId: OTHER_USER_UID,
      }),
    );
  });

  it('rejects a parrainId pointing to a non-existent user', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(
      setDoc(doc(db, 'utilisateurs', 'newbie'), {
        email: 'n@x.io',
        role: 'client',
        roleSysteme: 'User',
        parrainId: 'ghost',
      }),
    );
  });

  it('rejects self-referral (parrainId == own uid)', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(
      setDoc(doc(db, 'utilisateurs', 'newbie'), {
        email: 'n@x.io',
        role: 'client',
        roleSysteme: 'User',
        parrainId: 'newbie',
      }),
    );
  });

  it('rejects a profile that pre-sets pointsFidelite at creation', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(
      setDoc(doc(db, 'utilisateurs', 'newbie'), {
        email: 'n@x.io',
        role: 'client',
        roleSysteme: 'User',
        pointsFidelite: 1000,
      }),
    );
  });

  it('forbids a client from self-crediting pointsFidelite via update', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { pointsFidelite: 9999 }),
    );
  });

  it('forbids a client from changing parrainId after profile creation', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'utilisateurs', 'has-parrain'), {
        role: 'client',
        parrainId: RESTAURATEUR_UID,
      });
    });
    const db = env.authenticatedContext('has-parrain').firestore();
    await assertFails(
      updateDoc(doc(db, 'utilisateurs', 'has-parrain'), { parrainId: LIVREUR_UID }),
    );
  });

  it('forbids a client from marking their own referral reward as paid', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { filleulRecompenseVersee: true }),
    );
  });

  it('forbids a client from granting themselves Premium via update', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), {
        premiumJusquau: Timestamp.fromDate(new Date(Date.now() + 30 * 86400_000)),
      }),
    );
  });

  it('lets a SuperAdmin promote any user\'s role', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'utilisateurs', 'super-1'), {
        role: 'client',
        roleSysteme: 'SuperAdmin',
      });
    });
    const db = env.authenticatedContext('super-1').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { role: 'restaurateur' }),
    );
  });

  it('lets a SuperAdmin list all users', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'utilisateurs', 'super-1'), {
        role: 'client',
        roleSysteme: 'SuperAdmin',
      });
    });
    const db = env.authenticatedContext('super-1').firestore();
    await assertSucceeds(getDocs(collection(db, 'utilisateurs')));
  });

  it('forbids a restaurateur from listing all users (privacy)', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(getDocs(collection(db, 'utilisateurs')));
  });
});

describe('firestore.rules — /avis', () => {
  const DELIVERED_ORDER_ID = 'order-delivered';
  const PLACED_ORDER_ID = 'order-placed';

  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'commandes', DELIVERED_ORDER_ID), baseOrder({ statut: 'Livrée' }));
      await setDoc(doc(db, 'commandes', PLACED_ORDER_ID), baseOrder({ statut: 'Placée' }));
    });
  });

  const baseAvis = (overrides: Record<string, unknown> = {}) => ({
    restaurantId: RESTAURANT_ID,
    userId: OTHER_USER_UID,
    orderId: DELIVERED_ORDER_ID,
    nomUtilisateur: 'Client Test',
    note: 5,
    commentaire: 'Excellent, livré rapidement !',
    date: '2026-05-05T12:00:00.000Z',
    ...overrides,
  });

  it('lets the client review a delivered order (doc id == orderId)', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'avis', DELIVERED_ORDER_ID), baseAvis()));
  });

  it('rejects a review whose document id does not match orderId', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'avis', 'mismatched-id'), baseAvis()));
  });

  it('rejects a review for an order that is not yet delivered', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'avis', PLACED_ORDER_ID), baseAvis({ orderId: PLACED_ORDER_ID })),
    );
  });

  it('rejects a review posted by someone other than the order owner', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'avis', DELIVERED_ORDER_ID), baseAvis({ userId: RESTAURATEUR_UID })),
    );
  });

  it('rejects a review whose restaurantId does not match the order', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'avis', DELIVERED_ORDER_ID), baseAvis({ restaurantId: 'other-restaurant' })),
    );
  });

  it('rejects a note outside the 1-5 range', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'avis', DELIVERED_ORDER_ID), baseAvis({ note: 0 })));
    await assertFails(setDoc(doc(db, 'avis', DELIVERED_ORDER_ID), baseAvis({ note: 6 })));
  });

  it('lets anyone read reviews without authentication', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'avis', DELIVERED_ORDER_ID), baseAvis());
    });
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'avis', DELIVERED_ORDER_ID)));
  });

  it('forbids editing a review once posted', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'avis', DELIVERED_ORDER_ID), baseAvis());
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'avis', DELIVERED_ORDER_ID), { note: 1 }));
  });

  it('forbids deleting a review once posted', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'avis', DELIVERED_ORDER_ID), baseAvis());
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'avis', DELIVERED_ORDER_ID)));
  });
});

describe('firestore.rules — /notifications', () => {
  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      // Simule la création server-side via Admin SDK.
      await setDoc(doc(ctx.firestore(), 'notifications', 'n1'), {
        userId: RESTAURATEUR_UID,
        type: 'STOCK_LOW',
        stockItemId: 's1',
        stockItemNom: 'Tomate',
        quantiteRestante: 1,
        seuilAlerte: 2,
        restaurantId: RESTAURANT_ID,
        read: false,
      });
    });
  });

  it('lets the recipient read their own notification', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(getDoc(doc(db, 'notifications', 'n1')));
  });

  it('forbids reading another user’s notification', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(getDoc(doc(db, 'notifications', 'n1')));
  });

  it('forbids any client from creating a notification', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'notifications', 'n2'), {
        userId: RESTAURATEUR_UID,
        type: 'STOCK_LOW',
      }),
    );
  });

  it('forbids the placing client from forging a NEW_ORDER notification', async () => {
    // The legitimate path goes through the `notifyNewOrderAction` server
    // action (Admin SDK). A client trying to create the notification itself
    // — even targeting the right restaurateur — must be refused.
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'notifications', 'forged'), {
        userId: RESTAURATEUR_UID,
        type: 'NEW_ORDER',
        orderId: 'whatever',
        total: 5000,
        read: false,
      }),
    );
  });

  it('lets the recipient mark their notification as read', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'notifications', 'n1'), { read: true }));
  });

  it('forbids the recipient from re-routing a notification to someone else', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(
      updateDoc(doc(db, 'notifications', 'n1'), { userId: 'someone-else' }),
    );
  });

  it('lets the recipient delete their own notification', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'notifications', 'n1')));
  });

  it('forbids deleting someone else\'s notification', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'notifications', 'n1')));
  });
});

describe('firestore.rules — /audit_logs', () => {
  const SUPERADMIN_UID = 'super-1';

  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'utilisateurs', SUPERADMIN_UID), {
        role: 'client',
        roleSysteme: 'SuperAdmin',
      });
    });
  });

  const sampleLog = (overrides: Record<string, unknown> = {}) => ({
    adminId: SUPERADMIN_UID,
    adminEmail: 'admin@yakro.io',
    action: 'UPDATE_USER',
    targetId: 'whoever',
    details: 'test',
    ...overrides,
  });

  it('lets a SuperAdmin write a log entry whose adminId matches their uid', async () => {
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'audit_logs', 'log-1'), sampleLog()));
  });

  it('rejects log entries with a forged adminId', async () => {
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'audit_logs', 'log-1'), sampleLog({ adminId: 'someone-else' })),
    );
  });

  it('forbids non-admin users from writing logs', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'audit_logs', 'log-1'), sampleLog({ adminId: OTHER_USER_UID })),
    );
  });

  it('forbids non-admin users from reading logs', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'audit_logs', 'log-1'), sampleLog());
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(getDoc(doc(db, 'audit_logs', 'log-1')));
  });

  it('forbids tampering with existing logs even for SuperAdmin', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'audit_logs', 'log-1'), sampleLog());
    });
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertFails(updateDoc(doc(db, 'audit_logs', 'log-1'), { details: 'hacked' }));
    await assertFails(deleteDoc(doc(db, 'audit_logs', 'log-1')));
  });
});

describe('firestore.rules — /livreurs_public', () => {
  beforeEach(seed);

  it('lets the livreur publish their own public doc', async () => {
    const db = env.authenticatedContext(LIVREUR_UID).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'livreurs_public', LIVREUR_UID), {
        nom: 'Yao',
        latitude: 7.69,
        longitude: -5.03,
      }),
    );
  });

  it('forbids a livreur from writing another livreur’s public doc', async () => {
    const db = env.authenticatedContext(LIVREUR_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'livreurs_public', 'other-livreur'), { nom: 'spoof' }),
    );
  });

  it('lets any authenticated user read a livreur public doc', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'livreurs_public', LIVREUR_UID), {
        nom: 'Yao',
        latitude: 7.69,
        longitude: -5.03,
      });
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(getDoc(doc(db, 'livreurs_public', LIVREUR_UID)));
  });

  it('forbids unauthenticated reads of livreurs_public', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'livreurs_public', LIVREUR_UID), { nom: 'Yao' });
    });
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'livreurs_public', LIVREUR_UID)));
  });
});

describe('firestore.rules — /stocks', () => {
  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'stocks', 's-mine'), {
        restaurateurId: RESTAURATEUR_UID,
        nom: 'Tomates',
        quantite: 10,
        seuilAlerte: 2,
      });
      await setDoc(doc(db, 'stocks', 's-other'), {
        restaurateurId: 'someone',
        nom: 'Riz',
        quantite: 5,
        seuilAlerte: 2,
      });
    });
  });

  it('rejects unfiltered list queries on /stocks', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(getDocs(collection(db, 'stocks')));
  });

  it('allows reading own stock items with the right filter', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    const snap = await assertSucceeds(
      getDocs(
        query(collection(db, 'stocks'), where('restaurateurId', '==', RESTAURATEUR_UID)),
      ),
    );
    expect(snap.docs.map((d) => d.id)).toEqual(['s-mine']);
  });

  it("forbids a restaurateur from reading another restaurateur's stock", async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(getDoc(doc(db, 'stocks', 's-other')));
  });
});
