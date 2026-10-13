import { doc, setDoc, deleteDoc, serverTimestamp, Firestore, type Timestamp } from 'firebase/firestore';

export interface LivreurPublicData {
  nom?: string;
  latitude?: number;
  longitude?: number;
  /**
   * Heure serveur de la dernière position publiée. Permet aux cartes de
   * repérer un livreur dont l'app s'est fermée sans passer hors service
   * (position figée) au lieu de l'afficher indéfiniment « en direct ».
   */
  updatedAt?: Timestamp;
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
  data: Omit<LivreurPublicData, 'updatedAt'>,
): Promise<void> {
  await setDoc(doc(db, 'livreurs_public', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Retire le profil public lorsqu'un livreur passe hors service.
 */
export async function unpublishLivreurPublic(db: Firestore, uid: string): Promise<void> {
  await deleteDoc(doc(db, 'livreurs_public', uid));
}
