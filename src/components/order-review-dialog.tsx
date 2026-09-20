'use client';

import * as React from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFirebase } from '@/contexts/firebase-provider';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types';

interface OrderReviewDialogProps {
  order: Order;
  children: React.ReactNode;
  onSubmitted?: () => void;
}

const StarRatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((ratingValue) => (
        <button
          type="button"
          key={ratingValue}
          onClick={() => onChange(ratingValue)}
          onMouseEnter={() => setHover(ratingValue)}
          className="focus:outline-none"
          aria-label={`Évaluer ${ratingValue} sur 5 étoiles`}
        >
          <Star
            className={cn(
              'w-8 h-8 cursor-pointer transition-colors',
              ratingValue <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'
            )}
          />
        </button>
      ))}
    </div>
  );
};

/**
 * Avis vérifié : le document `avis/{orderId}` n'existe que pour une
 * commande livrée appartenant à l'utilisateur (imposé par firestore.rules)
 * — un avis par commande, immuable une fois posté.
 */
export function OrderReviewDialog({ order, children, onSubmitted }: OrderReviewDialogProps) {
  const { db } = useFirebase();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState(0);
  const [commentaire, setCommentaire] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (note < 1) {
      toast({ variant: 'destructive', title: 'Note manquante', description: 'Sélectionnez une note de 1 à 5 étoiles.' });
      return;
    }
    if (commentaire.trim().length < 10) {
      toast({ variant: 'destructive', title: 'Commentaire trop court', description: 'Décrivez votre expérience en quelques mots (10 caractères minimum).' });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'avis', order.id), {
        restaurantId: order.restaurantId,
        userId: user.uid,
        orderId: order.id,
        nomUtilisateur: userProfile?.nom || 'Client Yakro Fê',
        note,
        commentaire: commentaire.trim(),
        date: new Date().toISOString(),
      });
      toast({ title: 'Merci !', description: 'Votre avis a été publié.' });
      setOpen(false);
      onSubmitted?.();
    } catch (error) {
      console.error('OrderReviewDialog: échec de la publication de l\'avis', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de publier l'avis pour le moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>Votre avis sur {order.nomRestaurant}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="flex flex-col items-center gap-2">
            <StarRatingInput value={note} onChange={setNote} />
            <p className="text-xs text-muted-foreground">Notez votre expérience</p>
          </div>
          <Textarea
            placeholder="Le plat était délicieux, livré à temps..."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-2xl w-full">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer l'avis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
