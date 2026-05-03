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
  tauxCommission: 0.1,
  montantCommission: 450,
  revenuNet: 4050,
  plats: [{ id: 'p1', quantite: 1 }],
  date: '2026-05-03T12:00:00.000Z',
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

  it('lets the client create a properly-formed order', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'commandes', 'o1'), baseOrder()));
  });

  it('rejects orders with statut != Placée', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'commandes', 'o1'), baseOrder({ statut: 'Livrée' })));
  });

  it('rejects orders that pre-set livreurId', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'commandes', 'o1'), baseOrder({ livreurId: LIVREUR_UID })),
    );
  });

  it('rejects orders whose restaurateurId does not match the restaurant owner', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'commandes', 'o1'), baseOrder({ restaurateurId: OTHER_USER_UID })),
    );
  });

  it('rejects orders impersonating another user', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'commandes', 'o1'), baseOrder({ userId: 'someone-else' })),
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

  it('forbids deleting an order when not SuperAdmin', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'commandes', 'o1')));
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
