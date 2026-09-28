'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import type { AppRole } from '@/lib/types';

/**
 * Vérifie le jeton d'ID de l'appelant et confirme qu'il s'agit bien d'un
 * SuperAdmin, en relisant son profil via l'Admin SDK — jamais en faisant
 * confiance au seul contrôle d'accès côté client (qui n'est qu'un confort
 * d'UI, pas une protection).
 */
async function assertSuperAdmin(idToken: string): Promise<{ uid: string } | { error: string }> {
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    console.error('assertSuperAdmin: jeton invalide', err);
    return { error: 'Authentification invalide.' };
  }

  const snap = await getAdminDb().collection('utilisateurs').doc(uid).get();
  const roleSysteme = snap.exists ? (snap.data()?.roleSysteme as string | undefined) : undefined;
  if (roleSysteme !== 'SuperAdmin') {
    return { error: 'Accès réservé aux Super Administrateurs.' };
  }
  return { uid };
}

export interface CreateUserInput {
  idToken: string;
  nom: string;
  email: string;
  password: string;
  role: AppRole;
}

export type CreateUserResult =
  | { success: true; uid: string }
  | { success: false; error: string };

/**
 * Crée un véritable compte Firebase Auth (pas une simulation) et son profil
 * Firestore associé. Réservé aux SuperAdmin, via l'Admin SDK puisqu'un
 * client authentifié ne peut jamais créer de compte pour quelqu'un d'autre
 * ni écrire un document `/utilisateurs/{uid}` dont l'id ne correspond pas
 * à son propre uid (voir firestore.rules).
 */
export async function createUserAction(input: CreateUserInput): Promise<CreateUserResult> {
  const { idToken, nom, email, password, role } = input;
  if (!idToken || !nom || !email || !password || !role) {
    return { success: false, error: 'Paramètres manquants.' };
  }

  const caller = await assertSuperAdmin(idToken);
  if ('error' in caller) {
    return { success: false, error: caller.error };
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  let newUserUid: string;
  try {
    const userRecord = await adminAuth.createUser({ email, password, displayName: nom });
    newUserUid = userRecord.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string } | undefined)?.code;
    let message = 'Impossible de créer le compte.';
    if (code === 'auth/email-already-exists') {
      message = 'Cette adresse email est déjà utilisée.';
    } else if (code === 'auth/invalid-password') {
      message = 'Le mot de passe doit contenir au moins 6 caractères.';
    } else if (code === 'auth/invalid-email') {
      message = 'Adresse email invalide.';
    } else {
      console.error('createUserAction: échec createUser', err);
    }
    return { success: false, error: message };
  }

  try {
    await adminDb.collection('utilisateurs').doc(newUserUid).set({
      uid: newUserUid,
      email,
      nom,
      role,
      roleSysteme: 'User',
      dateCreation: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Le compte Auth a été créé mais le profil Firestore a échoué : on
    // annule (rollback) le compte plutôt que de laisser un compte "fantôme"
    // sans profil, qui bloquerait l'utilisateur à sa première connexion.
    console.error('createUserAction: échec de l\'écriture du profil, rollback du compte Auth', err);
    await adminAuth.deleteUser(newUserUid).catch((cleanupErr) => {
      console.error('createUserAction: échec du rollback', cleanupErr);
    });
    return { success: false, error: "Le compte n'a pas pu être créé complètement. Réessayez." };
  }

  return { success: true, uid: newUserUid };
}

export interface DeleteUserInput {
  idToken: string;
  targetUid: string;
}

export type DeleteUserResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Supprime réellement un utilisateur : le compte Firebase Auth (via l'Admin
 * SDK, qu'aucune règle Firestore ne peut atteindre) en plus de son profil
 * Firestore. Sans ça, un compte "supprimé" pouvait encore se reconnecter —
 * seul son profil disparaissait, pas son accès.
 */
export async function deleteUserAction(input: DeleteUserInput): Promise<DeleteUserResult> {
  const { idToken, targetUid } = input;
  if (!idToken || !targetUid) {
    return { success: false, error: 'Paramètres manquants.' };
  }

  const caller = await assertSuperAdmin(idToken);
  if ('error' in caller) {
    return { success: false, error: caller.error };
  }

  if (caller.uid === targetUid) {
    return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte.' };
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  try {
    await adminAuth.deleteUser(targetUid);
  } catch (err: unknown) {
    const code = (err as { code?: string } | undefined)?.code;
    if (code !== 'auth/user-not-found') {
      console.error('deleteUserAction: échec de la suppression du compte Auth', err);
      return { success: false, error: "Impossible de supprimer le compte d'authentification." };
    }
    // Compte Auth déjà absent (ex: déjà supprimé) : on continue quand même
    // pour nettoyer un éventuel profil Firestore orphelin.
  }

  await adminDb.collection('utilisateurs').doc(targetUid).delete();

  return { success: true };
}
