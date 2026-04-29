'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader, XCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import { useToast } from '@/hooks/use-toast';

interface CancelOrderDialogProps {
  orderId: string;
  /** Tant que la commande est en statut "Placée", l'annulation est libre. */
  canCancel: boolean;
  children: React.ReactNode;
}

export function CancelOrderDialog({ orderId, canCancel, children }: CancelOrderDialogProps) {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [motif, setMotif] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleCancel = async () => {
    if (!canCancel) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'commandes', orderId), {
        statut: 'Annulée',
        motifAnnulation: motif.trim() || 'Annulation par le client',
      });
      toast({ title: 'Commande annulée', description: 'Votre commande a bien été annulée.' });
      setOpen(false);
      setMotif('');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e?.message || "Impossible d'annuler. La commande a peut-être déjà été acceptée.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Annuler cette commande ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            L'annulation n'est possible que tant que le restaurateur n'a pas accepté votre commande. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="cancel-motif">Motif (facultatif)</Label>
          <Textarea
            id="cancel-motif"
            rows={2}
            placeholder="Ex: J'ai changé d'avis."
            value={motif}
            onChange={e => setMotif(e.target.value.slice(0, 200))}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Garder ma commande</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleCancel} disabled={submitting}>
              {submitting && <Loader className="animate-spin" />}
              Confirmer l'annulation
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
