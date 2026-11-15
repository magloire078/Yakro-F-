import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Restaurant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FoodImage } from '@/components/food-image';
import { MetaRow, RatingPill } from '@/components/mobile-ui';

/** Variantes de la carte, toutes photo-first :
 *  - `grid` (défaut) : carte verticale compacte pour les grilles 2 colonnes ;
 *  - `featured` : grande carte 178 × 268 px du carrousel horizontal ;
 *  - `row` : ligne horizontale (image 86 px + texte) pour les listes. */
type RestaurantCardVariant = 'grid' | 'featured' | 'row';

interface RestaurantCardProps {
  restaurant: Restaurant;
  featured?: boolean;
  matchReason?: string;
  distance?: number;
  /** Défaut `grid` pour ne rien changer aux usages existants (accueil, /restaurants). */
  variant?: RestaurantCardVariant;
}

/** Distance lisible : mètres sous le kilomètre, sinon kilomètres à une décimale. */
function formatDistance(distance: number): string {
  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
}

export function RestaurantCard({
  restaurant,
  featured = false,
  matchReason,
  distance,
  variant = 'grid',
}: RestaurantCardProps) {
  // `note` est typé obligatoire, mais d'anciens documents n'en ont pas :
  // RatingPill appelle `toFixed`, donc on garde une garde défensive.
  const note = Number.isFinite(restaurant.note) ? restaurant.note : undefined;
  const fraisLabel =
    restaurant.fraisDeLivraison > 0
      ? `${restaurant.fraisDeLivraison.toLocaleString('fr-FR')} F`
      : 'Offerte';
  const distanceLabel = distance === undefined ? undefined : formatDistance(distance);
  const href = `/restaurants?id=${restaurant.id}`;
  const isFeatured = featured || variant === 'featured';

  // ── Ligne horizontale (liste « Ouverts près de toi ») ──────────────────
  if (variant === 'row') {
    return (
      <Link href={href} aria-label={`Voir le restaurant ${restaurant.nom}`} className="group block">
        <article className="yk-card flex items-center gap-3.5 p-2.5 transition-shadow duration-300 group-hover:shadow-[0_26px_60px_-28px_rgba(22,19,15,0.55)]">
          <div className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[1.15rem] bg-slate-100 dark:bg-white/[0.06]">
            <FoodImage
              src={restaurant.image}
              alt={restaurant.nom}
              kind="restaurant"
              sizes="86px"
              className="transition-transform duration-500 group-hover:scale-105"
            />
            {note !== undefined && (
              <span className="absolute bottom-1 left-1 z-10">
                <RatingPill note={note} className="px-1.5 py-0.5 text-[10px]" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="yk-display truncate text-[17px] leading-tight">{restaurant.nom}</h3>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#C9C0B6] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-orange-500 dark:text-white/30" />
            </div>
            <p className="mt-0.5 truncate text-[12px] font-medium text-[#8A8078] dark:text-white/45">
              {restaurant.cuisine}
            </p>
            <MetaRow
              className="mt-2 gap-x-2 gap-y-0.5"
              temps={`${restaurant.tempsDeLivraison} min`}
              frais={fraisLabel}
              distance={distanceLabel}
            />
          </div>
        </article>
      </Link>
    );
  }

  // ── Grande carte du carrousel « En vedette » ───────────────────────────
  if (variant === 'featured') {
    return (
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="h-[178px] w-[268px] shrink-0 snap-start"
      >
        <Link href={href} aria-label={`Voir le restaurant ${restaurant.nom}`} className="group block h-full">
          <article className="relative h-full w-full overflow-hidden rounded-[1.6rem] shadow-[0_22px_45px_-22px_rgba(22,19,15,0.55)]">
            <FoodImage
              src={restaurant.image}
              alt={restaurant.nom}
              kind="restaurant"
              sizes="268px"
              className="transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" aria-hidden="true" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
              {isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#C2410C] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-lg shadow-orange-500/40">
                  <Sparkles className="h-3 w-3" /> En vedette
                </span>
              ) : (
                <span />
              )}
              {note !== undefined && <RatingPill note={note} className="shrink-0" />}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
              <h3 className="yk-display text-[19px] leading-tight">{restaurant.nom}</h3>
              <p className="mt-0.5 truncate text-[11.5px] font-medium text-white/75">
                {restaurant.cuisine}
                {matchReason ? ` · ${matchReason}` : ''}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <MetaRow
                  className="flex-wrap gap-x-2 gap-y-0.5 text-white/90"
                  temps={`${restaurant.tempsDeLivraison} min`}
                  frais={fraisLabel}
                  distance={distanceLabel}
                />
                <span className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </article>
        </Link>
      </motion.div>
    );
  }

  // ── Carte verticale compacte (grilles 2 colonnes) ──────────────────────
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full"
    >
      <Link href={href} aria-label={`Voir le restaurant ${restaurant.nom}`} className="group block h-full">
        <article className="yk-card flex h-full flex-col overflow-hidden transition-shadow duration-300 group-hover:shadow-[0_26px_60px_-28px_rgba(22,19,15,0.55)]">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-white/[0.06]">
            <FoodImage
              src={restaurant.image}
              alt={restaurant.nom}
              kind="restaurant"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" aria-hidden="true" />

            <div className="absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-1">
              {isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#C2410C] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-md shadow-orange-500/40">
                  <Sparkles className="h-3 w-3" /> En vedette
                </span>
              ) : (
                <span />
              )}
              {note !== undefined && (
                <RatingPill note={note} className="shrink-0 px-1.5 py-0.5 text-[10.5px]" />
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1 p-3">
            <div className="flex items-start justify-between gap-1.5">
              <h3
                className={cn(
                  'yk-display line-clamp-1 text-[15.5px] leading-tight transition-colors duration-200',
                  'group-hover:text-orange-600 dark:group-hover:text-orange-400',
                )}
              >
                {restaurant.nom}
              </h3>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#C9C0B6] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-orange-500 dark:text-white/30" />
            </div>

            <p className="truncate text-[11.5px] font-medium text-[#8A8078] dark:text-white/45">
              {restaurant.cuisine}
            </p>

            {matchReason && (
              <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C2410C] dark:text-orange-400">
                <span aria-hidden="true">✨</span>
                <span className="truncate">{matchReason}</span>
              </span>
            )}

            <div className="mt-auto pt-2">
              <MetaRow
                className="flex-wrap gap-x-2 gap-y-0.5"
                temps={`${restaurant.tempsDeLivraison} min`}
                frais={fraisLabel}
                distance={distanceLabel}
              />
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
