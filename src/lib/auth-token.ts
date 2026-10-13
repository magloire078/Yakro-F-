import { auth } from '@/firebase/client';

/**
 * Jeton Firebase de l'utilisateur connecté, à transmettre aux actions
 * serveur qui vérifient l'identité de l'appelant. Chaîne vide si personne
 * n'est connecté : l'action répond alors par une demande de connexion.
 */
export async function currentIdToken(): Promise<string> {
    return (await auth?.currentUser?.getIdToken()) ?? '';
}
