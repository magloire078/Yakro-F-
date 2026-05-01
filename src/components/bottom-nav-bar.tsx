
'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Sparkles, History, ClipboardList, BookOpenCheck, BarChart, Bike, DollarSign } from 'lucide-react';
import * as React from 'react';

const clientLinks = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/recommendations', label: 'Pour Vous', icon: Sparkles },
    { href: '/orders', label: 'Historique', icon: History },
];

const restaurateurLinks = [
    { href: '/restaurateur', label: 'Dashboard', icon: Home },
    { href: '/dashboard/menu', label: 'Menus', icon: BookOpenCheck },
    { href: '/dashboard/orders', label: 'Commandes', icon: ClipboardList },
    { href: '/dashboard/analytics', label: 'Stats', icon: BarChart },
];

const livreurLinks = [
    { href: '/livreur', label: 'Courses', icon: Bike },
    { href: '/dashboard/earnings', label: 'Gains', icon: DollarSign },
];


export function BottomNavBar() {
    const { activeRole, userProfile } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    let links;
    let gridColsClass;
    
    switch(activeRole) {
        case 'restaurateur':
            links = restaurateurLinks;
            gridColsClass = 'grid-cols-5';
            break;
        case 'livreur':
            links = livreurLinks;
            gridColsClass = 'grid-cols-3';
            break;
        case 'client':
        default:
            links = clientLinks;
            gridColsClass = 'grid-cols-4';
    }
    
    if (!userProfile || userProfile.roleSysteme === 'SuperAdmin') return null;

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border-t border-white/60 dark:border-slate-800/60 md:hidden">
            <div className={cn("grid h-full mx-auto font-medium", gridColsClass)}>
                {links.map((link) => {
                     const isActive = pathname === link.href;
                     return (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className={cn(
                                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                            <link.icon className="w-5 h-5 mb-1" />
                            <span className="text-xs">{link.label}</span>
                        </Link>
                     )
                })}
                 <Link 
                    href="/profile" 
                    className={cn(
                        "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group",
                        pathname === '/profile' ? "text-primary" : "text-muted-foreground"
                    )}>
                    <svg className="w-5 h-5 mb-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9.05 13.55a1 1 0 0 0 1.9 0 3.987 3.987 0 0 1 3.951 3.462A8.949 8.949 0 0 1 10 18Z"/>
                    </svg>
                    <span className="text-xs">Moi</span>
                </Link>
            </div>
        </div>
    );
}
