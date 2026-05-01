'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/lib/types';

const profileSchema = z.object({
  nom: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  role: z.enum(['client', 'restaurateur', 'livreur']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { db } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nom: user?.displayName || '',
      role: 'client',
    },
  });

  // Si le profil existe déjà, on redirige vers la sélection (qui traitera le rôle)
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (!authLoading && user && userProfile) {
      router.replace('/profile-selection');
    }
  }, [user, userProfile, authLoading, router]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSaving(true);

    try {
      const userDocRef = doc(db, 'utilisateurs', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        nom: data.nom,
        role: data.role,
        roleSysteme: 'User',
        dateCreation: serverTimestamp(),
      });

      toast({
        title: 'Profil créé !',
        description: 'Bienvenue sur Yakro Fê. Redirection en cours...',
      });

      // Rediriger vers la sélection du profil pour activer le rôle
      router.push('/profile-selection');
    } catch (error: unknown) {
      console.error("Error creating profile:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de créer votre profil. Veuillez réessayer.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || (user && userProfile)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container relative h-screen flex items-center justify-center">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <UserCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-headline">Complétez votre profil</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Dernière étape ! Identifiez-vous pour commencer l&apos;aventure à Yamoussoukro.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet</Label>
              <Input
                id="nom"
                placeholder="Ex: Kouamé Bakayoko"
                {...form.register('nom')}
                disabled={isSaving}
              />
              {form.formState.errors.nom && (
                <p className="text-sm text-destructive">{form.formState.errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Je suis un...</Label>
              <Select
                onValueChange={(value: AppRole) => form.setValue('role', value)}
                defaultValue={form.getValues('role')}
                disabled={isSaving}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Choisissez votre rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client (commander des plats)</SelectItem>
                  <SelectItem value="restaurateur">Restaurateur (gérer un établissement)</SelectItem>
                  <SelectItem value="livreur">Livreur (effectuer des livraisons)</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full text-lg font-semibold" type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Finaliser mon inscription'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
    </div>
  );
}
