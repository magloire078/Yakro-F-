
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
import { Loader } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type { AppRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useFirebase } from '@/contexts/firebase-provider';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const addUserSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  role: z.enum(['client', 'restaurateur', 'livreur']),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

export function AddUserDialog({ isOpen, onClose }: AddUserDialogProps) {
  const { toast } = useToast();
  const { db } = useFirebase();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      nom: '',
      email: '',
      password: '',
      role: 'client',
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AddUserFormValues) => {
    setIsSubmitting(true);
    try {
        // This functionality requires privilege separation, which is complex with client-side SDK alone.
        // We simulate the creation for now. In a real app, this would be a Cloud Function.
        const newUserProfile = {
            nom: data.nom,
            email: data.email,
            role: data.role as AppRole,
            roleSysteme: 'User',
            dateCreation: serverTimestamp()
        };
        
        // This will likely fail with security rules if the admin isn't creating themselves,
        // which is the point. This is an admin action that needs backend privilege.
        // We use a placeholder UID.
        const tempUid = `new-user-${Date.now()}`;
        const userDocRef = doc(db, 'utilisateurs', tempUid);

        setDoc(userDocRef, newUserProfile).catch(e => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUserProfile,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        });

        toast({
            title: "Création d'utilisateur (simulation)",
            description: "Dans une application de production, cela se ferait via un backend sécurisé. La création directe peut être bloquée par les règles de sécurité.",
        });
        onClose();
    } catch(e: unknown) {
        const error = e as Error;
        toast({
          variant: "destructive",
          title: "Erreur lors de la création",
          description: error.message || "Une erreur est survenue."
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un compte utilisateur et définissez son rôle.
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
                            <FormControl><Input {...field} placeholder="ex: Aïcha Koné" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Adresse e-mail</FormLabel>
                            <FormControl><Input {...field} placeholder="nom@exemple.com" type="email"/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mot de passe</FormLabel>
                            <FormControl><Input {...field} placeholder="••••••••" type="password" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="restaurateur">Restaurateur</SelectItem>
                          <SelectItem value="livreur">Livreur</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader className="animate-spin" />}
                        Créer l&apos;utilisateur
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
