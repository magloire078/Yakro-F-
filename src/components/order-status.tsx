'use client';
import * as React from 'react';

import { useEffect } from 'react';
import { Button } from './ui/button';
import { Check, CheckCircle, CookingPot, Bike, Home, Map, Package } from 'lucide-react';
import type { Order } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Suivi de commande « Yakro Elite · Nuit & Braise ».
 *
 * Carte chaude avec pastille de statut, chronologie verticale compacte et
 * accès au suivi live du livreur. La logique (statuts, disparition après
 * livraison) est inchangée.
 */

type StatusKey = Order['statut'];

const statusConfig: Record<StatusKey, { name: string; icon: React.ElementType; description: string }> = {
  'Placée': { name: 'Placée', icon: CheckCircle, description: 'Le restaurant a bien reçu votre commande.' },
  'En Préparation': { name: 'En Préparation', icon: CookingPot, description: 'Le restaurant prépare votre repas.' },
  'Prête': { name: 'Prête', icon: Package, description: 'Votre commande est prête et attend le livreur.' },
  'En Route': { name: 'En Route', icon: Bike, description: 'Votre livreur est en chemin.' },
  'Livrée': { name: 'Livrée', icon: Home, description: 'Bon appétit ! Votre commande est arrivée.' },
  'Annulée': { name: 'Annulée', icon: Home, description: 'Votre commande a été annulée.' },
};

interface OrderStatusProps {
  order: Order;
  onNewOrder: () => void;
}

export function OrderStatus({ order, onNewOrder }: OrderStatusProps) {
  const currentStatus = statusConfig[order.statut];
  const CurrentIcon = currentStatus.icon;
  const isFinished = order.statut === 'Livrée' || order.statut === 'Annulée';
  const allStatuses = Object.values(statusConfig).filter((s) => s.name !== 'Annulée');
  const statusIndex = allStatuses.findIndex((s) => s.name === order.statut);

  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        onNewOrder();
      }, 5000); // Wait 5 seconds before clearing the status
      return () => clearTimeout(timer);
    }
  }, [isFinished, onNewOrder]);

  return (
    <section className="yk-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="min-w-0">
          <p className="yk-label">Suivi de votre commande</p>
          <h2 className="yk-display mt-1 text-[23px] leading-tight">
            {currentStatus.name}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6B625A] dark:text-white/55">
            {isFinished ? 'Votre commande est terminée.' : currentStatus.description}
            <span className="text-[#8A8078] dark:text-white/40"> · {order.nomRestaurant}</span>
          </p>
        </div>
        <span
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] bg-orange-500/10 text-[#C2410C] dark:text-orange-400',
            !isFinished && order.statut === 'En Route' && 'animate-pulse'
          )}
          aria-hidden="true"
        >
          <CurrentIcon className="h-6 w-6" />
        </span>
      </div>

      <ol className="space-y-0 px-4 pb-4 pt-1">
        {allStatuses.map((status, index) => {
          const done = index <= statusIndex;
          const actif = index === statusIndex && !isFinished;
          return (
            <li key={status.name} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold',
                    actif
                      ? 'bg-[#C2410C] text-white shadow-[0_0_0_4px_rgba(249,115,22,0.15)]'
                      : done
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-black/[0.05] text-[#A79E96] dark:bg-white/[0.06] dark:text-white/30'
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
                </span>
                {index < allStatuses.length - 1 && (
                  <span
                    className={cn(
                      'my-0.5 h-4 w-px',
                      done ? 'bg-emerald-500/30' : 'bg-black/10 dark:bg-white/10'
                    )}
                  />
                )}
              </span>
              <span
                className={cn(
                  'pt-0.5 text-[12.5px] font-semibold',
                  actif
                    ? 'text-[#16130F] dark:text-white'
                    : done
                      ? 'text-[#6B625A] dark:text-white/55'
                      : 'text-[#A79E96] dark:text-white/30'
                )}
              >
                {status.name}
              </span>
            </li>
          );
        })}
      </ol>

      {isFinished ? (
        <div className="border-t border-black/[0.05] px-4 py-3 dark:border-white/[0.06]">
          <p className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
            Votre commande a été livrée !
          </p>
          <p className="text-[11px] text-[#8A8078] dark:text-white/45">
            Ce message disparaîtra dans quelques secondes.
          </p>
        </div>
      ) : (
        <div className="border-t border-black/[0.05] px-4 py-3 dark:border-white/[0.06]">
          <Button
            asChild
            className="yk-cta w-full justify-between px-4 text-[13.5px]"
          >
            <Link href={`/orders/track?id=${order.id}`}>
              Suivre en direct
              <Map className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
