'use client';

import * as React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Banknote, Smartphone } from 'lucide-react';
import type { PaymentMode } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Contrôle d'affichage des options Mobile Money : tant que CinetPay n'est
 * pas configuré côté serveur (clés API), on ne montre que « Espèces à la
 * livraison » pour ne jamais créer de commande bloquée en attente d'un
 * paiement impossible à finaliser. Passer à 'true' une fois
 * CINETPAY_API_KEY / CINETPAY_SITE_ID renseignés en production.
 */
const MOBILE_MONEY_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_MOBILE_MONEY_ENABLED === 'true';

interface PaymentOption {
  mode: PaymentMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ALL_OPTIONS: PaymentOption[] = [
  {
    mode: 'especes',
    label: 'Espèces à la livraison',
    description: 'Payez en liquide au livreur à la réception',
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    mode: 'orange_money',
    label: 'Orange Money',
    description: 'Paiement mobile sécurisé',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    mode: 'mtn_money',
    label: 'MTN Money',
    description: 'Paiement mobile sécurisé',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    mode: 'moov_money',
    label: 'Moov Money',
    description: 'Paiement mobile sécurisé',
    icon: <Smartphone className="h-5 w-5" />,
  },
];

const VISIBLE_OPTIONS = MOBILE_MONEY_ENABLED
  ? ALL_OPTIONS
  : ALL_OPTIONS.filter((option) => option.mode === 'especes');

interface PaymentMethodSelectorProps {
  value: PaymentMode;
  onChange: (mode: PaymentMode) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as PaymentMode)}
      className="gap-3"
    >
      {VISIBLE_OPTIONS.map((option) => {
        const isSelected = value === option.mode;
        return (
          <Label
            key={option.mode}
            htmlFor={`payment-${option.mode}`}
            className={cn(
              'flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            )}
          >
            <RadioGroupItem value={option.mode} id={`payment-${option.mode}`} />
            <div
              className={cn(
                'p-2 rounded-xl shrink-0',
                isSelected
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              )}
            >
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900 dark:text-white">{option.label}</p>
              <p className="text-xs text-slate-400">{option.description}</p>
            </div>
          </Label>
        );
      })}

      {!MOBILE_MONEY_ENABLED && (
        <p className="text-[11px] text-slate-400 italic px-1">
          Le paiement Mobile Money (Orange Money, MTN Money, Moov Money) arrive bientôt.
        </p>
      )}
    </RadioGroup>
  );
}
