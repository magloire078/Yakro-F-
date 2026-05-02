
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateUserProfileAction } from '@/app/actions/user-actions';
import { logAdminAction } from '@/lib/audit-logs';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';


interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

const editUserSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresseParDefaut: z.string().optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export function EditUserDialog({ isOpen, onClose, userProfile }: EditUserDialogProps) {
  const { user } = useAuth();
  const { db } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nom: userProfile.nom || '',
      telephone: userProfile.telephone || '',
      adresseParDefaut: userProfile.adresseParDefaut || '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        nom: userProfile.nom || '',
        telephone: userProfile.telephone || '',
        adresseParDefaut: userProfile.adresseParDefaut || '',
      });
    }
  }, [isOpen, userProfile, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUserProfileAction(userProfile.uid, data);
      toast({
        title: 'Profil utilisateur mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });

      if (user) {
        await logAdminAction(db, {
          adminId: user.uid,
          adminEmail: user.email || 'unknown',
          action: 'UPDATE_USER',
          targetId: userProfile.uid,
          details: `Mise à jour du profil de ${userProfile.nom || userProfile.email}`
        });
      }

      onClose();
    } catch {
       // Error is handled by the action via the emitter, but we can show a generic toast here.
       // The developer will see the rich error in the console.
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil. Vérifiez les permissions.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le profil de {userProfile.nom || userProfile.email}</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;utilisateur.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom complet</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="adresseParDefaut"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Adresse par défaut</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader className="animate-spin" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
