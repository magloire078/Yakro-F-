# Yakro-Fê Technical Debt & Issues Tracking

Ce document centralise les problèmes architecturaux, les bugs connus et les améliorations prioritaires pour stabiliser l'application Yakro-Fê.

## 🔴 Critiques (Bloquants)

- [x] **Erreurs de Mémoire (OOM)** : `npm run build` et `npm run lint` échouent souvent par manque de mémoire.
    - *Fix* : Ajout de `cross-env NODE_OPTIONS=--max-old-space-size=4096` dans `package.json`.
- [x] **Configuration ESLint Obsolète** : `eslint.config.mjs` mis à jour pour Next.js 15+ et ESLint 9.
    - *Statut* : Fonctionnel avec `FlatCompat`.
- [x] **Index Firestore Absents** : `firestore.indexes.json` est vide.
    - *Vérifié (12 oct. 2026)* : aucune requête ne combine plusieurs champs (un seul `where` ou un seul `orderBy` par requête). Firestore crée automatiquement les index mono-champ : aucun index composite n'est nécessaire.
    - *À surveiller* : toute nouvelle requête `where` + `orderBy` sur des champs différents exigera un index déclaré ici (l'erreur Firestore fournit le lien de création).

## 🟠 Prioritaires (Stabilité)

- [x] **Absence de Buffer Global** : Crash dans `buffer-equal-constant-time`.
    - *Fix* : Polyfill injecté dans `src/lib/server-polyfills.ts`.
- [x] **Gestion des Erreurs Firestore Silencieuse** : Les erreurs de requêtes étaient masquées.
    - *Fix* : Refactorisation de `setupSubscription` dans `data-context.tsx`.
- [ ] **Dépendances Next.js** : Vérifier la compatibilité des versions (`next`, `react`, `firebase`).

## 🟡 Améliorations (Qualité & UX)

- [x] **Audit des Prompts Genkit** : Améliorer le réalisme des images générées (éviter le look "trop IA").
    - *Résolu (13 oct. 2026)* : `generate-image-flow.ts` révisé avec des directives photographiques documentaires 35mm/50mm macro, textures culinaires ivoiriennes réelles (attiéké granuleux, piments, oignons, braisé au feu de bois, huiles naturelles) et contraintes négatives strictes (zéro CGI/plastique/3D). Prompts enrichis de la description et du type de cuisine.
- [x] **Respect strict de AGENTS.md** : Nettoyer les `console.log` restants et migrer les styles inline vers Tailwind.
    - *Vérifié (12 oct. 2026)* : aucun `console.log` ; les seuls `style={{…}}` restants (`ui/chart.tsx`, `ui/progress.tsx`) portent des valeurs dynamiques, autorisées par AGENTS.md.
- [ ] **Patch `buffer-equal-constant-time` perdu après `npm install`** : si le `postinstall` ne s'exécute pas, le build échoue sous Node 25 (`SlowBuffer` supprimé).
    - *Contournement* : `npx patch-package` pour réappliquer `patches/buffer-equal-constant-time+1.0.1.patch`.
- [ ] **Tests des règles Firestore** : `npm run test:rules` exige Java 21+ (firebase-tools 15).

---
*Dernière mise à jour : 12 octobre 2026*
