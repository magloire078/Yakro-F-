
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
import { useAuth } from '@/contexts/auth-context';


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
  const { updateOtherUserProfile } = useAuth();
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
      await updateOtherUserProfile(userProfile.uid, data);
      toast({
        title: 'Profil utilisateur mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil.',
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
            Modifiez les informations de l'utilisateur.
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

    