import { doc, setDoc, deleteDoc, Firestore } from 'firebase/firestore';

export interface LivreurPublicData {
  nom?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Publie le profil public d'un livreur (nom + position) dans la collection
 * `livreurs_public`, lue par les clients qui suivent leur commande.
 * `setDoc` avec `{ merge: true }` permet d'utiliser cette fonction aussi
 * bien à la création qu'aux mises à jour de position.
 */
export async function publishLivreurPublic(
  db: Firestore,
  uid: string,
  data: LivreurPublicData,
): Promise<void> {
  await setDoc(doc(db, 'livreurs_public', uid), data, { merge: true });
}

/**
 * Retire le profil public lorsqu'un livreur passe hors service.
 */
export async function unpublishLivreurPublic(db: Firestore, uid: string): Promise<void> {
  await deleteDoc(doc(db, 'livreurs_public', uid));
}
