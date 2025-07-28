'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ChefHat, Loader, Bike } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { SUPER_USER_EMAIL } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function ProfileSelectionPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    if (loading || !user) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    const isSuperUser = user.email === SUPER_USER_EMAIL;
    
    const AdminProfileCard = ({ href, icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) => {
        const cardContent = (
             <Card className={cn(
                "h-full flex flex-col items-center justify-center p-8 text-center transition-all duration-300 shadow-lg",
                isSuperUser ? "hover:bg-accent/50 hover:border-primary cursor-pointer hover:shadow-2xl" : "bg-muted/50 cursor-not-allowed opacity-70"
             )}>
                <CardHeader>
                    {icon}
                    <CardTitle className="mt-4 text-2xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                     <CardDescription>
                       {description}
                    </CardDescription>
                </CardContent>
            </Card>
        );

        if (isSuperUser) {
            return <Link href={href} className="h-full">{cardContent}</Link>;
        }

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="h-full">{cardContent}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ce profil est réservé aux administrateurs.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }


    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-headline text-primary mb-4">Quel type de profil souhaitez-vous utiliser ?</h1>
            <p className="text-muted-foreground mb-12 max-w-2xl">
                Choisissez le profil qui correspond à votre utilisation de Yakro Go. Vous pourrez explorer les fonctionnalités correspondantes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                <Link href="/" className="h-full">
                    <Card className="h-full flex flex-col items-center justify-center p-8 text-center hover:bg-accent/50 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl">
                        <CardHeader>
                            <User className="h-16 w-16 mx-auto text-primary" />
                            <CardTitle className="mt-4 text-2xl">Je suis un Client</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Parcourez les restaurants, découvrez de nouveaux plats et passez vos commandes en quelques clics.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
                
                <AdminProfileCard
                    href="/dashboard"
                    icon={<ChefHat className="h-16 w-16 mx-auto text-primary" />}
                    title="Je suis un Restaurateur"
                    description="Gérez votre menu, créez des plats avec l'IA et développez votre activité grâce à nos outils marketing."
                />

                <AdminProfileCard
                    href="/delivery"
                    icon={<Bike className="h-16 w-16 mx-auto text-primary" />}
                    title="Je suis un Livreur"
                    description="Acceptez des courses, suivez vos livraisons et gérez vos revenus."
                />

            </div>
        </div>
    );
}
