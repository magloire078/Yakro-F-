
'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Sparkles, History, ClipboardList, BookOpenCheck, BarChart, Bike, DollarSign } from 'lucide-react';
import * as React from 'react';
import { motion } from 'framer-motion';

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
        <div className="fixed bottom-0 left-0 z-50 w-full h-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-orange-100/50 dark:border-slate-800/50 md:hidden pb-safe">
            <div className={cn("grid h-full mx-auto font-medium", gridColsClass)}>
                {links.map((link) => {
                     const isActive = pathname === link.href;
                     return (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className={cn(
                                "relative inline-flex flex-col items-center justify-center px-5 group transition-colors duration-300",
                                isActive ? "text-orange-500" : "text-slate-400"
                            )}>
                            {isActive && (
                                <motion.div 
                                    layoutId="nav-glow"
                                    className="absolute inset-0 bg-orange-500/5 blur-xl rounded-full" 
                                />
                            )}
                            <link.icon className={cn("w-6 h-6 mb-1 transition-transform duration-300", isActive && "scale-110")} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{link.label}</span>
                            {isActive && (
                                <motion.div 
                                    layoutId="nav-dot"
                                    className="absolute bottom-2 w-1 h-1 bg-orange-500 rounded-full" 
                                />
                            )}
                        </Link>
                     )
                })}
                 <Link 
                    href="/profile" 
                    className={cn(
                        "relative inline-flex flex-col items-center justify-center px-5 group transition-colors duration-300",
                        pathname === '/profile' ? "text-orange-500" : "text-slate-400"
                    )}>
                    {pathname === '/profile' && (
                        <motion.div 
                            layoutId="nav-glow"
                            className="absolute inset-0 bg-orange-500/5 blur-xl rounded-full" 
                        />
                    )}
                    <svg className={cn("w-6 h-6 mb-1 transition-transform duration-300", pathname === '/profile' && "scale-110")} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9.05 13.55a1 1 0 0 0 1.9 0 3.987 3.987 0 0 1 3.951 3.462A8.949 8.949 0 0 1 10 18Z"/>
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Moi</span>
                    {pathname === '/profile' && (
                        <motion.div 
                            layoutId="nav-dot"
                            className="absolute bottom-2 w-1 h-1 bg-orange-500 rounded-full" 
                        />
                    )}
                </Link>
            </div>
        </div>
    );
}
