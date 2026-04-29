import type { PaymentMethod, PaymentStatus } from './types';

export interface PaymentMethodInfo {
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  description: string;
  needsPhone: boolean;
  needsCard: boolean;
  /** Si true, le paiement est tenté à la création de commande (simulé en démo). */
  prepayé: boolean;
  initialStatus: PaymentStatus;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'especes',
    label: 'Espèces à la livraison',
    shortLabel: 'Espèces',
    description: 'Réglez le livreur en FCFA à la réception de votre commande.',
    needsPhone: false,
    needsCard: false,
    prepayé: false,
    initialStatus: 'A la livraison',
  },
  {
    id: 'wave',
    label: 'Wave',
    shortLabel: 'Wave',
    description: 'Paiement instantané via Wave. (Démo : paiement simulé.)',
    needsPhone: true,
    needsCard: false,
    prepayé: true,
    initialStatus: 'En attente',
  },
  {
    id: 'orange-money',
    label: 'Orange Money',
    shortLabel: 'Orange Money',
    description: 'Paiement via Orange Money CI. (Démo : paiement simulé.)',
    needsPhone: true,
    needsCard: false,
    prepayé: true,
    initialStatus: 'En attente',
  },
  {
    id: 'mtn-momo',
    label: 'MTN Mobile Money',
    shortLabel: 'MTN MoMo',
    description: 'Paiement via MTN MoMo. (Démo : paiement simulé.)',
    needsPhone: true,
    needsCard: false,
    prepayé: true,
    initialStatus: 'En attente',
  },
  {
    id: 'carte',
    label: 'Carte bancaire',
    shortLabel: 'Carte',
    description: 'Visa / Mastercard. (Démo : paiement simulé.)',
    needsPhone: false,
    needsCard: true,
    prepayé: true,
    initialStatus: 'En attente',
  },
];

export const getPaymentMethod = (id: PaymentMethod): PaymentMethodInfo =>
  PAYMENT_METHODS.find(m => m.id === id) ?? PAYMENT_METHODS[0];

const IVORIAN_PHONE_REGEX = /^[0-9]{8,10}$/;

export const validatePaymentReference = (
  method: PaymentMethod,
  reference: string
): { ok: true } | { ok: false; error: string } => {
  const info = getPaymentMethod(method);
  if (info.needsPhone) {
    const cleaned = reference.replace(/\s+/g, '');
    if (!IVORIAN_PHONE_REGEX.test(cleaned)) {
      return { ok: false, error: 'Numéro Mobile Money invalide (8 à 10 chiffres).' };
    }
    return { ok: true };
  }
  if (info.needsCard) {
    const cleaned = reference.replace(/\s+/g, '');
    if (!/^[0-9]{4}$/.test(cleaned)) {
      return { ok: false, error: 'Saisissez les 4 derniers chiffres de la carte.' };
    }
    return { ok: true };
  }
  return { ok: true };
};

/**
 * Simule la confirmation d'un paiement prépayé. À remplacer par un appel
 * réel à un PSP (Wave / OM / MoMo / carte) avec gestion de webhook côté serveur.
 *
 * En démo : 95% de succès après ~2 s, 5% d'échec.
 */
export const simulatePrepaidPayment = async (): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { success: Math.random() > 0.05 };
};
