'use client';

import * as React from 'react';
import { DashboardHero, DashboardHeroProps } from './dashboard-hero';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DashboardPageProps {
    heroProps: DashboardHeroProps;
    children: React.ReactNode;
    containerClassName?: string;
    brandingText?: string;
}

/**
 * DashboardPage - Composant de structure unifié pour toutes les pages du tableau de bord.
 * Garantit une cohérence visuelle sur les marges, le conteneur et le comportement responsive.
 */
export function DashboardPage({ 
    heroProps, 
    children, 
    containerClassName,
    brandingText = "Yakro Ops Elite Framework v4.2"
}: DashboardPageProps) {
    return (
        <div className="min-h-screen bg-transparent pb-24 md:pb-32 relative overflow-x-hidden">
            <DashboardHero {...heroProps} />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cn(
                    "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-24 relative z-40",
                    containerClassName
                )}
            >
                {children}

                {/* Unified Branding Footer */}
                <div className="mt-16 md:mt-24 text-center opacity-20 group hover:opacity-100 transition-all duration-700 pb-10">
                    <div className="h-px w-24 md:w-32 bg-gradient-to-r from-transparent via-border to-transparent mx-auto mb-6 md:mb-8" />
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-muted-foreground group-hover:text-orange-500 transition-colors">
                        {brandingText} &bull; SECURE FLUX
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
