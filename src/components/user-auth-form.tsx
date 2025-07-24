
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
    
    try {
        // Try to sign in first
        await signInWithEmailAndPassword(auth, data.email, "defaultPassword123"); // Using a dummy password
        toast({
            title: "Connexion réussie",
            description: "Heureux de vous revoir !",
        });
        router.push('/');
    } catch (error: any) {
        if (error.code === AuthErrorCodes.USER_NOT_FOUND || error.code === 'auth/wrong-password') {
            // If user doesn't exist or wrong password (since we use a dummy one), create a new account
            try {
                await createUserWithEmailAndPassword(auth, data.email, "defaultPassword123");
                toast({
                    title: "Compte créé avec succès",
                    description: "Bienvenue sur Yakro Fê !",
                });
                router.push('/');
            } catch (creationError: any) {
                 toast({
                    variant: "destructive",
                    title: "Erreur de création de compte",
                    description: creationError.message,
                });
            }
        } else {
            // Handle other errors
            toast({
                variant: "destructive",
                title: "Erreur d'authentification",
                description: error.message,
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
