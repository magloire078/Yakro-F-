'use client';

import * as React from 'react';
import {
  BatteryFull,
  Bike,
  Check,
  ChevronRight,
  Clock,
  Compass,
  House,
  Minus,
  Plus,
  ReceiptText,
  ShoppingBag,
  Signal,
  Star,
  UserRound,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Barre d'état (uniquement dans le prototype de design) ─────────────── */

export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-11 items-end justify-between px-6 pb-1 text-[12px] font-semibold tracking-tight',
        dark ? 'text-white' : 'text-[#16130F] dark:text-white'
      )}
      aria-hidden="true"
    >
      <span>21:07</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </div>
    </div>
  );
}

/* ── Écran ─────────────────────────────────────────────────────────────── */

export function MobileScreen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('yk-screen relative mx-auto min-h-dvh w-full max-w-[440px] overflow-x-hidden', className)}>
      {children}
    </div>
  );
}

/* ── Titre de section éditorial ────────────────────────────────────────── */

export function SectionHeader({
  title,
  action = 'Tout voir',
  className,
}: {
  title: React.ReactNode;
  action?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-5', className)}>
      <h2 className="yk-display text-[22px] leading-tight">{title}</h2>
      <button
        type="button"
        className="inline-flex min-h-[40px] shrink-0 items-center gap-0.5 text-[12px] font-bold text-orange-600 dark:text-orange-400"
      >
        {action}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Dock de navigation flottant ───────────────────────────────────────── */

const DOCK_ITEMS = [
  { id: 'accueil', label: 'Accueil', Icon: House },
  { id: 'explorer', label: 'Explorer', Icon: Compass },
  { id: 'panier', label: 'Panier', Icon: ShoppingBag },
  { id: 'commandes', label: 'Commandes', Icon: ReceiptText },
  { id: 'profil', label: 'Moi', Icon: UserRound },
] as const;

export function Dock({
  active = 'accueil',
  panier = 1,
  onSelect,
}: {
  active?: (typeof DOCK_ITEMS)[number]['id'];
  panier?: number;
  onSelect?: (id: (typeof DOCK_ITEMS)[number]['id']) => void;
}) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[440px] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2"
    >
      <div className="yk-glass flex h-[66px] items-center justify-between rounded-[1.6rem] px-3 shadow-[0_24px_50px_-24px_rgba(22,19,15,0.5)] dark:shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9)]">
        {DOCK_ITEMS.map(({ id, label, Icon }) => {
          const isActive = id === active;
          if (id === 'panier') {
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect?.(id)}
                aria-label={`Panier, ${panier} article${panier > 1 ? 's' : ''}`}
                className={cn(
                  'relative -mt-7 flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[1.4rem] text-white transition-transform active:scale-95',
                  isActive
                    ? 'bg-orange-500 shadow-[0_18px_30px_-12px_rgba(249,115,22,0.95)]'
                    : 'bg-[#16130F] shadow-[0_18px_30px_-12px_rgba(22,19,15,0.8)] dark:bg-white dark:text-[#16130F]'
                )}
              >
                <ShoppingBag className="h-6 w-6" />
                {panier > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[10px] font-black dark:border-[#0A0A0B]">
                    {panier}
                  </span>
                )}
              </button>
            );
          }
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect?.(id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors',
                isActive ? 'text-orange-600 dark:text-orange-400' : 'text-[#8A8078] dark:text-white/45'
              )}
            >
              <Icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.4 : 1.9} />
              <span className="text-[9.5px] font-bold uppercase tracking-[0.04em]">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Petits blocs réutilisables ────────────────────────────────────────── */

export function RatingPill({ note, className }: { note: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#16130F] shadow-sm backdrop-blur dark:bg-white/15 dark:text-white', className)}>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {note.toFixed(1)}
    </span>
  );
}

export function MetaRow({ temps, frais, distance }: { temps: string; frais: string; distance?: string }) {
  return (
    <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#6B625A] dark:text-white/55">
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5 text-orange-500" />
        {temps}
      </span>
      <span className="h-3 w-px bg-black/10 dark:bg-white/15" />
      <span className="inline-flex items-center gap-1">
        <Bike className="h-3.5 w-3.5 text-emerald-500" />
        {frais}
      </span>
      {distance && (
        <>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" />
          <span>{distance}</span>
        </>
      )}
    </div>
  );
}

export function Stepper({
  valeur,
  onChange,
  compact = false,
}: {
  valeur: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  const size = compact ? 'h-10 w-10' : 'h-11 w-11';
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-black/[0.07] bg-white p-1 dark:border-white/10 dark:bg-white/[0.06]">
      <button
        type="button"
        aria-label="Retirer un article"
        onClick={() => onChange(Math.max(0, valeur - 1))}
        className={cn(size, 'flex items-center justify-center rounded-full text-[#6B625A] transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10')}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-4 text-center text-[14px] font-bold tabular-nums">{valeur}</span>
      <button
        type="button"
        aria-label="Ajouter un article"
        onClick={() => onChange(valeur + 1)}
        className={cn(size, 'flex items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-transform active:scale-90')}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
      <Check className="h-3 w-3" strokeWidth={3} /> Vérifié
    </span>
  );
}

export function BackButton({ label = 'Retour' }: { label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/80 text-[#16130F] shadow-sm backdrop-blur-xl transition-transform active:scale-95 dark:border-white/10 dark:bg-black/40 dark:text-white"
    >
      <ChevronRight className="h-5 w-5 rotate-180" />
    </button>
  );
}

/* ── Bouton principal ──────────────────────────────────────────────────── */

export function PrimaryCta({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn('yk-cta w-full', className)}>
      {children}
    </button>
  );
}
