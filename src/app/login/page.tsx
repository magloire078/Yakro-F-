'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserAuthForm } from '@/components/user-auth-form';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/logo';

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
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
                <Loader className="h-16 w-16 animate-spin text-orange-500" />
                <p className="text-orange-600 font-bold animate-pulse">Yakro Fê se prépare...</p>
            </div>
        )
    }
    
    return (
        <div className="relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-slate-50 dark:bg-slate-950 overflow-hidden">
             <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
                <Image
                    src="/assets/marketing/hero-delivery.png"
                    alt="Yakro Elite Delivery"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/20 to-transparent" />
                <div className="relative z-20 flex items-center">
                    <Logo size="lg" className="invert brightness-0" />
                </div>
                <div className="relative z-20 mt-auto glass-dark p-10 rounded-[3rem] border-white/10 shadow-2xl animate-float">
                    <blockquote className="space-y-6">
                        <p className="text-3xl font-black italic leading-[1.1] tracking-tighter uppercase">
                            &ldquo;L&apos;excellence n&apos;est pas un service, c&apos;est une promesse. Yakro Go redéfinit l&apos;art de vivre à Yamoussoukro.&rdquo;
                        </p>
                        <footer className="flex items-center gap-6">
                            <div className="h-0.5 w-16 bg-orange-500 rounded-full" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">Elite Concierge Service</span>
                        </footer>
                    </blockquote>
                </div>
            </div>
            <div className="relative p-6 h-full flex items-center justify-center z-10">
                 {/* Mobile Background Image */}
                 <div className="absolute inset-0 lg:hidden">
                    <Image
                        src="/assets/marketing/hero-food.png"
                        alt="Yakro Elite Food"
                        fill
                        className="object-cover opacity-30 brightness-50"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />
                 </div>
                 <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-3xl lg:hidden" />

                 <div className="mx-auto flex w-full flex-col justify-center space-y-10 sm:w-[500px] glass-dark lg:glass p-8 sm:p-14 rounded-[3rem] border-white/10 lg:border-slate-200/50 shadow-2xl">
                    <div className="flex flex-col space-y-4 text-center">
                        <div className="lg:hidden flex justify-center mb-4">
                            <Logo size="lg" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground lg:text-slate-900 uppercase italic">
                            Bienvenue dans <span className="text-orange-500 drop-shadow-sm">l&apos;Elite</span>
                        </h1>
                        <p className="text-sm sm:text-base text-slate-400 lg:text-slate-500 font-medium tracking-tight">
                            Connectez-vous pour transcender votre expérience.
                        </p>
                    </div>
                    <UserAuthForm />
                    <p className="px-8 text-center text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-widest opacity-60">
                        En continuant, vous adhérez à nos{" "}
                        <Link href="/terms" className="text-orange-500 hover:text-orange-600 underline-offset-4 font-black">Conditions</Link>{" "}
                        &{" "}
                        <Link href="/privacy" className="text-orange-500 hover:text-orange-600 underline-offset-4 font-black">Confidentialité</Link>.
                    </p>
                 </div>
            </div>
        </div>
    )
}
