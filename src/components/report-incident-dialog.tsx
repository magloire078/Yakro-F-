'use client';

import * as React from 'react';
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
import { Loader, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { incidentsForReporter, generateIncidentId } from '@/lib/incidents';
import type { IncidentReporter, IncidentType, OrderIncident } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ReportIncidentDialogProps {
  orderId: string;
  reporter: IncidentReporter;
  children: React.ReactNode;
}

export function ReportIncidentDialog({ orderId, reporter, children }: ReportIncidentDialogProps) {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<IncidentType | null>(null);
  const [message, setMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const options = incidentsForReporter(reporter);
  const selected = type ? options.find(o => o.id === type) : null;
  const messageRequired = !!selected?.requiresMessage;
  const canSubmit = type !== null && (!messageRequired || message.trim().length >= 5);

  const reset = () => {
    setType(null);
    setMessage('');
  };

  const handleSubmit = async () => {
    if (!type) return;
    setSubmitting(true);
    const incident: OrderIncident = {
      id: generateIncidentId(),
      type,
      signalePar: reporter,
      date: new Date().toISOString(),
      ...(message.trim() && { message: message.trim() }),
    };
    try {
      await updateDoc(doc(db, 'commandes', orderId), {
        incidents: arrayUnion(incident),
      });
      toast({
        title: 'Incident signalé',
        description: 'Les autres parties prenantes en ont été informées.',
      });
      reset();
      setOpen(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e?.message || "Impossible d'enregistrer le signalement.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Signaler un problème
          </DialogTitle>
          <DialogDescription>
            Choisissez la nature du problème. Les autres parties seront notifiées.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2">
            {options.map(opt => {
              const isActive = type === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-left transition-colors',
                    isActive ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                  )}
                  aria-pressed={isActive}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="incident-message">
              Message {messageRequired && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="incident-message"
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 500))}
              placeholder={
                messageRequired
                  ? 'Décrivez précisément le problème (5 caractères minimum)…'
                  : 'Détails additionnels (facultatif)…'
              }
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting && <Loader className="animate-spin" />}
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
