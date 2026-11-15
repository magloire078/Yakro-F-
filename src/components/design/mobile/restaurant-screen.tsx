'use client';

import * as React from 'react';
import { Bike, ChevronRight, Clock, Heart, MapPin, Plus, Share2, Star } from 'lucide-react';
import { FoodImage } from '@/components/food-image';
import { cn } from '@/lib/utils';
import { DEMO, fcfa } from './data';
import { BackButton, MobileScreen, StatusBar } from './ui';

export function RestaurantScreen() {
  const [onglet, setOnglet] = React.useState(DEMO.categoriesMenu[0]);
  const [favori, setFavori] = React.useState(false);
  const [quantites, setQuantites] = React.useState<Record<string, number>>({});

  const ajouter = (id: string) =>
    setQuantites((q) => ({ ...q, [id]: (q[id] ?? 0) + 1 }));

  const totalArticles = Object.values(quantites).reduce((a, b) => a + b, 0);
  const totalPrix = DEMO.plats.reduce((sum, p) => sum + (quantites[p.id] ?? 0) * p.prix, 0);

  return (
    <MobileScreen>
      <StatusBar dark />

      {/* Photo du restaurant */}
      <div className="relative -mt-11 h-[300px] w-full overflow-hidden">
        <FoodImage src={DEMO.restaurant.image} alt={DEMO.restaurant.nom} kind="restaurant" sizes="440px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-black/35 to-black/25" />

        <div className="absolute inset-x-0 top-11 flex items-center justify-between px-5">
          <BackButton />
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Partager"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/80 text-[#16130F] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/40 dark:text-white"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Ajouter aux favoris"
              aria-pressed={favori}
              onClick={() => setFavori((f) => !f)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/80 text-[#16130F] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/40 dark:text-white"
            >
              <Heart className={cn('h-4 w-4', favori && 'fill-orange-500 text-orange-500')} />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-4 text-white">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide shadow-lg shadow-orange-500/40">
              <Star className="h-3 w-3 fill-white" /> {DEMO.restaurant.note} · {DEMO.restaurant.avis} avis
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-emerald-500/90 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">
              Ouvert · ferme {DEMO.restaurant.fermeture}
            </span>
          </div>
          <h1 className="yk-display mt-2 text-[30px] leading-tight">{DEMO.restaurant.nom}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-white/75">
            <MapPin className="h-3.5 w-3.5 text-orange-400" />
            {DEMO.restaurant.adresse}
          </p>
        </div>
      </div>

      {/* Bandeau infos */}
      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto px-5">
        <span className="yk-chip shrink-0 gap-1.5">
          <Clock className="h-3.5 w-3.5 text-orange-500" /> {DEMO.restaurant.temps}
        </span>
        <span className="yk-chip shrink-0 gap-1.5">
          <Bike className="h-3.5 w-3.5 text-emerald-500" /> Livraison {DEMO.restaurant.frais}
        </span>
        <span className="yk-chip shrink-0 gap-1.5">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Coup de cœur Yakro
        </span>
      </div>

      {/* Onglets de catégories collants */}
      <div className="sticky top-0 z-30 mt-4 border-b border-black/[0.05] bg-[#FAF7F2]/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0A0A0B]/90">
        <div className="scrollbar-hide flex gap-6 overflow-x-auto px-5">
          {DEMO.categoriesMenu.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setOnglet(c)}
              className={cn(
                'relative inline-flex min-h-[44px] shrink-0 items-center px-1 py-3 text-[13.5px] font-bold transition-colors',
                onglet === c ? 'text-[#16130F] dark:text-white' : 'text-[#8A8078] dark:text-white/40'
              )}
            >
              {c}
              {onglet === c && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-orange-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Plats */}
      <div className="space-y-3 px-5 pt-4">
        {DEMO.plats.map((plat) => (
          <article key={plat.id} className="yk-card flex gap-3.5 p-3">
            <div className="min-w-0 flex-1">
              {plat.badge && (
                <span className="mb-1 inline-flex rounded-full bg-orange-500/10 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  {plat.badge}
                </span>
              )}
              <h3 className="yk-display text-[16.5px] leading-tight">{plat.nom}</h3>
              <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[#8A8078] dark:text-white/45">
                {plat.description}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="yk-display text-[16px] text-orange-600 dark:text-orange-400">{fcfa(plat.prix)}</span>
                {quantites[plat.id] ? (
                  <span className="rounded-full bg-[#16130F] px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-[#16130F]">
                    ×{quantites[plat.id]}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="relative h-[92px] w-[92px] shrink-0">
              <span className="relative block h-full w-full overflow-hidden rounded-[1.15rem]">
                <FoodImage src={plat.image} alt={plat.nom} kind="plat" sizes="92px" />
              </span>
              <button
                type="button"
                aria-label={`Ajouter ${plat.nom}`}
                onClick={() => ajouter(plat.id)}
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-orange-500 text-white shadow-[0_10px_20px_-8px_rgba(249,115,22,0.9)] transition-transform active:scale-90 dark:border-[#141416]"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="h-[150px]" aria-hidden="true" />

      {/* CTA panier collée */}
      <div className="yk-bottom-bar mx-auto max-w-[440px]">
        {totalArticles > 0 ? (
          <button
            type="button"
            className="yk-cta w-full justify-between px-5"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-black">
                {totalArticles}
              </span>
              Voir le panier
            </span>
            <span className="flex items-center gap-1 text-[14px]">
              {fcfa(totalPrix)}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        ) : (
          <button type="button" className="yk-cta w-full justify-between px-5">
            <span className="text-[13px] font-semibold tracking-wide text-white/85">Ajoutez votre premier plat</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </MobileScreen>
  );
}
