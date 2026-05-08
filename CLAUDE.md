# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Yakro Fê** ("Yakro Go") is a Côte d'Ivoire-focused super-app for food delivery, built with Next.js 15, Firebase, and Google Genkit AI. The app targets three user personas — client, restaurateur (restaurant owner), and livreur (delivery driver) — each with their own dashboard and UI theme.

## Commands

```bash
npm run dev          # Start dev server on port 9005 (Turbopack)
npm run build        # Production build (includes NODE_OPTIONS=--max-old-space-size=4096)
npm run lint         # ESLint check (also uses 4096 MB limit)
npm run typecheck    # TypeScript type check without emitting
npm run genkit:dev   # Start Genkit AI dev UI
npm run genkit:watch # Start Genkit AI dev UI with file watching
```

Build and lint both require the `cross-env NODE_OPTIONS=--max-old-space-size=4096` flag (already set in `package.json`) to avoid OOM crashes. Always run `npm run build` and `npm run lint` before marking a task complete.

## Architecture

### Tech Stack
- **Next.js 15** with App Router and `force-dynamic` rendering (no static export)
- **Firebase** (Firestore, Auth, Storage) for the database, authentication, and file storage
- **Cloudinary** for image uploads/deletions (via `src/lib/cloudinary.ts`)
- **Google Genkit** with Gemini 2.0 Flash for all AI features
- **Zustand** for global data state (`useData` store in `src/contexts/data-context.tsx`)
- **Shadcn/UI** + **Tailwind CSS** + **Framer Motion** for UI

### Context / State Layer (`src/contexts/`)

The provider nesting order in `providers.tsx` is significant:

```
NextThemesProvider
  └─ FirebaseProvider      ← initializes Firebase SDK instances
       └─ AuthProvider     ← Firebase Auth + Firestore user profile subscription
            └─ ThemeRoleProvider  ← sets data-theme attribute per role/path
                 └─ DataProvider  ← Zustand store + Firestore real-time subscriptions
                      └─ CartProvider
```

- `useFirebase()` — raw Firebase service instances (`auth`, `db`, `storage`)
- `useAuth()` — current Firebase `User`, Firestore `UserProfile`, `activeRole`, role setters
- `useData()` — Zustand store with real-time Firestore subscriptions for `restaurants`, `menuItems`, `orders`, `stocks`
- `useCart()` — cart items, add/remove/clear helpers

### User Roles

Two independent role dimensions live on `UserProfile` in Firestore (`/utilisateurs/{uid}`):

| Field | Type | Purpose |
|---|---|---|
| `role` | `AppRole` | Functional persona: `client`, `restaurateur`, `livreur` |
| `roleSysteme` | `SystemRole` | Permissions tier: `SuperAdmin`, `Admin`, `User` |

`activeRole` (stored in `localStorage`) can differ from `role` to allow role-switching within allowed bounds. The `ThemeRoleProvider` maps the current route prefix to a `data-theme` attribute (`client`, `restaurateur`, `livreur`, `admin`) which drives CSS variable theming.

### AI Flows (`src/ai/`)

Genkit is initialized in `src/ai/genkit.ts` using `googleai/gemini-2.0-flash`.

Each AI feature has a two-file pattern:
- `src/ai/flows/definitions/<flow-name>.ts` — the actual Genkit flow (server-only, uses `ai.defineFlow`)
- `src/ai/flows/<flow-name>.ts` — client-safe wrapper that dynamically imports the definition only when `typeof window === 'undefined'`, with a mock fallback for the client

Never import from `definitions/` directly in client components or pages. Always use the wrapper.

Flows: `search-flow` (intelligent NL search), `personalized-recommendations`, `generate-menu-item`, `generate-image`, `generate-reviews`, `generate-audio-review`, `generate-video`.

### Server Actions (`src/app/actions/`)

All mutations go through Next.js Server Actions. The actions call Firestore directly (using the client SDK, not admin), and call Cloudinary for image uploads. `revalidatePath` is not used (the app relies on Firestore's real-time `onSnapshot` listeners in `DataProvider` for reactivity).

### Firestore Collections

| Collection | Description |
|---|---|
| `restaurants` | Restaurant documents |
| `plats` | Menu items (scoped by `restaurantId`) |
| `commandes` | Orders |
| `utilisateurs` | User profiles |
| `stock_items` | Inventory per restaurant |
| `audit_logs` | Admin action trail (via `src/lib/audit-logs.ts`) |
| `reviews` | Restaurant reviews |

Security rules are in `firestore.rules`. Rules use helper functions (`isSuperAdmin()`, `isRestaurateur()`, `isRestaurantOwner()`) that call `get()` on the `utilisateurs` collection to check the caller's role.

### Dashboard Routes (`src/app/dashboard/`)

Restaurateur-only dashboard sections:
- `menu/`, `new-menu-item/`, `my-restaurants/`, `new-restaurant/`, `my-restaurants/edit/`
- `orders/`, `stock/`, `earnings/`, `analytics/`, `boost/`
- `admin/` — SuperAdmin only

## Key Conventions (from AGENTS.md)

### Design System: "Yakro Elite"
- **Primary color**: Orange-500 (`#F97316`) for accents/CTAs
- **Dark background**: `#0A0A0B` / Slate-950
- **Glassmorphism**: `backdrop-blur-xl` with `border-white/5` borders
- **Typography**: `font-black`, `uppercase`, high letter-spacing for headings; fonts are Sora (`font-sora`/`font-ui`), Jakarta Sans (`font-body`), Fraunces (`font-headline`/`font-display`)
- **Animations**: `animate-slow-zoom` (cinematic bg), `animate-in fade-in slide-in-from-bottom-4` (entry), `animate-float` (hover)
- All keyframes are defined in `tailwind.config.ts`

### Coding Rules
- Use `@/` absolute imports everywhere (e.g. `@/components/...`, `@/lib/types`)
- **No inline `style` attributes** except for dynamic CSS variables (e.g. animation delays). All styling via Tailwind classes.
- **No `console.log`** — use `console.error` for real errors only
- All new data shapes go in `src/lib/types.ts`
- Always check `typeof window === 'undefined'` before importing server-only modules (Genkit flows, admin SDK)
- `src/lib/server-polyfills.ts` is imported at the top of `src/app/layout.tsx` to provide `Buffer`, `localStorage`, and `sessionStorage` mocks on the server

### Required Before Completing Any Task
1. No inline `style` attributes remain
2. No `console.log` statements remain
3. `npm run build` passes with 0 errors
4. `npm run lint` passes with 0 errors
