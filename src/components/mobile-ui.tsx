'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bike, ChevronRight, Clock, Minus, Plus, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Primitives de l'interface mobile « Yakro Elite · Nuit & Braise ».
 *
 * Ces composants sont partagés entre les écrans réels de l'application (accueil,
 * restaurant, panier, suivi) et le prototype de design (`src/app/design/mobile`).
 * Les styles viennent des classes `.yk-*` définies dans `globals.css`.
 */

export interface DockItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: number;
}

/**
 * Dock de navigation flottant.
 *
 * - sans `center` : les liens se partagent la largeur (rôles restaurateur/livreur) ;
 * - avec `center` : les liens encadrent l'action centrale surélevée (panier client).
 */
export function Dock({
  items,
  center,
  activeId,
  className,
}: {
  items: DockItem[];
  center?: React.ReactNode;
  activeId?: string;
  className?: string;
}) {
  const renderItem = (item: DockItem) => {
    const actif = item.id === activeId;
    const Icon = item.icon;
    const contenu = (
      <>
        <span className="relative">
          <Icon className="h-[21px] w-[21px]" strokeWidth={actif ? 2.4 : 1.9} />
          {item.badge ? (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          ) : null}
        </span>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.04em]">{item.label}</span>
      </>
    );
    const classes = cn(
      'flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors',
      actif ? 'text-orange-600 dark:text-orange-400' : 'text-[#8A8078] dark:text-white/45'
    );
    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={classes}
          aria-current={actif ? 'page' : undefined}
          aria-label={item.label}
        >
          {contenu}
        </Link>
      );
    }
    return (
      <button key={item.id} type="button" onClick={item.onClick} className={classes} aria-label={item.label}>
        {contenu}
      </button>
    );
  };

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[440px] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 md:hidden',
        className
      )}
    >
      <div className="flex h-[66px] items-center justify-between rounded-[1.6rem] border border-white/50 bg-white/80 px-3 shadow-[0_24px_50px_-24px_rgba(22,19,15,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-[#141416]/80 dark:shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9)]">
        {center ? (
          <>
            {items.slice(0, Math.ceil(items.length / 2)).map(renderItem)}
            {center}
            {items.slice(Math.ceil(items.length / 2)).map(renderItem)}
          </>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </nav>
  );
}

/**
 * Action centrale surélevée du dock (panier).
 */
export function DockFab({
  children,
  label,
  badge,
}: {
  children: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      aria-label={badge ? `${label}, ${badge} article${badge > 1 ? 's' : ''}` : label}
      className="relative -mt-7 flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[1.4rem] bg-[#16130F] text-white shadow-[0_18px_30px_-12px_rgba(22,19,15,0.8)] transition-transform active:scale-95 dark:bg-white dark:text-[#16130F]"
    >
      {children}
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[10px] font-black text-white dark:border-[#0A0A0B]">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </button>
  );
}

export function SectionHeader({
  title,
  action = 'Tout voir',
  href,
  onAction,
  className,
}: {
  title: React.ReactNode;
  action?: string;
  href?: string;
  onAction?: () => void;
  className?: string;
}) {
  const actionClasses =
    'inline-flex min-h-[40px] shrink-0 items-center gap-0.5 text-[12px] font-bold text-orange-600 dark:text-orange-400';
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2 className="yk-display text-[22px] leading-tight">{title}</h2>
      {href ? (
        <Link href={href} className={actionClasses}>
          {action}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : onAction ? (
        <button type="button" onClick={onAction} className={actionClasses}>
          {action}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function RatingPill({ note, className }: { note: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#16130F] shadow-sm backdrop-blur dark:bg-white/15 dark:text-white',
        className
      )}
    >
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {note.toFixed(1)}
    </span>
  );
}

export function MetaRow({
  temps,
  frais,
  distance,
  className,
}: {
  temps?: string | number;
  frais?: string | number;
  distance?: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-[11.5px] font-semibold text-[#6B625A] dark:text-white/55',
        className
      )}
    >
      {temps !== undefined && (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-orange-500" />
          {temps}
        </span>
      )}
      {frais !== undefined && (
        <>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" />
          <span className="inline-flex items-center gap-1">
            <Bike className="h-3.5 w-3.5 text-emerald-500" />
            {frais}
          </span>
        </>
      )}
      {distance !== undefined && (
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
  min = 0,
}: {
  valeur: number;
  onChange: (v: number) => void;
  compact?: boolean;
  min?: number;
}) {
  const size = compact ? 'h-9 w-9' : 'h-10 w-10';
  return (
    <div className="flex items-center gap-2 rounded-full border border-black/[0.07] bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.06]">
      <button
        type="button"
        aria-label="Retirer un article"
        onClick={() => onChange(Math.max(min, valeur - 1))}
        className={cn(
          size,
          'flex items-center justify-center rounded-full text-[#6B625A] transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10'
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-4 text-center text-[14px] font-bold tabular-nums">{valeur}</span>
      <button
        type="button"
        aria-label="Ajouter un article"
        onClick={() => onChange(valeur + 1)}
        className={cn(
          size,
          'flex items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-transform active:scale-90'
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
