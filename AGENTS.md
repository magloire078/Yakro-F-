# Yakro-F Collaboration & Design Guide (AGENTS.md)

Welcome to the **Yakro-F** project. This document serves as a reference for both AI agents and human developers to ensure consistency, quality, and adherence to our "Hyper-Premium" design standards.

## 1. Design System: "Yakro Elite"

The "Yakro Elite" aesthetic is a cinematic, mobile-first design language that prioritizes visual impact and premium feel.

### Core Visual Principles
- **Color Palette**: 
    - **Primary**: Orange-500 (`#F97316`) for accents and calls-to-action.
    - **Background**: Deep Dark (`#0A0A0B`) or Slate-950.
    - **Containers**: Glassmorphism (Background blur `backdrop-blur-xl`, low opacity white borders `border-white/5`).
- **Typography**: 
    - Use high-contrast, bold, and often italicized headings.
    - Standard font: Sora or Inter (check `tailwind.config.ts` for primary font family).
    - Heavy use of `font-black`, `uppercase`, and increased `tracking` (letter spacing).
- **Animations**:
    - Cinematic backgrounds with `animate-slow-zoom`.
    - Content entry with `animate-in fade-in slide-in-from-bottom-4`.
    - Subtle floating effects with `animate-float`.
- **Interactive Elements**:
    - Hover effects on cards (scale, border color changes, glow).
    - Custom styled Shadcn/UI components (rounded corners, specific color variants).

## 2. Technical Standards

### UI Implementation
- **Tailwind CSS**: Use Tailwind utility classes for all styling. **Avoid inline styles** (`style={{...}}`) except for dynamic CSS variables (e.g., animation delays).
- **Components**: Prefer using and extending components in `src/components/ui/`.
- **Animations**: Define reusable keyframes in `tailwind.config.ts`.
- **Responsive Design**: Always prioritize mobile ergonomics. Interfaces must be tactile and readable on small screens.

### Backend & AI (Genkit)
- **Firebase**: Centralized in `src/firebase/client.ts` and `src/contexts/firebase-provider.tsx`.
- **AI Flows**: Genkit flows are defined in `src/ai/flows/definitions/` and wrapped in client-safe wrappers in `src/ai/flows/`.
- **Server Safety**: Always check for `typeof window === 'undefined'` before importing server-only modules or Genkit flows.

### Coding Practices
- **Console Logs**: Remove all `console.log` statements before finalizing a task. Use `console.error` for actual errors.
- **Types**: Maintain strict TypeScript typing. Update `src/lib/types.ts` when adding new data structures.
- **Imports**: Use absolute paths with the `@/` alias (e.g., `@/components/...`).

## 3. Production Readiness Checklist

Before considering a task "done":
1. [ ] **No Inline Styles**: Verify all `style` attributes are migrated to Tailwind or CSS variables.
2. [ ] **Clean Logs**: No `console.log` statements remain.
3. [ ] **Build Check**: `npm run build` must complete without errors.
4. [ ] **Linting**: `npm run lint` must pass with 0 errors.
5. [ ] **Visual Review**: Ensure animations are fluid and the UI feels premium.

---
*Created by Antigravity (Google Deepmind) for the Yakro-F team.*
