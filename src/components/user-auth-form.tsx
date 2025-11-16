
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { AppRole, UserProfile } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const authSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse email valide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
  nom: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.'}),
  telephone: z.string().optional(),
});

type FormData = z.infer<typeof authSchema>;

export function UserAuthForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isLoginView, setIsLoginView] = React.useState(true);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(authSchema.omit({ nom: isLoginView, telephone: isLoginView })),
  });
  
  React.useEffect(() => {
    reset();
  }, [isLoginView, reset]);

  const setupInitialUser = async (user: import('firebase/auth').User) => {
    const userDocRef = doc(db, 'utilisateurs', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            nom: user.displayName || user.email?.split('@')[0] || 'Nouvel utilisateur',
            dateCreation: serverTimestamp(),
            role: 'client',
            rolesAutorises: ['client'],
            roleSysteme: 'User',
        };
        
        try {
            await setDoc(userDocRef, newUserProfile);
        } catch(e) {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUserProfile,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
    }
  }


  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    const clientAuth = getAuth();
    try {
      const result = await signInWithPopup(clientAuth, provider);
      await setupInitialUser(result.user);
      toast({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: error.message || 'Une erreur est survenue lors de la connexion.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const clientAuth = getAuth();
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(clientAuth, data.email, data.password);
        toast({
          title: 'Connexion réussie',
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(clientAuth, data.email, data.password);
        await setupInitialUser(userCredential.user);
      }
    } catch (error: any) {
      let description = "Une erreur inattendue s'est produite.";
      if (error instanceof FirestorePermissionError) {
        description = "Erreur de permissions lors de la création du profil. L'erreur a été enregistrée pour analyse.";
      } else if (error.code === 'auth/email-already-in-use') {
        description = 'Cette adresse e-mail est déjà utilisée.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        description = 'Email ou mot de passe incorrect.';
      } else if (error.message) {
        description = error.message;
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

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {!isLoginView && (
            <div className="grid gap-2">
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                id="nom"
                placeholder="Ex: Aïcha Koné"
                disabled={isLoading || isGoogleLoading}
                {...register('nom')}
                />
                {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>
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
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading || isGoogleLoading}
              {...register('password')}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
           {!isLoginView && (
            <div className="grid gap-2">
                <Label htmlFor="telephone">Numéro de téléphone (optionnel)</Label>
                <Input
                id="telephone"
                type="tel"
                placeholder="Ex: 07 01 02 03 04"
                disabled={isLoading || isGoogleLoading}
                {...register('telephone')}
                />
                {errors.telephone && <p className="text-sm text-destructive">{errors.telephone.message}</p>}
            </div>
          )}
          <Button disabled={isLoading || isGoogleLoading}>
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
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 264.4S111.8 16.8 244 16.8c70.3 0 129.8 27.8 174.3 71.9l-67.8 67.8C314.6 114.5 282.8 96 244 96c-80.6 0-146 65.4-146 146s65.4 146 146 146c92.3 0 128.9-67.9 132.8-101.4H244v-86.8h243.2c1.6 14.5 2.8 29.3 2.8 44.4z"></path>
          </svg>
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
