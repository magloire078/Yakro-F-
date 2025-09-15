
'use client';

import * as React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { Button } from './ui/button';

export function UserAuthForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Button onClick={handleGoogleSignIn} disabled={isLoading}>
        {isLoading ? (
          <Loader className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 264.4S111.8 16.8 244 16.8c70.3 0 129.8 27.8 174.3 71.9l-67.8 67.8C314.6 114.5 282.8 96 244 96c-80.6 0-146 65.4-146 146s65.4 146 146 146c92.3 0 128.9-67.9 132.8-101.4H244v-86.8h243.2c1.6 14.5 2.8 29.3 2.8 44.4z"></path>
          </svg>
        )}
        Se connecter avec Google
      </Button>
    </div>
  );
}
