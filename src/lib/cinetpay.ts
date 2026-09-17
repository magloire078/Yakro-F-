/**
 * Client CinetPay (agrégateur Mobile Money pour la Côte d'Ivoire :
 * Orange Money, MTN Money, Moov Money, Wave, carte bancaire).
 *
 * Deux appels seulement sont nécessaires côté serveur :
 *  - `initCinetPayPayment` : ouvre une session de paiement et renvoie une
 *    URL de checkout hébergée par CinetPay (on redirige le client dessus,
 *    on ne gère jamais nous-mêmes les OTP opérateur).
 *  - `checkCinetPayPaymentStatus` : vérifie le VRAI statut d'une
 *    transaction. Règle de sécurité CinetPay : le contenu du webhook
 *    (`notify_url`) ne doit JAMAIS être considéré comme fiable — seul cet
 *    appel, fait depuis notre serveur avec notre clé secrète, fait foi.
 *
 * Réf. doc officielle :
 *  - Initialisation : https://docs.cinetpay.com/api/1.0-en/checkout/initialisation
 *  - Vérification    : https://docs.cinetpay.com/api/1.0-en/checkout/verification
 *  - Notification     : https://docs.cinetpay.com/api/1.0-en/checkout/notification
 */

const CINETPAY_INIT_URL = 'https://api-checkout.cinetpay.com/v2/payment';
const CINETPAY_CHECK_URL = 'https://api-checkout.cinetpay.com/v2/payment/check';

export interface CinetPayConfig {
  apiKey: string;
  siteId: string;
}

/**
 * Lit la config CinetPay depuis les variables d'environnement. Renvoie
 * `null` si non configuré — les appelants doivent alors désactiver
 * proprement l'option de paiement Mobile Money plutôt que planter.
 */
export function getCinetPayConfig(): CinetPayConfig | null {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) return null;
  return { apiKey, siteId };
}

export interface CinetPayCustomer {
  name?: string;
  surname?: string;
  phoneNumber?: string;
  address?: string;
}

export interface InitPaymentParams {
  /** Identifiant unique que NOUS générons (ex: l'ID de la commande). */
  transactionId: string;
  /** Montant en FCFA (XOF), entier. */
  amount: number;
  description: string;
  notifyUrl: string;
  returnUrl: string;
  customer?: CinetPayCustomer;
}

export interface InitPaymentResult {
  paymentUrl: string;
  paymentToken: string;
}

export type CinetPayResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Initialise une session de paiement CinetPay et renvoie l'URL de
 * checkout hébergée vers laquelle rediriger le client.
 *
 * Le canal est volontairement laissé générique (`MOBILE_MONEY`) plutôt
 * que ciblé par opérateur (Orange/MTN/Moov) : les codes de canal exacts
 * par opérateur varient selon la configuration du compte marchand et ne
 * peuvent être confirmés qu'une fois un compte CinetPay actif en main.
 * CinetPay affiche alors le choix de l'opérateur sur sa page hébergée —
 * expérience à peine plus longue, mais garantie de ne jamais envoyer un
 * code de canal invalide qui ferait échouer l'appel.
 */
export async function initCinetPayPayment(
  config: CinetPayConfig,
  params: InitPaymentParams,
): Promise<CinetPayResult<InitPaymentResult>> {
  try {
    const response = await fetch(CINETPAY_INIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: config.apiKey,
        site_id: config.siteId,
        transaction_id: params.transactionId,
        amount: Math.round(params.amount),
        currency: 'XOF',
        description: params.description,
        notify_url: params.notifyUrl,
        return_url: params.returnUrl,
        channels: 'MOBILE_MONEY',
        customer_name: params.customer?.name || 'Client',
        customer_surname: params.customer?.surname || 'Yakro Fê',
        customer_phone_number: params.customer?.phoneNumber || '0000000000',
        customer_address: params.customer?.address || 'Yamoussoukro',
        customer_city: 'Yamoussoukro',
        customer_country: 'CI',
        customer_state: 'CI',
        customer_zip_code: '00000',
      }),
    });

    const json = await response.json();

    if (!response.ok || json.code !== '201') {
      return {
        success: false,
        error: json.message || json.description || `Échec CinetPay (HTTP ${response.status})`,
      };
    }

    const paymentUrl = json.data?.payment_url;
    const paymentToken = json.data?.payment_token;
    if (!paymentUrl || !paymentToken) {
      return { success: false, error: 'Réponse CinetPay invalide (payment_url manquant).' };
    }

    return { success: true, data: { paymentUrl, paymentToken } };
  } catch (error) {
    console.error('initCinetPayPayment: network/parse error', error);
    return { success: false, error: 'Impossible de contacter CinetPay pour le moment.' };
  }
}

/**
 * Statuts possibles renvoyés par CinetPay pour une transaction. `PENDING`
 * et `INITIATED` sont regroupés côté appelant sous "en attente".
 */
export type CinetPayTransactionStatus =
  | 'ACCEPTED'
  | 'REFUSED'
  | 'PENDING'
  | 'INITIATED'
  | 'EXPIRED'
  | 'UNKNOWN';

export interface PaymentStatusResult {
  status: CinetPayTransactionStatus;
  amount?: number;
  paymentMethod?: string;
  operatorId?: string;
}

/**
 * Interroge CinetPay pour connaître le VRAI statut d'une transaction.
 * À appeler systématiquement depuis le handler de webhook — ne jamais se
 * fier au contenu brut du webhook lui-même.
 */
export async function checkCinetPayPaymentStatus(
  config: CinetPayConfig,
  transactionId: string,
): Promise<CinetPayResult<PaymentStatusResult>> {
  try {
    const response = await fetch(CINETPAY_CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: config.apiKey,
        site_id: config.siteId,
        transaction_id: transactionId,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      return { success: false, error: `Échec vérification CinetPay (HTTP ${response.status})` };
    }

    const status: CinetPayTransactionStatus = json.data?.status || 'UNKNOWN';

    return {
      success: true,
      data: {
        status,
        amount: json.data?.amount,
        paymentMethod: json.data?.payment_method,
        operatorId: json.data?.operator_id,
      },
    };
  } catch (error) {
    console.error('checkCinetPayPaymentStatus: network/parse error', error);
    return { success: false, error: 'Impossible de vérifier le paiement auprès de CinetPay.' };
  }
}
