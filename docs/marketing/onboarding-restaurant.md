# Onboarding restaurant — Check-list 90 minutes

Document de travail interne pour intégrer un nouveau restaurateur sur
Yakro Fê. À imprimer ou avoir sur tablette pendant la visite.

---

## Pré-onboarding (à faire avant la visite — 30 min)

```
☐ Contrat signé en 2 exemplaires (1 chacun)
☐ Compte Firebase Auth créé pour le restaurateur
    (email + mot de passe temporaire)
☐ Document Firestore /restaurants créé avec :
    - proprietaireId = uid du restaurateur
    - nom, cuisine, adresse
    - latitude, longitude
    - tempsDeLivraison estimé
    - fraisDeLivraison fixés
☐ Briefing photographe si shooting prévu le même jour
☐ Plaquette + contrat imprimés à apporter
```

## Sur place (60 min)

### Étape 1 — Accueil & cadre (10 min)

```
☐ Tour rapide de l'établissement avec le restaurateur
☐ Identifier la zone de "remise commande" pour les livreurs
☐ Validation des heures d'ouverture / de service livraison
```

### Étape 2 — Connexion & dashboard (15 min)

```
☐ Le restaurateur installe l'app Yakro Fê (ou ouvre yakro-fe.ci)
☐ Première connexion avec ses identifiants
☐ Changement du mot de passe temporaire
☐ Tour du dashboard : commandes / menu / stocks / analytics
☐ Démo : comment accepter une commande, comment marquer "Prête"
```

### Étape 3 — Carte & photos (25 min)

```
☐ Saisie des 5 premiers plats minimum :
    - Nom (ex: "Attiéké poulet braisé")
    - Description (1 phrase appétissante)
    - Prix
    - Catégorie (Plat / Entrée / Dessert / Boisson)
    - Allergènes / accompagnements / boissons disponibles
☐ Photos pro shootées (si Pack Fondateur)
    OU upload de photos existantes
    (rappel : pas de picsum, pas de captures internet)
☐ Validation du rendu côté client (faire défiler dans l'app)
```

### Étape 4 — Stock & ingrédients (10 min, optionnel)

```
☐ Saisie des 3-5 ingrédients critiques
    (poisson, riz, attiéké, etc.)
☐ Quantité initiale, seuil d'alerte, unité
☐ Démo : la notification stock bas qui arrive après une commande
```

### Étape 5 — Test de bout en bout (10 min)

```
☐ Une commande test passée par toi depuis ton téléphone (en client)
☐ Le restaurateur la voit arriver dans son dashboard
☐ Il l'accepte → préparation → marque "Prête"
☐ Vérification du QR code de remise au livreur
☐ Suppression / annulation de la commande test
```

### Étape 6 — Pratiques & contact (5 min)

```
☐ Ajout du contact Yakro Fê en favori dans son téléphone
☐ Numéro WhatsApp d'urgence
    (problème commande, livreur en retard, etc.)
☐ Calendrier : prochain point de contrôle à J+7
☐ Photo "before/after" pour le réseau social Yakro Fê
☐ Autocollant "Disponible sur Yakro Fê" remis et apposé visiblement
```

## Post-onboarding (à faire le soir même — 15 min)

```
☐ Photo de sortie postée sur les réseaux sociaux Yakro Fê
    (avec accord du restaurateur pour le tag)
☐ Mise à jour du Sheet de tracking : statut → "Onboardé"
☐ Email de bienvenue automatique envoyé au restaurateur
☐ Rappel J+7 programmé dans ton agenda
```

---

## Critères "Onboarding réussi" (à vérifier avant de partir)

- ✅ Le restaurateur sait se connecter seul à son dashboard
- ✅ Il a vu une commande test arriver et l'a traitée jusqu'à "Prête"
- ✅ Au moins 5 plats sont visibles côté client avec photos correctes
- ✅ Il a notre numéro WhatsApp d'urgence en favori
- ✅ L'autocollant Yakro Fê est apposé visiblement à l'entrée

Si l'un de ces critères n'est pas validé, **rester 15 minutes de plus
plutôt que de partir trop tôt**. Un onboarding bâclé = un restaurateur
qui ne traite pas ses premières commandes = mauvaise expérience client
× 100 (les premiers utilisateurs sont les plus exposés à parler de ce
qui ne marche pas).
