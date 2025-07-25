
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthErrorCodes } from 'firebase/auth';
import { useRouter } from 'next/navigation';


const userAuthSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
});

type FormData = z.infer<typeof userAuthSchema>;

export function UserAuthForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    
    // Using a dummy password for this demo since we don't have a password field
    const dummyPassword = "defaultPassword123";

    try {
        // Try to sign in first
        await signInWithEmailAndPassword(auth, data.email, dummyPassword);
        toast({
            title: "Connexion réussie",
            description: "Heureux de vous revoir !",
        });
        router.push('/');
    } catch (error: any) {
        // If sign-in fails, check the error code.
        if (error.code === AuthErrorCodes.USER_NOT_FOUND || error.code === 'auth/wrong-password') {
            // If the user does not exist or the dummy password is wrong (likely for an existing user from a previous session),
            // attempt to create a new account.
            try {
                await createUserWithEmailAndPassword(auth, data.email, dummyPassword);
                toast({
                    title: "Compte créé avec succès",
                    description: "Bienvenue sur Yakro Go !",
                });
                router.push('/profile-selection');
            } catch (creationError: any) {
                 // This can happen if the user exists but the password was wrong in the initial sign-in attempt.
                 if (creationError.code === AuthErrorCodes.EMAIL_EXISTS) {
                     toast({
                        variant: "destructive",
                        title: "Erreur de connexion",
                        description: "Un compte avec cet e-mail existe déjà, mais le mot de passe est incorrect. Comme il s'agit d'une démo, ce cas ne peut être résolu.",
                    });
                 } else {
                    toast({
                        variant: "destructive",
                        title: "Erreur de création de compte",
                        description: "Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.",
                    });
                 }
            }
        } else if (error.code === AuthErrorCodes.INVALID_CREDENTIAL) {
            // This is a more generic error, often happens if the email format is malformed on Firebase's side
            // or other sign-in issues. We'll guide the user to try creating an account.
            toast({
                variant: "destructive",
                title: "Erreur d'authentification",
                description: "Impossible de vous connecter. Si vous n'avez pas de compte, nous allons essayer d'en créer un.",
            });
             try {
                await createUserWithEmailAndPassword(auth, data.email, dummyPassword);
                toast({
                    title: "Compte créé avec succès",
                    description: "Bienvenue sur Yakro Go !",
                });
                router.push('/profile-selection');
            } catch (creationError: any) {
                 toast({
                    variant: "destructive",
                    title: "Erreur de création de compte",
                    description: "Une erreur est survenue. Veuillez réessayer.",
                });
            }
        }
        
        else {
            // Handle other unexpected errors
            toast({
                variant: "destructive",
                title: "Erreur d'authentification",
                description: `Une erreur inattendue est survenue: ${error.message}`,
            });
        }
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="nom@exemple.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register('email')}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
             <p className="px-1 text-xs text-muted-foreground">
                Aucun mot de passe requis pour cette démo.
              </p>
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            )}
            Continuer avec l'e-mail
          </Button>
        </div>
      </form>
    </div>
  );
}
