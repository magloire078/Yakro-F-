# Activer le paiement Mobile Money (CinetPay)

Le paiement en ligne (Orange Money, MTN Money, Moov Money) est câblé dans le
code mais **désactivé par défaut**. Tant que `NEXT_PUBLIC_PAYMENTS_MOBILE_MONEY_ENABLED`
n'est pas `true`, l'app ne propose que « Espèces à la livraison » — aucune
commande ne peut donc rester bloquée en attente d'un paiement qui ne peut
pas aboutir. Ce document explique comment activer le Mobile Money une fois
prêt.

## 1. Créer un compte marchand CinetPay

1. Aller sur https://cinetpay.com et créer un compte marchand (Côte d'Ivoire).
2. Compléter la vérification KYC (pièce d'identité, RCCM si société, RIB
   Mobile Money ou bancaire pour les retraits).
3. Une fois le compte validé, récupérer dans le tableau de bord CinetPay :
   - **API Key**
   - **Site ID**

## 2. Renseigner les variables d'environnement

Sur Vercel (Project Settings → Environment Variables), ajouter :

| Variable | Valeur |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON complet du compte de service Firebase (une seule ligne) — **indispensable sur Vercel**, sans quoi tout le SDK Admin (notifications, paiements, cron) échoue silencieusement |
| `CINETPAY_API_KEY` | clé API du compte marchand CinetPay |
| `CINETPAY_SITE_ID` | site ID CinetPay |
| `NEXT_PUBLIC_APP_URL` | URL publique de production, ex. `https://yakrofe.com` |
| `NEXT_PUBLIC_PAYMENTS_MOBILE_MONEY_ENABLED` | `true` |

Comment obtenir `FIREBASE_SERVICE_ACCOUNT_KEY` : Firebase Console → Paramètres
du projet → Comptes de service → « Générer une nouvelle clé privée ». Coller
le contenu JSON téléchargé tel quel dans la variable d'environnement.

## 3. Enregistrer l'URL du webhook

Dans le tableau de bord CinetPay, configurer l'URL de notification
(`notify_url`) sur :

```
https://<votre-domaine>/api/webhooks/cinetpay
```

Cette route revérifie toujours le statut réel auprès de CinetPay (API
check-status) avant de mettre à jour une commande — elle ne fait jamais
confiance au contenu du payload webhook, conformément aux recommandations
de sécurité de CinetPay.

## 4. Déployer et activer

1. Déployer avec les nouvelles variables d'environnement.
2. Vérifier `FIREBASE_SERVICE_ACCOUNT_KEY` et `CINETPAY_*` sont bien prises
   en compte (passer une petite commande de test).
3. Une fois un paiement de test confirmé de bout en bout (initiation →
   redirection CinetPay → webhook → `paiement.statut = 'paye'` en base),
   basculer `NEXT_PUBLIC_PAYMENTS_MOBILE_MONEY_ENABLED=true` en production.

## 5. Abonnement Premium

L'abonnement Premium (priorité de commande) réutilise le même compte
marchand et le même client CinetPay, mais avec son propre webhook :

```
https://<votre-domaine>/api/webhooks/cinetpay/premium
```

Rien à configurer dans le tableau de bord CinetPay pour celui-ci : le
`notify_url` est transmis par transaction à l'initialisation du paiement
(pas un réglage global du compte), donc les paiements de commandes et
d'abonnements sont automatiquement routés vers leur webhook respectif.

## 6. Limitation connue

L'intégration utilise actuellement `channels: 'MOBILE_MONEY'` (valeur
générique) plutôt qu'un code opérateur précis (`ORANGE_MONEY_CI`, etc.),
faute de confirmation du format exact dans la documentation CinetPay au
moment de l'implémentation. CinetPay affiche alors la sélection d'opérateur
sur sa propre page de paiement hébergée. À revoir avec un accès sandbox
réel si l'on souhaite pré-sélectionner l'opérateur (`orange_money`, etc.)
choisi par le client dans l'app.
