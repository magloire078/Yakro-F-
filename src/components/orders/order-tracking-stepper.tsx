'use client';

import * as React from 'react';
import type { Order } from '@/lib/types';
import {
  ORDER_TRACKING_STEPS,
  getOrderStepIndex,
  type StandardStepStatus,
} from '@/lib/order-status-info';
import {
  Receipt,
  ChefHat,
  PackageCheck,
  Bike,
  Sparkles,
  Check,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTrackingStepperProps {
  status: Order['statut'];
  className?: string;
}

const STEP_ICONS: Record<StandardStepStatus, React.ComponentType<{ className?: string }>> = {
  Placée: Receipt,
  'En Préparation': ChefHat,
  Prête: PackageCheck,
  'En Route': Bike,
  Livrée: Sparkles,
};

export function OrderTrackingStepper({ status, className }: OrderTrackingStepperProps) {
  const currentIndex = getOrderStepIndex(status);
  const isCancelled = status === 'Annulée';

  if (isCancelled) {
    return (
      <div className={cn('p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3.5', className)}>
        <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
          <XCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm uppercase tracking-wider text-rose-500">Commande annulée</p>
          <p className="text-xs text-rose-400/90 mt-0.5">Cette commande a été annulée et ne sera pas préparée ni livrée.</p>
        </div>
      </div>
    );
  }

  // Pourcentage de progression (0% à 100%)
  const progressPercent = Math.max(0, Math.min(100, (currentIndex / (ORDER_TRACKING_STEPS.length - 1)) * 100));

  return (
    <div className={cn('yk-card space-y-4 p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-ping rounded-full bg-orange-500" />
          <p className="yk-label">Progression en direct</p>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] dark:text-orange-400">
          Étape {currentIndex + 1} / {ORDER_TRACKING_STEPS.length}
        </span>
      </div>

      {/* Stepper horizontal */}
      <div className="relative pt-2 pb-1">
        {/* Ligne d'arrière-plan */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-muted/80 -translate-y-1/2 rounded-full overflow-hidden">
          {/* Ligne active remplie */}
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Échelons */}
        <div className="relative flex justify-between items-start gap-1">
          {ORDER_TRACKING_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const IconComponent = STEP_ICONS[step.status];

            return (
              <div
                key={step.status}
                className="flex flex-col items-center text-center group flex-1 max-w-[80px] sm:max-w-[110px]"
              >
                <div
                  className={cn(
                    'relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 font-bold',
                    isCompleted && 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25',
                    isCurrent && 'bg-[#C2410C] text-white ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/35 scale-110',
                    !isCompleted && !isCurrent && 'bg-card border border-border text-muted-foreground/60'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                  ) : (
                    <IconComponent className={cn('h-4 w-4 sm:h-5 sm:w-5', isCurrent && 'animate-pulse')} />
                  )}
                </div>

                <div className="mt-2.5 space-y-0.5">
                  <p
                    className={cn(
                      'text-[9.5px] font-bold uppercase leading-tight tracking-tight sm:text-[11px]',
                      isCurrent && 'font-black text-[#C2410C] dark:text-orange-400',
                      isCompleted && 'font-semibold text-foreground',
                      !isCompleted && !isCurrent && 'text-muted-foreground/50'
                    )}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description de l'étape courante */}
      <div className="flex items-center gap-2.5 border-t border-border/30 pt-2 text-[11.5px] text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
        <span className="italic">{ORDER_TRACKING_STEPS[currentIndex]?.description}</span>
      </div>
    </div>
  );
}
