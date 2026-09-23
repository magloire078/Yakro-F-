'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useFirebase } from '@/contexts/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { AppRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const loginSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse email valide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse email valide.' }),
});

const signupSchema = z.object({
  nom: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.'}),
  email: z.string().email({ message: 'Veuillez entrer une adresse email valide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
  telephone: z.string().optional(),
  role: z.enum(['client', 'restaurateur', 'livreur']),
  codeParrainage: z.string().optional(),
});


type AuthFormValues = z.infer<typeof signupSchema> & z.infer<typeof loginSchema>;

// Instancié une seule fois plutôt qu'à chaque rendu du formulaire.
const googleAuthProvider = new GoogleAuthProvider();

function UserAuthFormContent() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isLoginView, setIsLoginView] = React.useState(true);
  const [showResetView, setShowResetView] = React.useState(false);
  const [isResetLoading, setIsResetLoading] = React.useState(false);
  const { auth, db } = useFirebase();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  // Un lien de parrainage (`?ref=<uid-du-parrain>`) pré-remplit le champ ;
  // l'utilisateur peut aussi saisir/coller le code manuellement.
  const referralFromLink = searchParams.get('ref') || '';

  const resetForm = useForm<{ email: string }>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  const form = useForm<AuthFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isLoginView ? loginSchema : signupSchema) as any,
    defaultValues: {
        nom: '',
        email: '',
        password: '',
        telephone: '',
        role: 'client' as AppRole,
        codeParrainage: referralFromLink,
    }
  });

  React.useEffect(() => {
    form.reset({
        nom: '',
        email: '',
        password: '',
        telephone: '',
        role: 'client' as AppRole,
        codeParrainage: referralFromLink,
    });
  }, [isLoginView, form, referralFromLink]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const userDocRef = doc(db, 'utilisateurs', result.user.uid);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;

      const profileData = {
          uid: result.user.uid,
          email: result.user.email!,
          nom: result.user.displayName || result.user.email?.split('@')[0],
          dateCreation: serverTimestamp(),
          role: 'client',
          roleSysteme: 'User',
          // parrainId n'est capturable qu'à la toute première connexion —
          // sur les connexions suivantes le champ est verrouillé par les
          // rules (immuable), donc on ne le renvoie jamais sur un merge.
          ...(isNewUser && referralFromLink && referralFromLink !== result.user.uid
            ? { parrainId: referralFromLink }
            : {}),
      };

      setDoc(userDocRef, profileData, { merge: true })
        .catch(async () => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'write',
                requestResourceData: profileData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

      toast({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté via Google.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion.';
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion Google',
        description: errorMessage,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: 'Connexion réussie' });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const userDocRef = doc(db, 'utilisateurs', userCredential.user.uid);
        
        const parrainId = data.codeParrainage?.trim();
        const profileData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email!,
            nom: data.nom,
            telephone: data.telephone || '',
            dateCreation: serverTimestamp(),
            role: data.role,
            roleSysteme: 'User',
            ...(parrainId && parrainId !== userCredential.user.uid ? { parrainId } : {}),
        };

        setDoc(userDocRef, profileData)
            .catch(async () => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'create',
                    requestResourceData: profileData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });

        toast({
            title: 'Compte créé avec succès!',
            description: `Bienvenue sur Yakro Fê. Votre profil ${data.role} a été créé.`,
        });
      }
    } catch (error: unknown) {
      let description = "Une erreur inattendue s'est produite.";
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code) {
          switch(firebaseError.code) {
              case 'auth/email-already-in-use':
                description = 'Cette adresse e-mail est déjà utilisée.';
                break;
              case 'auth/wrong-password':
              case 'auth/user-not-found':
              case 'auth/invalid-credential':
                description = 'Email ou mot de passe incorrect.';
                break;
              default:
                description = `Erreur: ${firebaseError.code}`;
          }
      } else if (firebaseError.message) {
        description = firebaseError.message;
      }
      
      toast({
        variant: 'destructive',
        title: isLoginView ? 'Erreur de connexion' : 'Erreur d\'inscription',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: { email: string }) => {
    setIsResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      // Toujours afficher le même message de succès, y compris si le compte
      // n'existe pas (`auth/user-not-found`) : révéler la différence
      // permettrait à quiconque de vérifier quelles adresses ont un compte
      // sur Yakro Fê. Seules les erreurs qui ne renseignent sur aucun compte
      // précis (email mal formé, trop de tentatives) sont affichées telles
      // quelles.
      if (firebaseError.code && firebaseError.code !== 'auth/user-not-found') {
        let description = "Une erreur inattendue s'est produite.";
        if (firebaseError.code === 'auth/invalid-email') {
          description = 'Adresse email invalide.';
        } else if (firebaseError.code === 'auth/too-many-requests') {
          description = 'Trop de tentatives. Veuillez réessayer plus tard.';
        }
        toast({ variant: 'destructive', title: 'Erreur', description });
        setIsResetLoading(false);
        return;
      }
    }
    toast({
      title: 'Email envoyé',
      description: `Si un compte existe pour ${data.email}, un lien de réinitialisation vient de lui être envoyé.`,
    });
    resetForm.reset();
    setShowResetView(false);
    setIsResetLoading(false);
  };

  if (showResetView) {
    return (
      <div className="grid gap-6">
        <form onSubmit={resetForm.handleSubmit(handleResetPassword)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="nom@exemple.com"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isResetLoading}
                {...resetForm.register('email')}
              />
              {resetForm.formState.errors.email && (
                <p className="text-sm text-destructive">{String(resetForm.formState.errors.email.message)}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Saisissez l&apos;adresse email de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.
              </p>
            </div>
            <Button disabled={isResetLoading} type="submit">
              {isResetLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer le lien de réinitialisation
            </Button>
          </div>
        </form>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <button
            className="underline underline-offset-4 hover:text-primary"
            onClick={() => setShowResetView(false)}
          >
            Retour à la connexion
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {!isLoginView && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                id="nom"
                placeholder="Ex: Aïcha Koné"
                disabled={isLoading || isGoogleLoading}
                {...form.register('nom')}
                />
                {form.formState.errors.nom && <p className="text-sm text-destructive">{String(form.formState.errors.nom.message)}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Je suis un...</Label>
                <Select onValueChange={(value: AppRole) => form.setValue('role', value)} defaultValue={form.getValues('role')}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="restaurateur">Restaurateur</SelectItem>
                        <SelectItem value="livreur">Livreur</SelectItem>
                    </SelectContent>
                </Select>
                 {form.formState.errors.role && <p className="text-sm text-destructive">{String(form.formState.errors.role.message)}</p>}
              </div>
            </>
           )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nom@exemple.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading || isGoogleLoading}
              {...form.register('email')}
            />
            {form.formState.errors.email && <p className="text-sm text-destructive">{String(form.formState.errors.email.message)}</p>}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              {isLoginView && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                  onClick={() => {
                    resetForm.setValue('email', form.getValues('email'));
                    setShowResetView(true);
                  }}
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              disabled={isLoading || isGoogleLoading}
              {...form.register('password')}
            />
            {form.formState.errors.password && <p className="text-sm text-destructive">{String(form.formState.errors.password.message)}</p>}
          </div>
           {!isLoginView && (
            <div className="grid gap-2">
                <Label htmlFor="telephone">Numéro de téléphone (optionnel)</Label>
                <Input
                id="telephone"
                type="tel"
                placeholder="Ex: 07 01 02 03 04"
                disabled={isLoading || isGoogleLoading}
                {...form.register('telephone')}
                />
                {form.formState.errors.telephone && <p className="text-sm text-destructive">{String(form.formState.errors.telephone.message)}</p>}
            </div>
          )}
          {!isLoginView && (
            <div className="grid gap-2">
                <Label htmlFor="codeParrainage">Code de parrainage (optionnel)</Label>
                <Input
                id="codeParrainage"
                placeholder="Collé depuis un lien d'invitation"
                disabled={isLoading || isGoogleLoading}
                {...form.register('codeParrainage')}
                />
            </div>
          )}
          <Button disabled={isLoading || isGoogleLoading} type="submit">
            {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isLoginView ? 'Se connecter' : 'Créer un compte'}
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            OU CONTINUER AVEC
          </span>
        </div>
      </div>
      <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
        {isGoogleLoading ? (
          <Loader className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.4 0 129.1 110.3 18.8 244 18.8c71.2 0 132.8 29 178.7 75.4l-75.4 64.5c-23.5-21.7-56.9-35.9-96.2-35.9-74.1 0-134.4 60.3-134.4 134.4s60.3 134.4 134.4 134.4c87.3 0 112.5-65.7 116.8-99.2H244v-87.1h244c2.5 13.1 3.9 26.6 3.9 40.8z"></path></svg>
        )}
        Google
      </Button>
       <p className="px-8 text-center text-sm text-muted-foreground">
        <button
          className="underline underline-offset-4 hover:text-primary"
          onClick={() => setIsLoginView(!isLoginView)}
        >
          {isLoginView ? "Vous n'avez pas de compte ? S'inscrire" : "Vous avez déjà un compte ? Se connecter"}
        </button>
      </p>
    </div>
  );
}

export function UserAuthForm() {
  return (
    <React.Suspense fallback={<Loader className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />}>
      <UserAuthFormContent />
    </React.Suspense>
  );
}
