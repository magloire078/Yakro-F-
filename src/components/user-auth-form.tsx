
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const userAuthSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

type FormData = z.infer<typeof userAuthSchema>;

interface UserAuthFormProps {
  mode: 'login' | 'signup';
}

export function UserAuthForm({ mode }: UserAuthFormProps) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isResetting, setIsResetting] = React.useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);

  const emailForReset = watch('email');

  const handlePasswordReset = async () => {
      if (!emailForReset) {
          toast({
              variant: "destructive",
              title: "Adresse e-mail manquante",
              description: "Veuillez d'abord entrer votre adresse e-mail dans le champ prévu.",
          });
          return;
      }
      setIsResetting(true);
      try {
          await sendPasswordResetEmail(auth, emailForReset);
          toast({
              title: "E-mail de réinitialisation envoyé",
              description: "Veuillez consulter votre boîte de réception pour réinitialiser votre mot de passe.",
          });
          setIsResetDialogOpen(false);
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Erreur",
              description: "Impossible d'envoyer l'e-mail. Vérifiez que l'adresse est correcte.",
          });
      } finally {
          setIsResetting(false);
      }
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    if (mode === 'signup') {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        
        await setDoc(doc(db, "utilisateurs", user.uid), {
            email: user.email,
            dateCreation: serverTimestamp(),
            nom: user.email?.split('@')[0] || 'Nouvel utilisateur',
            roleSysteme: 'User',
            role: 'client',
            rolesAutorises: ['client'],
            telephone: '',
            adresseParDefaut: '',
        });
        
        localStorage.removeItem('activeRole');

        toast({
          title: "Compte créé avec succès",
          description: "Bienvenue sur Yakro Fê ! Veuillez choisir un profil.",
        });
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
        router.push('/profile-selection');

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
            <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  Mot de passe
                </Label>
                 {mode === 'login' && (
                    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                        <AlertDialogTrigger asChild>
                             <button type="button" className="text-sm font-medium text-primary hover:underline cursor-pointer">
                                Mot de passe oublié ?
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Un lien de réinitialisation sera envoyé à l'adresse suivante : <span className="font-bold">{emailForReset || "Veuillez entrer une adresse e-mail."}</span>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isResetting}>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePasswordReset} disabled={isResetting || !emailForReset}>
                                    {isResetting ? <Loader className="animate-spin" /> : "Envoyer le lien"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
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
