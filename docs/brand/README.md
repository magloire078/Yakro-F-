# Yakro Fê — Brand book

Identité de marque structurée pour Yakro Fê, à utiliser comme
référence par toute personne qui produit du contenu pour la marque
(designers, devs, copywriters, photographes, partenaires).

## Sommaire

| Document | Pour qui | Quand l'ouvrir |
|---|---|---|
| [`brand-quick-reference.md`](./brand-quick-reference.md) | Tout le monde | À avoir sous la main en permanence (1 page) |
| [`brand-essence-and-voice.md`](./brand-essence-and-voice.md) | Copywriters, marketing, support client | Avant de rédiger un message officiel |
| [`visual-system.md`](./visual-system.md) | Designers, devs front-end | Avant de créer ou modifier un écran |
| [`photography-and-imagery.md`](./photography-and-imagery.md) | Photographes, social media manager | Avant un shooting ou un post visuel |

## Cohérence avec le code

Le brand book est **aligné avec ce qui est déjà implémenté** dans
l'app Yakro Fê :

- **Couleurs** : variables CSS dans `src/app/globals.css` et tokens
  Tailwind dans `tailwind.config.ts`.
- **Polices** : chargées dans `src/app/fonts.ts` (Sora, Belleza,
  Alegreya).
- **Composants signature** : exemples dans `src/components/sidebar.tsx`,
  `src/app/dashboard/admin/page.tsx`, `src/components/admin-alerts.tsx`.
- **Logo** : composant `Icons.logo` dans `src/components/icons.tsx`.

Toute évolution du brand book doit être **synchronisée avec ces
fichiers**, et inversement.

## Évolution

Ce brand book est un document vivant. Mises à jour majeures à prévoir :

- Après le lancement public (Phase 2), réviser la section "tonalité"
  avec les retours utilisateurs réels.
- Si extension à d'autres villes (Bouaké, Korhogo…), revoir la section
  "Yakroois·es" pour en faire un cadre plus large.
- À chaque nouvelle catégorie de service (courses, médicaments…),
  étendre le vocabulaire signature.
