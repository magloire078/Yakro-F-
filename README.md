# Yakro Fê

Application Next.js 15 + Capacitor de livraison à domicile (rôles client,
restaurateur, livreur), avec Firebase / Firestore et des flows IA Genkit.

Le design system "Yakro Elite" est documenté dans [`AGENTS.md`](./AGENTS.md).

## Démarrage rapide

1. Copier `.env.example` vers `.env.local` et renseigner les clés.
2. Installer les dépendances : `npm install`.
3. Lancer le serveur de dev : `npm run dev` (port 9005).
4. Pour les flows IA Genkit en local : `npm run genkit:dev`.

## Scripts utiles

- `npm run dev` — serveur Next.js (port 9005).
- `npm run build` — build de production (lint + typecheck activés).
- `npm run lint` — ESLint.
- `npm run typecheck` — vérification TypeScript stricte.
- `npm run test` — suite Vitest.
- `npm run genkit:dev` / `npm run genkit:watch` — flows IA Genkit.

## Structure

- `src/app/` — routes Next.js (App Router) et server actions (`src/app/actions/`).
- `src/components/` — composants UI (Shadcn + design "Yakro Elite").
- `src/contexts/` — contextes React (Firebase, auth, data, cart).
- `src/ai/flows/` — wrappers client-safe des flows Genkit définis dans
  `src/ai/flows/definitions/`.
- `src/lib/` — utilitaires (Cloudinary, stocks, types).
- `firestore.rules` — règles de sécurité Firestore.
