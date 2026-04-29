'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Heart, MapPin, Sparkles, ShoppingCart, Gift, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'yakro-onboarding-dismissed-v1';

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: MapPin,
    title: 'Bienvenue sur Yakro Fê',
    description: "Découvrez les meilleurs restaurants de Yamoussoukro avec recherche IA, filtres diététiques (halal, végé…) et tri par proximité ou rapidité.",
    color: '#FF8C00',
  },
  {
    icon: ShoppingCart,
    title: 'Commandez en quelques clics',
    description: "Ajoutez vos plats au panier, payez par Mobile Money (Wave, Orange Money, MTN MoMo) ou en espèces, suivez le livreur en direct sur la carte.",
    color: '#16a34a',
  },
  {
    icon: Heart,
    title: 'Vos favoris, toujours sous la main',
    description: "Mettez en favoris vos restaurants préférés, recommandez en 1 clic depuis l'historique, programmez votre commande pour plus tard.",
    color: '#dc2626',
  },
  {
    icon: Sparkles,
    title: 'Cumulez des points fidélité',
    description: "Bronze → Argent → Or : à chaque palier, des avantages (livraison réduite puis offerte). 1 point par tranche de 100 FCFA dépensée.",
    color: '#eab308',
  },
  {
    icon: Gift,
    title: 'Parrainez vos amis',
    description: "Invitez vos amis avec votre code unique : ils reçoivent 1000 FCFA, vous gagnez 500 points par filleul actif.",
    color: '#ec4899',
  },
];

export function OnboardingTour() {
  const { user, userProfile, activeRole } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user || activeRole !== 'client') return;
    if (window.localStorage.getItem(STORAGE_KEY) === '1') return;
    // Petit délai pour laisser la page se monter avant d'afficher.
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [user, activeRole, userProfile]);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => setStep(Math.max(0, step - 1));

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        <div
          className="flex flex-col items-center text-center px-6 pt-10 pb-6"
          style={{ background: `linear-gradient(180deg, ${current.color}20 0%, transparent 70%)` }}
        >
          <div
            className="rounded-full p-5 mb-4 shadow-lg"
            style={{ backgroundColor: current.color }}
          >
            <Icon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-headline font-bold">{current.title}</h2>
          <p className="text-muted-foreground mt-2">{current.description}</p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStep(idx)}
                aria-label={`Étape ${idx + 1}`}
                aria-current={idx === step ? 'step' : undefined}
                className={cn(
                  'h-2 rounded-full transition-all',
                  idx === step ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={dismiss}>
              Passer
            </Button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={prev}>
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
              )}
              <Button size="sm" onClick={next}>
                {isLast ? 'Commencer' : 'Suivant'}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
