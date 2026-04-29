'use client';

import * as React from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { MessageSquarePlus, Loader, Bug, Lightbulb, Star, ThumbsUp } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/contexts/firebase-provider';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type FeedbackCategory = 'bug' | 'suggestion' | 'compliment' | 'autre';

const CATEGORIES: { id: FeedbackCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'bug', label: 'Bug / problème', icon: Bug, color: 'text-red-500' },
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'compliment', label: 'Compliment', icon: ThumbsUp, color: 'text-green-500' },
  { id: 'autre', label: 'Autre', icon: Star, color: 'text-muted-foreground' },
];

export function FeedbackButton() {
  const { db } = useFirebase();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<FeedbackCategory | null>(null);
  const [message, setMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const reset = () => {
    setCategory(null);
    setMessage('');
  };

  if (!user) return null;

  const handleSubmit = async () => {
    if (!category || message.trim().length < 10) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        userEmail: user.email ?? null,
        userNom: userProfile?.nom ?? null,
        category,
        message: message.trim().slice(0, 2000),
        path: pathname || '/',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        date: new Date().toISOString(),
      });
      toast({ title: 'Merci pour votre retour ! 🙏', description: 'Nous l\'examinerons rapidement.' });
      reset();
      setOpen(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e?.message || "Impossible d'envoyer le feedback.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!category && message.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 h-12 w-12 rounded-full shadow-lg z-30"
          aria-label="Donner mon avis sur l'app"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Donnez-nous votre avis</DialogTitle>
          <DialogDescription>
            Vos retours nous aident à améliorer Yakro Fê.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                    active ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                  )}
                  aria-pressed={active}
                >
                  <Icon className={cn('h-4 w-4', c.color)} />
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback-message">
              Votre message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback-message"
              rows={5}
              placeholder="Décrivez le bug rencontré, votre suggestion, ou ce que vous avez aimé… (10 caractères minimum)"
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 2000))}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting && <Loader className="h-4 w-4 animate-spin" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
