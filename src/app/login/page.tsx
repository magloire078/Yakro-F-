
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Icons } from '@/components/icons';
import { UserAuthForm } from '@/components/user-auth-form';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getPlaceholderImage } from '@/lib/placeholder-images';

export default function LoginPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        if (!authLoading && user && !isRedirecting) {
            setIsRedirecting(true);
            router.replace('/profile-selection');
        }
    }, [user, authLoading, isRedirecting, router]);
    
    if (authLoading || isRedirecting || (!authLoading && user)) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Configuration de votre session...</p>
            </div>
        )
    }
    
    const placeholder = getPlaceholderImage('login delivery');

    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
             <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <Image
                    src={placeholder.url}
                    alt="Un jeune livreur souriant d'origine ouest-africaine remet un sac de livraison en papier à un client satisfait à sa porte."
                    fill
                    className="object-cover"
                    data-ai-hint="login delivery"
                    priority
                />
                <div className="absolute inset-0 bg-primary/70" />
                <div className="relative z-20 flex items-center font-medium">
                    <Icons.logo className="h-8 w-8 mr-2 text-primary-foreground" />
                    <span className="font-display text-3xl">Yakro Fê</span>
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                    <p className="text-lg">
                        &ldquo;Cette application a transformé la façon dont je découvre les restaurants locaux. Un must-have pour tous les gourmands de Yakro !&rdquo;
                    </p>
                    <footer className="text-sm">Aïcha K., cliente satisfaite</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                 <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="font-display text-3xl text-primary">
                            Accédez à votre compte
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Entrez vos identifiants ou créez un nouveau compte.
                        </p>
                    </div>
                    <UserAuthForm />
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        En cliquant sur continuer, vous acceptez nos{" "}
                        <Link
                            href="/terms"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Conditions d'utilisation
                        </Link>{" "}
                        et notre{" "}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Politique de confidentialité
                        </Link>
                        .
                    </p>
                 </div>
            </div>
        </div>
    )
}
