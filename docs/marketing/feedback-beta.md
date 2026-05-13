# Collecte & traitement du feedback beta — Phase 1

Pendant les 4 semaines de beta, **le retour utilisateur est l'actif n°1**.
Pas une nuisance à gérer — la matière brute qui décide si tu sors en
public ou tu repousses Phase 2.

---

## Les 3 canaux de collecte

### Canal 1 — Sondage automatique post-livraison (passif)

À implémenter dans l'app (livrable d'ingénierie pour Phase 1) :

- Quand une commande passe à `Livrée`, le client reçoit dans l'app
  un sondage minimaliste :
  - **Étoile globale 1-5** (obligatoire, en 1 tap)
  - **3 cases à cocher** optionnelles : *« Plat conforme »*,
    *« Livraison rapide »*, *« Livreur sympa »*
  - **Champ texte libre** optionnel : *« Une chose à améliorer ? »*
- Stockage dans Firestore `/feedbacks/{orderId}`.
- Notification push / in-app au restaurateur ET au livreur quand
  l'étoile est ≥ 4 → motivation positive.

**Taux de réponse attendu** : 30-50% (en 1 tap c'est jouable).

### Canal 2 — WhatsApp direct (actif)

Tu envoies à la main, 24h après la commande, le message du
fichier [`whatsapp-scripts.md`](./whatsapp-scripts.md) section 3.B :

> *« Une chose qui t'a plu, une qui t'a énervé, une qui manquait. »*

**Volume** : tu peux traiter 5-10 retours/jour à la main = 35-70/semaine.

### Canal 3 — Sondage hebdo Google Form (qualitatif)

Tous les vendredis, envoie un Google Form à tous les beta-testeurs
actifs (au moins 1 commande) avec 5 questions :

1. Sur une échelle de 0 à 10, recommanderais-tu Yakro Fê à un·e
   ami·e ? *(NPS — utiliser cette formulation exacte)*
2. Quelle est la principale raison de ta note ?
3. Quelle fonctionnalité te manque le plus ?
4. À quelle fréquence penses-tu commander si Yakro Fê devenait
   payant à 100% ? *(jamais / 1x/mois / 1x/semaine / plus)*
5. As-tu eu un bug ou problème non remonté ?

---

## Stockage & traitement

### Centraliser dans un Sheet (ou Notion)

| Date | Source | UID client | Commande | Note | Texte libre | Catégorie | Action |
|---|---|---|---|---|---|---|---|
| 2026-06-03 | In-app | abc123 | o-456 | 5★ | « Livreur super sympa » | Compliment | — |
| 2026-06-03 | WhatsApp | def456 | o-457 | 3★ | « Plat tiède à l'arrivée » | Bug logistique | Voir resto + livreur |
| 2026-06-04 | Form | ghi789 | — | NPS 7 | « Manque les boissons fraîches » | Feature request | Backlog |

Catégories suggérées : **Bug critique** / **Bug mineur** / **Feature
request** / **UX friction** / **Compliment** / **Plainte resto** /
**Plainte livreur**.

### Triage hebdo (1h chaque vendredi)

1. Compter par catégorie.
2. Repérer les **3 plaintes récurrentes** = top 3 priorité.
3. Pour chaque plainte récurrente, décider : *fixer cette semaine /
   fixer le mois prochain / accepter et communiquer*.
4. Boucler avec **chaque** utilisateur qui a remonté (même un simple
   « C'est noté, on travaille dessus, merci »). Cette étape est ce qui
   transforme un beta-testeur en ambassadeur.

---

## KPI feedback à surveiller

| Métrique | Comment la calculer | Seuil d'alerte |
|---|---|---|
| **Taux de réponse au sondage in-app** | Réponses / commandes livrées | < 25% → simplifier encore le sondage |
| **Note moyenne in-app** | Moyenne pondérée des étoiles | < 4.0 → enquête approfondie |
| **NPS** (Form hebdo) | (% promoteurs 9-10) − (% détracteurs 0-6) | < 30 → red flag |
| **Délai de réponse aux WhatsApp critiques** | Temps entre plainte et accusé de réception | > 4h → embaucher renfort |
| **Plaintes "produit froid" / "retard"** | Total / semaine | > 10% des commandes → revoir équipe livreurs |

---

## Boucle d'amélioration produit

Les remontées beta doivent **alimenter directement** le backlog technique.
Workflow recommandé :

1. Ranger les bugs / features dans un **Github Issues** ou un Notion
   "Backlog Yakro Fê".
2. Labels suggérés : `beta-feedback`, `priorité-haute`, `priorité-moyenne`,
   `backlog`, `wontfix`.
3. Chaque vendredi soir : revue de la liste avec l'équipe technique
   (même si c'est juste toi). Décider ce qui rentre dans la semaine
   suivante.
4. **Communiquer publiquement** les fixs : un post Instagram / Status
   WhatsApp tous les vendredis avec « Cette semaine on a amélioré : … »
   crée une perception de produit vivant.

---

## Pièges classiques à éviter

### ⚠️ Le piège du "feedback positif biaisé"

Famille et amis (Segment A) te diront que tout va bien. **Ne fonde
aucune décision** sur leurs retours seuls. Pondère leur avis à 30%
maximum dans tes analyses.

### ⚠️ Le piège du "feedback feature request"

Beaucoup de beta-testeurs vont demander une feature qui **n'est pas
le problème**. Avant d'ajouter, demande-toi : *« quel problème
résoudrait cette feature ? »* Si la réponse est floue, c'est du bruit.

### ⚠️ Le piège du "syndrome du fondateur"

Tu vas avoir tendance à minimiser les plaintes (« ils n'ont pas
compris ») et amplifier les compliments. **Lis tes retours à voix haute
avec un coéquipier** une fois par semaine pour garder une lecture
objective.

---

## Critère go/no-go pour Phase 2

À J+28 (fin de Phase 1), check-list décisionnelle :

```
☐ NPS hebdo ≥ 40
☐ Note moyenne in-app ≥ 4.2 / 5
☐ Taux de complétion commande ≥ 90%
☐ Top 3 plaintes récurrentes adressées ou planifiées
☐ Aucun bug bloquant non corrigé depuis plus de 7 jours
☐ Volume de commandes en croissance hebdomadaire
```

Si **4 critères sur 6** ne sont pas verts : **prolonger Phase 1 de 2
semaines** plutôt que d'enchaîner. Un lancement grand public sur une
base instable coûte 10× plus cher en réputation que 2 semaines de
retard.
