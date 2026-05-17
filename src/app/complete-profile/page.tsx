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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-16 w-16 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-background overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-background to-background" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-500/10 blur-[120px]" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-500/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-card/60 backdrop-blur-xl border border-orange-500/20 rounded-[2rem] shadow-2xl shadow-orange-500/10 p-10 space-y-8">
          <div className="space-y-4 text-center">
            <div className="inline-flex p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-lg shadow-orange-500/10">
              <UserCircle className="h-10 w-10 text-orange-500" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/70">Dernière étape</p>
              <h1 className="text-3xl font-headline font-black italic uppercase tracking-tighter text-foreground leading-none">
                Complétez votre <span className="text-orange-500">Profil</span>
              </h1>
              <p className="text-sm font-medium text-muted-foreground/80 max-w-xs mx-auto">
                Identifiez-vous pour commencer l&apos;aventure à Yamoussoukro.
              </p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom complet</Label>
              <Input
                id="nom"
                placeholder="Ex: Kouamé Bakayoko"
                className="h-12 rounded-2xl border-border/50 bg-background/50 focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50"
                {...form.register('nom')}
                disabled={isSaving}
              />
              {form.formState.errors.nom && (
                <p className="text-xs text-destructive">{form.formState.errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Je suis un…</Label>
              <Select
                onValueChange={(value: AppRole) => form.setValue('role', value)}
                defaultValue={form.getValues('role')}
                disabled={isSaving}
              >
                <SelectTrigger id="role" className="h-12 w-full rounded-2xl border-border/50 bg-background/50 focus:ring-orange-500/30">
                  <SelectValue placeholder="Choisissez votre rôle" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="client">Client (commander des plats)</SelectItem>
                  <SelectItem value="restaurateur">Restaurateur (gérer un établissement)</SelectItem>
                  <SelectItem value="livreur">Livreur (effectuer des livraisons)</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl shadow-orange-500/20 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Création en cours…
                </>
              ) : (
                'Finaliser mon inscription'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
