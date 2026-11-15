'use client';

import * as React from 'react';
import { Bell, ChevronDown, ChevronRight, MapPin, Search, SlidersHorizontal, Sparkles, Star } from 'lucide-react';
import { FoodImage } from '@/components/food-image';
import { cn } from '@/lib/utils';
import { DEMO, fcfa } from './data';
import { Dock, MetaRow, MobileScreen, RatingPill, SectionHeader, StatusBar } from './ui';

export function HomeScreen() {
  const [categorie, setCategorie] = React.useState('tout');
  const [dock, setDock] = React.useState<'accueil' | 'explorer' | 'panier' | 'commandes' | 'profil'>('accueil');

  return (
    <MobileScreen>
      <StatusBar />

      {/* En-tête : localisation + profil */}
      <header className="flex items-start justify-between gap-3 px-5 pt-1">
        <button type="button" className="flex flex-col items-start gap-1 text-left">
          <span className="yk-label flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <MapPin className="h-3 w-3" strokeWidth={2.6} />
            {DEMO.utilisateur.ville}
          </span>
          <span className="flex items-center gap-1 text-[15px] font-bold text-[#16130F] dark:text-white">
            {DEMO.utilisateur.quartier}
            <ChevronDown className="h-4 w-4 text-[#8A8078]" />
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#16130F] shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-[#0A0A0B]" />
          </button>
          <span className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-orange-500/70 ring-offset-2 ring-offset-[#FAF7F2] dark:ring-offset-[#0A0A0B]">
            <FoodImage src={DEMO.utilisateur.avatar} alt={DEMO.utilisateur.prenom} kind="restaurant" sizes="40px" />
          </span>
        </div>
      </header>

      {/* Titre éditorial */}
      <h1 className="yk-display mt-4 px-5 text-[34px] leading-[1.02]">
        Bonsoir {DEMO.utilisateur.prenom},
        <br />
        <span className="yk-italic text-orange-600 dark:text-orange-400">on mange quoi&nbsp;?</span>
      </h1>
      <p className="mt-2 px-5 text-[13.5px] leading-relaxed text-[#6B625A] dark:text-white/55">
        Les meilleurs maquis de Yakro, livrés chauds en moins de 35 minutes.
      </p>

      {/* Recherche */}
      <div className="mt-5 px-5">
        <div className="flex items-center gap-2 rounded-[1.35rem] border border-black/[0.05] bg-white p-1.5 pl-4 shadow-[0_18px_40px_-24px_rgba(22,19,15,0.45)] dark:border-white/[0.07] dark:bg-[#141416]">
          <Search className="h-[18px] w-[18px] shrink-0 text-[#8A8078]" />
          <input
            type="search"
            placeholder="Un maquis, un plat…"
            aria-label="Rechercher un restaurant ou un plat"
            className="h-10 w-full min-w-0 bg-transparent text-[14px] font-medium outline-none placeholder:text-[#A79E96] dark:placeholder:text-white/35"
          />
          <button
            type="button"
            aria-label="Filtres"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-orange-500 text-white shadow-[0_10px_20px_-8px_rgba(249,115,22,0.9)]"
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Catégories */}
      <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {DEMO.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategorie(c.id)}
            className={cn('yk-chip shrink-0', categorie === c.id && 'yk-chip-active')}
          >
            <span aria-hidden="true">{c.icone}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* En vedette */}
      <SectionHeader title="En vedette ce soir" className="mt-7" />
      <div className="scrollbar-hide mt-3 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-2">
        {DEMO.vedettes.map((r) => (
          <article
            key={r.id}
            className="group relative h-[178px] w-[268px] shrink-0 snap-start overflow-hidden rounded-[1.6rem] shadow-[0_22px_45px_-22px_rgba(22,19,15,0.55)]"
          >
            <FoodImage src={r.image} alt={r.nom} kind="restaurant" sizes="268px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              {r.badge ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-lg shadow-orange-500/40">
                  <Sparkles className="h-3 w-3" /> {r.badge}
                </span>
              ) : (
                <span />
              )}
              <RatingPill note={r.note} />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
              <h3 className="yk-display text-[19px] leading-tight">{r.nom}</h3>
              <p className="mt-0.5 text-[11.5px] font-medium text-white/75">
                {r.cuisine} · {r.avis} avis
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11.5px] font-semibold text-white/90">
                <span>{r.temps}</span>
                <span className="h-2.5 w-px bg-white/25" />
                <span>{r.frais}</span>
                <span className="h-2.5 w-px bg-white/25" />
                <span>{r.distance}</span>
                <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Près de toi */}
      <SectionHeader title="Ouverts près de toi" className="mt-6" action="Carte" />
      <div className="mt-3 space-y-3 px-5">
        {DEMO.proches.map((r) => (
          <article key={r.id} className="yk-card group flex items-center gap-3.5 p-2.5">
            <span className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[1.15rem]">
              <FoodImage src={r.image} alt={r.nom} kind="restaurant" sizes="86px" />
              <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[9.5px] font-bold text-white backdrop-blur">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                {r.note.toFixed(1)}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="yk-display truncate text-[17px] leading-tight">{r.nom}</h3>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#C9C0B6] transition-transform group-hover:translate-x-0.5 dark:text-white/30" />
              </div>
              <p className="mt-0.5 truncate text-[12px] font-medium text-[#8A8078] dark:text-white/45">{r.cuisine}</p>
              <div className="mt-2">
                <MetaRow temps={r.temps} frais={r.frais} distance={r.distance} />
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Marge pour la barre panier + le dock */}
      <div className="h-[200px]" aria-hidden="true" />

      {/* Résumé panier flottant */}
      <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-[440px] px-5">
        <button
          type="button"
          className="yk-card flex w-full items-center gap-3 rounded-[1.4rem] p-2.5 text-left shadow-[0_20px_40px_-18px_rgba(22,19,15,0.55)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.95rem] bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold">1 article en attente</span>
            <span className="block truncate text-[11.5px] font-medium text-[#8A8078] dark:text-white/45">{DEMO.panier.lignes[0].nom}</span>
          </span>
          <span className="flex items-center gap-2 rounded-full bg-[#16130F] px-3.5 py-2 text-[12.5px] font-bold text-white dark:bg-white dark:text-[#16130F]">
            {fcfa(4500)}
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      <Dock active={dock} panier={3} onSelect={setDock} />
    </MobileScreen>
  );
}
