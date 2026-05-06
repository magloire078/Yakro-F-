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
const SUPERADMIN_UID = 'super-1';
const RESTAURANT_ID = 'rest-1';

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'utilisateurs', RESTAURATEUR_UID), { role: 'restaurateur', roleSysteme: 'User' });
    await setDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { role: 'client', roleSysteme: 'User' });
    await setDoc(doc(db, 'utilisateurs', LIVREUR_UID), { role: 'livreur', roleSysteme: 'User' });
    await setDoc(doc(db, 'utilisateurs', SUPERADMIN_UID), { role: 'client', roleSysteme: 'SuperAdmin' });
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
  date: '2026-05-04T12:00:00.000Z',
  ...overrides,
});

describe('firestore.rules — /utilisateurs', () => {
  beforeEach(seed);

  it('lets a user create their own profile with a valid role', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertSucceeds(setDoc(doc(db, 'utilisateurs', 'newbie'), {
      email: 'n@x.io', role: 'client', roleSysteme: 'User',
    }));
  });

  it('rejects self-creation with roleSysteme = SuperAdmin', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(setDoc(doc(db, 'utilisateurs', 'newbie'), {
      email: 'n@x.io', role: 'client', roleSysteme: 'SuperAdmin',
    }));
  });

  it('rejects self-creation with an unknown role', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(setDoc(doc(db, 'utilisateurs', 'newbie'), {
      email: 'n@x.io', role: 'admin', roleSysteme: 'User',
    }));
  });

  it('lets a user update benign fields on their own profile', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { telephone: '+225' }));
  });

  it('forbids a user from promoting their own role', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { role: 'restaurateur' }));
  });

  it('forbids a user from setting roleSysteme = SuperAdmin', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { roleSysteme: 'SuperAdmin' }));
  });

  it('lets SuperAdmin promote any user', async () => {
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'utilisateurs', OTHER_USER_UID), { role: 'restaurateur' }));
  });

  it('forbids reading another user’s profile', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(getDoc(doc(db, 'utilisateurs', RESTAURATEUR_UID)));
  });

  it('lets SuperAdmin list all users', async () => {
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertSucceeds(getDocs(collection(db, 'utilisateurs')));
  });

  it('forbids restaurateur from listing all users (privacy)', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(getDocs(collection(db, 'utilisateurs')));
  });

  it('forbids deleting a user profile when not SuperAdmin', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'utilisateurs', OTHER_USER_UID)));
  });
});

describe('firestore.rules — restaurants & plats', () => {
  beforeEach(seed);

  it('allows public reads on restaurants', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'restaurants', RESTAURANT_ID)));
  });

  it('allows public reads on plats', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'plats', 'p1'), { restaurantId: RESTAURANT_ID, prix: 1000 });
    });
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'plats', 'p1')));
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
    await assertFails(setDoc(doc(db, 'commandes', 'o1'), baseOrder({ livreurId: LIVREUR_UID })));
  });

  it('rejects orders whose restaurateurId does not match the restaurant owner', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'commandes', 'o1'), baseOrder({ restaurateurId: OTHER_USER_UID })));
  });

  it('rejects orders impersonating another user', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'commandes', 'o1'), baseOrder({ userId: 'someone-else' })));
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

  it('rejects unfiltered list queries from a regular client', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(getDocs(collection(db, 'commandes')));
  });

  it('allows the client to list their own orders with where(userId)', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    const snap = await assertSucceeds(getDocs(query(
      collection(db, 'commandes'), where('userId', '==', OTHER_USER_UID),
    )));
    expect(snap.docs.map((d) => d.id)).toEqual(['o-mine']);
  });

  it('lets SuperAdmin list every order', async () => {
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    const snap = await assertSucceeds(getDocs(collection(db, 'commandes')));
    expect(snap.docs.map((d) => d.id).sort()).toEqual(['o-mine', 'o-other']);
  });
});

describe('firestore.rules — /commandes update', () => {
  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'commandes', 'o1'), baseOrder());
    });
  });

  it('lets the restaurateur accept (Placée → En Préparation)', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'commandes', 'o1'), { statut: 'En Préparation' }));
  });

  it('forbids the restaurateur from also bumping the total in the same update', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(updateDoc(doc(db, 'commandes', 'o1'), {
      statut: 'En Préparation', total: 999999,
    }));
  });

  it('lets the livreur take an order', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'commandes', 'o1'), { statut: 'En Préparation' });
    });
    const db = env.authenticatedContext(LIVREUR_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'commandes', 'o1'), {
      statut: 'En Route', livreurId: LIVREUR_UID,
    }));
  });

  it('lets the client cancel their own Placée order', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'commandes', 'o1'), { statut: 'Annulée' }));
  });

  it('forbids the client from cancelling once cooking has started', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'commandes', 'o1'), { statut: 'En Préparation' });
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'commandes', 'o1'), { statut: 'Annulée' }));
  });

  it('forbids the client from rewriting plats while cancelling', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'commandes', 'o1'), {
      statut: 'Annulée', plats: [{ id: 'fake', quantite: 99 }],
    }));
  });

  it('forbids deleting an order when not SuperAdmin', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'commandes', 'o1')));
  });
});

