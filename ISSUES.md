# Yakro-Fê Technical Debt & Issues Tracking

Ce document centralise les problèmes architecturaux, les bugs connus et les améliorations prioritaires pour stabiliser l'application Yakro-Fê.

## 🔴 Critiques (Bloquants)

- [x] **Erreurs de Mémoire (OOM)** : `npm run build` et `npm run lint` échouent souvent par manque de mémoire.
    - *Fix* : Ajout de `cross-env NODE_OPTIONS=--max-old-space-size=4096` dans `package.json`.
- [x] **Configuration ESLint Obsolète** : `eslint.config.mjs` mis à jour pour Next.js 15+ et ESLint 9.
    - *Statut* : Fonctionnel avec `FlatCompat`.
- [ ] **Index Firestore Absents** : `firestore.indexes.json` est vide.
    - *Impact* : Les requêtes complexes (filtres + tris) pourraient échouer.

## 🟠 Prioritaires (Stabilité)

- [x] **Absence de Buffer Global** : Crash dans `buffer-equal-constant-time`.
    - *Fix* : Polyfill injecté dans `src/lib/server-polyfills.ts`.
- [x] **Gestion des Erreurs Firestore Silencieuse** : Les erreurs de requêtes étaient masquées.
    - *Fix* : Refactorisation de `setupSubscription` dans `data-context.tsx`.
- [ ] **Dépendances Next.js** : Vérifier la compatibilité des versions (`next`, `react`, `firebase`).

## 🟡 Améliorations (Qualité & UX)

- [ ] **Optimisation SSR** : S'assurer que les polyfills n'augmentent pas inutilement la taille du bundle client.
- [ ] **Audit des Prompts Genkit** : Améliorer le réalisme des images générées (éviter le look "trop IA").
- [ ] **Respect strict de AGENTS.md** : Nettoyer les `console.log` restants et migrer les styles inline vers Tailwind.

---
*Dernière mise à jour : 5 Mai 2026*
