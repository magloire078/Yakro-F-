import { doc, setDoc, deleteDoc, Firestore } from 'firebase/firestore';

export interface LivreurPublicData {
  nom?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Publishes the livreur's public projection in `livreurs_public/{uid}`.
 * Read by clients tracking their order; writeable only by the livreur
 * themselves (cf. firestore.rules). Uses `merge: true` so partial
 * position updates don't clobber the name.
 */
export async function publishLivreurPublic(
  db: Firestore,
  uid: string,
  data: LivreurPublicData,
): Promise<void> {
  await setDoc(doc(db, 'livreurs_public', uid), data, { merge: true });
}

/**
 * Removes the livreur's public projection when going off service.
 */
export async function unpublishLivreurPublic(db: Firestore, uid: string): Promise<void> {
  await deleteDoc(doc(db, 'livreurs_public', uid));
}
