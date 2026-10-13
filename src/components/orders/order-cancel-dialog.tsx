'use client';

import * as React from 'react';
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
import { Button } from '@/components/ui/button';
import { Ban, Loader2 } from 'lucide-react';
import { updateOrderStatusAction } from '@/app/actions/order-actions';
import { useToast } from '@/hooks/use-toast';

interface OrderCancelDialogProps {
  orderId: string;
  onCancelled?: () => void;
  className?: string;
}

export function OrderCancelDialog({ orderId, onCancelled, className }: OrderCancelDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    try {
      await updateOrderStatusAction({
        orderId,
        status: 'Annulée',
      });
      toast({
        title: 'Commande annulée',
        description: 'Votre commande a bien été annulée.',
      });
      setIsOpen(false);
      onCancelled?.();
    } catch (err) {
      console.error('Erreur lors de l’annulation de la commande :', err);
      toast({
        variant: 'destructive',
        title: 'Annulation impossible',
        description: 'La commande ne peut plus être annulée (peut-être déjà en préparation par le restaurant).',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 px-3 rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 font-bold text-xs gap-1.5 ${className || ''}`}
        >
          <Ban className="h-3.5 w-3.5" /> Annuler la commande
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl sm:rounded-3xl border-border bg-card p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="font-headline font-black text-lg">
                Annuler votre commande ?
              </AlertDialogTitle>
              <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">
                Action immédiate
              </p>
            </div>
          </div>
          <AlertDialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Votre commande n’a pas encore été prise en charge en cuisine. Si vous confirmez, le restaurant en sera averti et la préparation sera interrompue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isSubmitting} className="rounded-xl h-10 font-bold text-xs">
            Garder ma commande
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleConfirmCancel();
            }}
            disabled={isSubmitting}
            className="rounded-xl h-10 font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Annulation...
              </>
            ) : (
              'Confirmer l’annulation'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
