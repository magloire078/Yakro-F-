
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { SUPER_USER_EMAIL } from '@/lib/types';


const userAuthSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

type FormData = z.infer<typeof userAuthSchema>;

interface UserAuthFormProps {
  mode: 'login' | 'signup';
}

export function UserAuthForm({ mode }: UserAuthFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    if (mode === 'signup') {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        
        // Create a user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            createdAt: serverTimestamp(),
            role: user.email === SUPER_USER_EMAIL ? 'admin' : 'customer'
        });
        
        toast({
          title: "Compte créé avec succès",
          description: "Bienvenue sur Yakro Go ! Veuillez choisir un profil.",
        });
        // Redirect to profile selection after sign up
        router.push('/profile-selection');
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: "Cette adresse e-mail est peut-être déjà utilisée.",
        });
      }
    } else { // mode === 'login'
      try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: "Connexion réussie",
          description: "Heureux de vous revoir !",
        });
        router.push('/');
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Vos identifiants sont incorrects. Veuillez réessayer.",
        });
      }
    }

    setIsLoading(false);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="email">
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
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">
              Mot de passe
            </Label>
            <Input
              id="password"
              placeholder="********"
              type="password"
              disabled={isLoading}
              {...register('password')}
            />
            {errors?.password && (
              <p className="px-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button disabled={isLoading} className="mt-2">
            {isLoading && (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === 'login' ? 'Se connecter' : "Créer un compte"}
          </Button>
        </div>
      </form>
    </div>
  );
}
