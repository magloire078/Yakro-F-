'use client';

import * as React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Banknote, Smartphone, Zap, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import type { PaymentMode } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Contrôle d'affichage et d'activation des options Mobile Money :
 * Si CinetPay est activé en prod (ou NEXT_PUBLIC_PAYMENTS_MOBILE_MONEY_ENABLED === 'true'),
 * toutes les options sont sélectionnables. Sinon, les opérateurs restent affichés avec
 * un badge informatif « Bientôt disponible » pour rassurer les clients sur l'écosystème.
 */
const MOBILE_MONEY_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_MOBILE_MONEY_ENABLED === 'true';

interface PaymentOptionConfig {
  mode: PaymentMode;
  label: string;
  tagline: string;
  description: string;
  accentClass: string;
  activeBorderClass: string;
  activeBgClass: string;
  badgeText?: string;
  icon: React.ReactNode;
}

const PAYMENT_OPTIONS: PaymentOptionConfig[] = [
  {
    mode: 'especes',
    label: 'Espèces à la livraison',
    tagline: 'Main à main',
    description: 'Réglez directement en liquide au livreur à la réception',
    accentClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    activeBorderClass: 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/5',
    activeBgClass: 'bg-emerald-500/20 text-emerald-500',
    badgeText: 'Disponible',
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    mode: 'orange_money',
    label: 'Orange Money CI',
    tagline: '#144# ou App Max it',
    description: 'Paiement mobile sécurisé par code secret ou notification',
    accentClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    activeBorderClass: 'border-orange-500 ring-1 ring-orange-500 bg-orange-500/5',
    activeBgClass: 'bg-orange-500/20 text-orange-500',
    badgeText: MOBILE_MONEY_ENABLED ? 'Direct' : 'Bientôt',
    icon: <Smartphone className="h-5 w-5 text-orange-500" />,
  },
  {
    mode: 'mtn_money',
    label: 'MTN MoMo',
    tagline: '*133# MoMo Pay',
    description: 'Validation instantanée sur votre compte MTN Mobile Money',
    accentClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    activeBorderClass: 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/5',
    activeBgClass: 'bg-amber-500/20 text-amber-500',
    badgeText: MOBILE_MONEY_ENABLED ? 'Direct' : 'Bientôt',
    icon: <Zap className="h-5 w-5 text-amber-500" />,
  },
  {
    mode: 'moov_money',
    label: 'Moov Money CI',
    tagline: '*155# Moov Africa',
    description: 'Paiement rapide et sécurisé avec votre solde Moov Money',
    accentClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    activeBorderClass: 'border-sky-500 ring-1 ring-sky-500 bg-sky-500/5',
    activeBgClass: 'bg-sky-500/20 text-sky-500',
    badgeText: MOBILE_MONEY_ENABLED ? 'Direct' : 'Bientôt',
    icon: <Smartphone className="h-5 w-5 text-sky-500" />,
  },
];

interface PaymentMethodSelectorProps {
  value: PaymentMode;
  onChange: (mode: PaymentMode) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="flex h-3 w-1 flex-col rounded-full overflow-hidden shrink-0">
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-white/70" />
            <div className="flex-1 bg-emerald-500" />
          </div>
          <span className="text-2xs font-black uppercase tracking-wider text-muted-foreground">
            Modes de paiement acceptés
          </span>
        </div>
        <span className="flex items-center gap-1 text-2xs text-muted-foreground/80">
          <Lock className="w-3 h-3 text-emerald-500" /> Sécurisé SSL
        </span>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as PaymentMode)}
        className="gap-2.5"
      >
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = value === option.mode;
          const isDisabled = !MOBILE_MONEY_ENABLED && option.mode !== 'especes';

          return (
            <Label
              key={option.mode}
              htmlFor={`payment-${option.mode}`}
              className={cn(
                'group relative flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200',
                isDisabled
                  ? 'opacity-65 cursor-not-allowed border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]'
                  : 'cursor-pointer hover:border-primary/40 active:scale-[0.99]',
                isSelected
                  ? option.activeBorderClass
                  : !isDisabled && 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
              )}
            >
              <RadioGroupItem
                value={option.mode}
                id={`payment-${option.mode}`}
                disabled={isDisabled}
                className={cn('shrink-0', isSelected && 'border-primary text-primary')}
              />

              <div
                className={cn(
                  'p-2.5 rounded-xl shrink-0 transition-colors',
                  isSelected
                    ? option.activeBgClass
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                )}
              >
                {option.icon}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                    {option.label}
                  </p>
                  {option.badgeText && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-3xs px-1.5 py-0 h-4 font-black uppercase',
                        option.mode === 'especes'
                          ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : isDisabled
                          ? 'border-slate-300 dark:border-slate-700 text-muted-foreground'
                          : option.accentClass
                      )}
                    >
                      {option.badgeText}
                    </Badge>
                  )}
                </div>
                <p className="text-2xs text-muted-foreground line-clamp-1">
                  {option.description}
                </p>
              </div>

              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mr-1" />
              )}
            </Label>
          );
        })}
      </RadioGroup>

      <div className="p-2.5 rounded-xl bg-muted/40 dark:bg-white/[0.02] border border-border/40 flex items-center gap-2 text-2xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Toutes les transactions Yakro Fê sont garanties et vérifiées avec le restaurateur et le livreur.</span>
      </div>
    </div>
  );
}

