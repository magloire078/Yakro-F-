# Stratégie d'invitation beta fermée — Phase 1

**Objectif** : recruter 200-300 utilisateurs beta sur 4 semaines (semaines
5-8) pour valider l'app à petite échelle avant le lancement grand public.

> **Préalable** : Phase 0 doit être validée (15-20 restaurants signés,
> 60-100 plats au catalogue, photos pro pour le top 10). Sans offre
> consistante, les beta-testeurs auront une mauvaise première impression
> et ne reviendront pas.

---

## Pourquoi une beta fermée et pas un lancement direct ?

| Risque évité | Comment la beta fermée le résout |
|---|---|
| Premier utilisateur a une mauvaise commande, parle en ville | Audience choisie = tolérante aux bugs, donne du feedback |
| Pic de trafic surprise quand un bug critique tombe | Volume contrôlé, monitoring direct |
| Restaurateurs non préparés au flux | 5-10 commandes / jour pendant 2 semaines = courbe d'apprentissage |
| Marketing payant qui amène des "users morts" | Pas de pub avant validation produit |

---

## Segmentation des 200-300 invités

### Segment A — "Cercle privé" (50 personnes, semaine 5)

Le réseau personnel direct du fondateur et des restaurateurs Fondateurs.

| Sous-segment | ~ Volume | Profil | Canal |
|---|---|---|---|
| Famille + amis proches | 15-20 | Tolérants, feedback honnête | WhatsApp direct |
| Collègues / réseau pro | 15-20 | CSP+, panier moyen élevé | WhatsApp + LinkedIn |
| Clients réguliers des restaurateurs Fondateurs | 15-20 | Achetent déjà chez nos restos | Le restaurateur invite via WhatsApp |

**Objectif** : 30-40 commandes par semaine. Repérer les bugs critiques.

### Segment B — "Influence locale" (50 personnes, semaine 6)

Personnes ayant une voix dans le tissu social yamoussoukrois.

| Sous-segment | ~ Volume | Profil | Canal |
|---|---|---|---|
| Bloggers / instagrameurs food locaux | 5-10 | Couverture organique potentielle | DM Instagram + invitation |
| Étudiants représentants à l'INPHB et l'ENS | 10-15 | Multiplicateurs, commande en groupe | Visite physique sur campus |
| Personnel d'hôtels (5*) | 10-15 | Recommandent aux clients | Via la direction F&B des restos partenaires |
| Cadres expatriés / diplomates | 10-15 | Panier moyen 3× normal | Réseau direct + ambassades |

**Bonus** : à chaque blogger, **packaging spécial** (sticker doré "Test Yakro
Fê", bristol manuscrit) pour la photo Instagram.

### Segment C — "Volume contrôlé" (150-200 personnes, semaines 7-8)

Élargissement progressif via parrainage.

- Chaque utilisateur du Segment A et B reçoit **3 codes d'invitation**
  uniques à partager (3 × 100 = 300 places potentielles).
- Code = `YAKROFE-[5 lettres]`. Chaque code donne **500 FCFA de réduction
  sur la première commande** au filleul + **500 FCFA de crédit** au
  parrain à partir de 3 filleuls actifs (= au moins 1 commande chacun).

---

## Mécanique d'invitation (technique)

### Côté produit (à implémenter avant le lancement Phase 1)

> Cette feature n'est pas encore dans le code — c'est un livrable d'ingénierie
> à prévoir si tu valides la stratégie de codes parrainage.

- Champ optionnel `codeParrainage` au moment de la création de compte.
- Collection Firestore `/codes_invitation/{code}` : `{ parrainUid, usages, maxUsages, actif }`.
- Au premier login via un code valide :
  - Crédit 500 FCFA appliqué automatiquement à la prochaine commande.
  - Compteur d'usages incrémenté (limit le nombre de filleuls par code).
- Côté parrain : badge "Ambassadeur Yakro" affiché après 3 filleuls actifs.

### Côté process (sans code, MVP V0)

Si tu veux démarrer Phase 1 sans attendre le système de parrainage :

- **Whitelist manuelle** : ajouter chaque email/téléphone dans une
  collection `/beta_whitelist`.
- **Garde côté login** : refuser la création de compte si l'email n'est
  pas dans la whitelist (page "L'inscription est sur invitation pendant
  la beta. Contactez-nous : ...").
- **Distribution** : chaque invité reçoit un message personnalisé avec un
  lien direct vers `/login?inviteCode=XXX` (le code est juste tracking, pas
  de logique transactionnelle).

**Recommandation** : démarrer V0 (whitelist manuelle simple), implémenter
la mécanique parrainage en parallèle pour la fin de Phase 1.

---

## Calendrier Phase 1 (4 semaines)

| Semaine | Activité | Objectif chiffré |
|---|---|---|
| **S5** | Invitations Segment A (cercle privé) | 50 inscrits, 30-40 commandes |
| **S6** | Invitations Segment B (influence) + posts Instagram blogueurs | 100 inscrits cumulés, 80-100 cmd/semaine |
| **S7** | Distribution codes parrainage (Segment C) | 200 inscrits cumulés |
| **S8** | Itération sur feedback + dernière vague d'invitations | 300 inscrits, 200+ cmd/semaine, prêt pour Phase 2 |

---

## KPIs Phase 1

À tracker quotidiennement dans un dashboard simple (Google Sheets relié
à Firestore via Apps Script, ou un tableau dans Notion mis à jour à la
main).

| Métrique | Objectif S5 | Objectif S8 |
|---|---|---|
| Utilisateurs inscrits | 50 | 300 |
| Commandes par jour | 5-7 | 30+ |
| Taux de complétion (commande passée → livrée sans incident) | 75% | 92% |
| Net Promoter Score (sondage post-livraison) | 40+ | 50+ |
| Bugs critiques signalés | n/a (les remonter tous) | < 2 par semaine |
| Note moyenne app store / sondage | n/a | 4.2 / 5 |

**Critère go/no-go pour Phase 2** : taux de complétion > 90% sur la
dernière semaine. Sinon, prolonger Phase 1 et corriger les fuites.

---

## Risques à anticiper

1. **Restaurateur en rupture de stock invisible** : l'app n'a pas (encore)
   de système qui désactive un plat quand le stock tombe à 0. Solution
   en attendant : briefing restaurateur (mettre en pause manuellement)
   + WhatsApp direct si le client se plaint.
2. **Livreur insuffisant en pic du soir (19h-21h)** : prévoir 3 livreurs
   minimum dès semaine 5, 5 dès semaine 7.
3. **Bug bloquant non détecté** : surveiller les logs Firestore +
   Sentry / log-rocket / monitoring propre. Avoir un canal WhatsApp
   "Beta Yakro Fê — Support" pour que les beta-testeurs signalent
   directement.
4. **Fuite virale prématurée** : si un blogger publie avant que vous
   soyez prêts (semaine 5 = trop tôt), demander le retrait poli ou
   accepter le surcroît mais préparer l'équipe.
