'use client';

import * as React from 'react';
import { Check, Headset, MessageCircle, Phone, Star, Store, Home } from 'lucide-react';
import { FoodImage } from '@/components/food-image';
import { cn } from '@/lib/utils';
import { DEMO, fcfa } from './data';
import { BackButton, Dock, MobileScreen, StatusBar } from './ui';

export function TrackingScreen() {
  const [dock, setDock] = React.useState<'accueil' | 'explorer' | 'panier' | 'commandes' | 'profil'>('commandes');

  return (
    <MobileScreen>
      {/* Carte / en-tête sombre */}
      <div className="relative overflow-hidden bg-[#0B0B0D] pb-10 text-white">
        <StatusBar dark />
        <div className="flex items-center justify-between px-5 pt-1">
          <BackButton />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Suivi en direct
          </span>
          <button
            type="button"
            aria-label="Aide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-white backdrop-blur"
          >
            <Headset className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-end justify-between px-5 pt-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Commande #{DEMO.suivi.numero}</p>
            <h1 className="yk-display mt-1.5 text-[32px] leading-[1.02]">
              En route
              <br />
              <span className="yk-italic text-orange-400">vers vous</span>
            </h1>
          </div>
          <div className="mb-1 text-right">
            <p className="yk-display text-[40px] leading-none text-orange-400">{DEMO.suivi.eta}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Arrivée 21:26</p>
          </div>
        </div>

        {/* « Carte » stylisée : trajet restaurant → domicile */}
        <div className="relative mx-5 mt-5 h-[220px] overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-[radial-gradient(120%_120%_at_20%_0%,rgba(249,115,22,0.22),transparent_55%),radial-gradient(100%_100%_at_90%_100%,rgba(16,185,129,0.16),transparent_55%),#111113]">
          {/* Trame de rues */}
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:44px_44px]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(115deg,transparent_46%,white_47%,white_49%,transparent_50%)] [background-size:120px_120px]" />

          <svg viewBox="0 0 380 220" fill="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path
              d="M52 176 C 96 168, 96 118, 142 112 S 214 128, 236 92 S 300 52, 330 44"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M52 176 C 96 168, 96 118, 142 112 S 214 128, 236 92 S 300 52, 330 44"
              stroke="#F97316"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="7 9"
            />
          </svg>

          {/* Restaurant */}
          <div className="absolute left-[38px] top-[150px] flex flex-col items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#1B1B1F] text-white shadow-lg">
              <Store className="h-4 w-4" />
            </span>
            <span className="mt-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur">Maquis du Val</span>
          </div>

          {/* Domicile */}
          <div className="absolute right-[26px] top-[26px] flex flex-col items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-lg backdrop-blur">
              <Home className="h-4 w-4" />
            </span>
            <span className="mt-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur">Quartier 2000</span>
          </div>

          {/* Livreur */}
          <div className="absolute left-[186px] top-[74px] flex flex-col items-center">
            <span className="relative h-12 w-12 overflow-hidden rounded-full ring-4 ring-orange-500/25">
              <FoodImage src={DEMO.suivi.livreur.avatar} alt={DEMO.suivi.livreur.nom} kind="restaurant" sizes="48px" />
            </span>
            <span className="mt-1 rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black text-white shadow-lg shadow-orange-500/40">
              {DEMO.suivi.eta}
            </span>
          </div>
        </div>
      </div>

      {/* Feuille de suivi */}
      <div className="relative -mt-5 rounded-t-[2rem] bg-[#FAF7F2] px-5 pt-5 dark:bg-[#0A0A0B]">
        {/* Étapes */}
        <div className="yk-card p-4">
          <ol className="space-y-3.5">
            {DEMO.suivi.etapes.map((etape, i) => (
              <li key={etape.label} className="flex items-start gap-3">
                <span className="flex flex-col items-center">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                      etape.fait
                        ? etape.actif
                          ? 'bg-orange-500 text-white shadow-[0_0_0_4px_rgba(249,115,22,0.15)]'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-black/[0.05] text-[#A79E96] dark:bg-white/[0.06] dark:text-white/30'
                    )}
                  >
                    {etape.fait ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  {i < DEMO.suivi.etapes.length - 1 && (
                    <span className={cn('mt-1 h-6 w-px', etape.fait ? 'bg-emerald-500/30' : 'bg-black/10 dark:bg-white/10')} />
                  )}
                </span>
                <div className="flex flex-1 items-baseline justify-between gap-2 pt-0.5">
                  <span className={cn('text-[13px] font-bold', etape.actif ? 'text-[#16130F] dark:text-white' : 'text-[#6B625A] dark:text-white/55')}>
                    {etape.label}
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums text-[#A79E96] dark:text-white/35">{etape.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Livreur */}
        <div className="yk-card mt-3 flex items-center gap-3 p-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
            <FoodImage src={DEMO.suivi.livreur.avatar} alt={DEMO.suivi.livreur.nom} kind="restaurant" sizes="48px" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">{DEMO.suivi.livreur.nom}</p>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#8A8078] dark:text-white/45">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {DEMO.suivi.livreur.note} · {DEMO.suivi.livreur.courses} courses · {DEMO.suivi.livreur.vehicule}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Appeler le livreur"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16130F] text-white dark:bg-white dark:text-[#16130F]"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Écrire au livreur"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Rappel commande */}
        <div className="yk-card mt-3 flex items-center justify-between p-3.5">
          <div>
            <p className="yk-label">Votre commande</p>
            <p className="mt-1 text-[13px] font-bold">2 articles · {DEMO.panier.restaurant}</p>
          </div>
          <span className="yk-display text-[16px] text-orange-600 dark:text-orange-400">{fcfa(DEMO.panier.total)}</span>
        </div>

        <div className="h-[150px]" aria-hidden="true" />
      </div>

      <Dock active={dock} panier={0} onSelect={setDock} />
    </MobileScreen>
  );
}
