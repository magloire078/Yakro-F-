'use client';

import * as React from 'react';
import { Banknote, ChevronRight, LockKeyhole, MapPin, Smartphone, TicketPercent, Trash2 } from 'lucide-react';
import { FoodImage } from '@/components/food-image';
import { cn } from '@/lib/utils';
import { DEMO, fcfa } from './data';
import { BackButton, MobileScreen, StatusBar, Stepper } from './ui';

export function CartScreen() {
  const [quantites, setQuantites] = React.useState<Record<string, number>>(
    Object.fromEntries(DEMO.panier.lignes.map((l) => [l.id, l.quantite]))
  );
  const [paiement, setPaiement] = React.useState('especes');
  const [code, setCode] = React.useState('');

  const sousTotal = DEMO.panier.lignes.reduce(
    (sum, l) => sum + (quantites[l.id] ?? 0) * l.prix,
    0
  );
  const total = sousTotal + DEMO.panier.livraison;
  const articles = Object.values(quantites).reduce((a, b) => a + b, 0);

  return (
    <MobileScreen>
      <StatusBar />

      <header className="flex items-center justify-between gap-3 px-5 pt-1">
        <BackButton />
        <span className="yk-label">Panier</span>
        <button
          type="button"
          aria-label="Vider le panier"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#8A8078] shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60"
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </header>

      <h1 className="yk-display mt-3 px-5 text-[32px] leading-none">
        Votre <span className="yk-italic text-orange-600 dark:text-orange-400">panier</span>
      </h1>

      {/* Restaurant */}
      <div className="mt-4 flex items-center justify-between px-5">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#6B625A] dark:text-white/55">
          <MapPin className="h-4 w-4 text-orange-500" />
          {DEMO.panier.restaurant}
          <span className="text-[#C9C0B6] dark:text-white/25">· 25–35 min</span>
        </div>
        <button type="button" className="inline-flex min-h-[40px] items-center text-[11.5px] font-bold text-orange-600 dark:text-orange-400">
          Modifier
        </button>
      </div>

      {/* Lignes */}
      <div className="mt-3 space-y-3 px-5">
        {DEMO.panier.lignes.map((ligne) => {
          const q = quantites[ligne.id] ?? 0;
          return (
            <article key={ligne.id} className={cn('yk-card flex gap-3.5 p-3 transition-opacity', q === 0 && 'opacity-45')}>
              <span className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[1.05rem]">
                <FoodImage src={ligne.image} alt={ligne.nom} kind="plat" sizes="76px" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="yk-display truncate text-[15.5px] leading-tight">{ligne.nom}</h3>
                <p className="mt-0.5 truncate text-[11px] text-[#8A8078] dark:text-white/45">{ligne.options}</p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="yk-display text-[15.5px] text-orange-600 dark:text-orange-400">{fcfa(ligne.prix)}</span>
                  <Stepper compact valeur={q} onChange={(v) => setQuantites((s) => ({ ...s, [ligne.id]: v }))} />
                </div>
              </div>
            </article>
          );
        })}

        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-[1.2rem] border border-dashed border-black/15 py-3 text-[12.5px] font-bold text-[#6B625A] dark:border-white/15 dark:text-white/60"
        >
          <span className="text-[16px] leading-none text-orange-500">+</span> Ajouter un plat
        </button>
      </div>

      {/* Code promo */}
      <div className="mt-4 px-5">
        <div className="flex items-center gap-2 rounded-[1.1rem] border border-black/[0.06] bg-white p-1.5 pl-3.5 dark:border-white/10 dark:bg-[#141416]">
          <TicketPercent className="h-4 w-4 text-orange-500" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code promo"
            aria-label="Code promo"
            className="h-11 w-full bg-transparent text-[13px] font-semibold outline-none placeholder:font-medium placeholder:text-[#A79E96] dark:placeholder:text-white/35"
          />
          <button
            type="button"
            className="h-10 shrink-0 rounded-[0.8rem] bg-[#16130F] px-3.5 text-[11.5px] font-bold text-white dark:bg-white dark:text-[#16130F]"
          >
            Appliquer
          </button>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="mt-4 px-5">
        <div className="yk-card p-4">
          <div className="space-y-2 text-[12.5px]">
            <div className="flex justify-between text-[#6B625A] dark:text-white/55">
              <span>Sous-total ({articles} article{articles > 1 ? 's' : ''})</span>
              <span className="font-semibold tabular-nums">{fcfa(sousTotal)}</span>
            </div>
            <div className="flex justify-between text-[#6B625A] dark:text-white/55">
              <span>Livraison</span>
              <span className="font-semibold tabular-nums">{fcfa(DEMO.panier.livraison)}</span>
            </div>
            <div className="flex justify-between border-t border-black/[0.06] pt-2.5 text-[15px] font-bold dark:border-white/[0.08]">
              <span>Total</span>
              <span className="yk-display text-orange-600 dark:text-orange-400">{fcfa(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Paiement */}
      <div className="mt-4 px-5">
        <p className="yk-label mb-2 px-1">Paiement</p>
        <div className="space-y-2">
          {DEMO.paiements.map((p) => {
            const Icon = p.icone === 'banknote' ? Banknote : Smartphone;
            const actif = paiement === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaiement(p.id)}
                aria-pressed={actif}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[1.15rem] border p-3 text-left transition-colors',
                  actif
                    ? 'border-orange-500 bg-orange-500/[0.06]'
                    : 'border-black/[0.06] bg-white dark:border-white/10 dark:bg-[#141416]'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-[0.8rem]',
                    actif ? 'bg-orange-500 text-white' : 'bg-black/[0.04] text-[#6B625A] dark:bg-white/[0.06] dark:text-white/60'
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold">{p.nom}</span>
                  <span className="block text-[11px] text-[#8A8078] dark:text-white/45">{p.detail}</span>
                </span>
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2',
                    actif ? 'border-orange-500 bg-orange-500' : 'border-black/15 dark:border-white/20'
                  )}
                >
                  {actif && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[130px]" aria-hidden="true" />

      <div className="yk-bottom-bar mx-auto max-w-[440px]">
        <button type="button" className="yk-cta w-full justify-between px-5">
          <span className="flex items-center gap-2 text-[14px]">
            <LockKeyhole className="h-4 w-4" /> Payer {fcfa(total)}
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </MobileScreen>
  );
}
