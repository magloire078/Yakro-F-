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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from '@/contexts/auth-context';
import type { AppRole } from '@/lib/types';
import { Checkbox } from './ui/checkbox';


interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const roles: AppRole[] = ['client', 'restaurateur', 'livreur'];

const addUserSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  rolesAutorises: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Vous devez sélectionner au moins un rôle.",
  }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

export function AddUserDialog({ isOpen, onClose }: AddUserDialogProps) {
  const { createNewUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      nom: '',
      email: '',
      password: '',
      rolesAutorises: ['client'],
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
        await createNewUser({
            ...data,
            rolesAutorises: data.rolesAutorises as AppRole[],
        });
        onClose();
    } catch(e) {
        // Error is already toasted in the context
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
            Créez un compte utilisateur et définissez ses rôles. Le mot de passe est temporaire (sa création est simulée).
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
                            <FormLabel>Mot de passe (simulé)</FormLabel>
                            <FormControl><Input {...field} placeholder="••••••••" type="password" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="rolesAutorises"
                    render={() => (
                        <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base">Rôles Autorisés</FormLabel>
                            <FormDescription>
                            Sélectionnez les profils que cet utilisateur pourra utiliser.
                            </FormDescription>
                        </div>
                        {roles.map((role) => (
                            <FormField
                            key={role}
                            control={form.control}
                            name="rolesAutorises"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={role}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(role)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...field.value, role])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== role
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal capitalize">
                                        {role}
                                    </FormLabel>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader className="animate-spin" />}
                        Créer l'utilisateur
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