describe('firestore.rules — /stocks', () => {
  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'stocks', 's-mine'), {
        restaurateurId: RESTAURATEUR_UID, nom: 'Tomates', quantite: 10, seuilAlerte: 2,
      });
      await setDoc(doc(db, 'stocks', 's-other'), {
        restaurateurId: 'someone', nom: 'Riz', quantite: 5, seuilAlerte: 2,
      });
    });
  });

  it('allows reading own stock items with the right filter', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    const snap = await assertSucceeds(getDocs(query(
      collection(db, 'stocks'), where('restaurateurId', '==', RESTAURATEUR_UID),
    )));
    expect(snap.docs.map((d) => d.id)).toEqual(['s-mine']);
  });

  it("forbids reading another restaurateur's stock", async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(getDoc(doc(db, 'stocks', 's-other')));
  });
});

describe('firestore.rules — /notifications', () => {
  beforeEach(async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'notifications', 'n1'), {
        destinataireId: RESTAURATEUR_UID,
        type: 'STOCK_LOW',
        stockItemNom: 'Tomate',
        read: false,
      });
    });
  });

  it('lets the recipient read their notification', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(getDoc(doc(db, 'notifications', 'n1')));
  });

  it('forbids reading another user’s notification', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(getDoc(doc(db, 'notifications', 'n1')));
  });

  it('forbids ANY client from creating a notification (Admin SDK only)', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(setDoc(doc(db, 'notifications', 'n2'), {
      destinataireId: RESTAURATEUR_UID, type: 'STOCK_LOW',
    }));
  });

  it('forbids the placing client from forging a NEW_ORDER notification', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'notifications', 'forged'), {
      destinataireId: RESTAURATEUR_UID, type: 'NEW_ORDER',
    }));
  });

  it('lets the recipient mark their notification as read', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'notifications', 'n1'), { read: true }));
  });

  it('forbids re-routing a notification to someone else', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertFails(updateDoc(doc(db, 'notifications', 'n1'), {
      destinataireId: 'someone-else',
    }));
  });

  it('lets the recipient delete their own notification', async () => {
    const db = env.authenticatedContext(RESTAURATEUR_UID).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'notifications', 'n1')));
  });
});

describe('firestore.rules — /audit_logs', () => {
  beforeEach(seed);

  const sampleLog = (overrides: Record<string, unknown> = {}) => ({
    adminId: SUPERADMIN_UID,
    adminEmail: 'admin@yakro.io',
    action: 'UPDATE_USER',
    targetId: 'whoever',
    details: 'test',
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  it('lets a SuperAdmin write a log entry whose adminId matches their uid', async () => {
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'audit_logs', 'log-1'), sampleLog()));
  });

  it('rejects log entries with a forged adminId', async () => {
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertFails(setDoc(doc(db, 'audit_logs', 'log-1'),
      sampleLog({ adminId: 'someone-else' })));
  });

  it('forbids non-admin users from writing logs', async () => {
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(setDoc(doc(db, 'audit_logs', 'log-1'),
      sampleLog({ adminId: OTHER_USER_UID })));
  });

  it('forbids non-admin users from reading logs', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'audit_logs', 'log-1'), sampleLog());
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(getDoc(doc(db, 'audit_logs', 'log-1')));
  });

  it('forbids ANY client from deleting a log (no 30-day open door)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'audit_logs', 'log-1'),
        sampleLog({ timestamp: '2020-01-01T00:00:00.000Z' }));
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'audit_logs', 'log-1')));
  });

  it('forbids tampering with existing logs even for SuperAdmin', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'audit_logs', 'log-1'), sampleLog());
    });
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertFails(updateDoc(doc(db, 'audit_logs', 'log-1'), { details: 'hacked' }));
  });

  it('lets SuperAdmin delete logs (manual cleanup, but cron is the canonical path)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'audit_logs', 'log-1'), sampleLog());
    });
    const db = env.authenticatedContext(SUPERADMIN_UID).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'audit_logs', 'log-1')));
  });
});

describe('firestore.rules — /livreurs_public', () => {
  beforeEach(seed);

  it('lets the livreur publish their own public doc', async () => {
    const db = env.authenticatedContext(LIVREUR_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'livreurs_public', LIVREUR_UID), {
      nom: 'Yao', latitude: 7.69, longitude: -5.03,
    }));
  });

  it('forbids a livreur from spoofing another livreur’s public doc', async () => {
    const db = env.authenticatedContext(LIVREUR_UID).firestore();
    await assertFails(setDoc(doc(db, 'livreurs_public', 'other-livreur'), { nom: 'spoof' }));
  });

  it('lets any authenticated user read a livreur public doc', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'livreurs_public', LIVREUR_UID), { nom: 'Yao' });
    });
    const db = env.authenticatedContext(OTHER_USER_UID).firestore();
    await assertSucceeds(getDoc(doc(db, 'livreurs_public', LIVREUR_UID)));
  });

  it('forbids unauthenticated reads', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'livreurs_public', LIVREUR_UID), { nom: 'Yao' });
    });
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'livreurs_public', LIVREUR_UID)));
  });
});
