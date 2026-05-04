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
    className?: string;
}

/**
 * DashboardPage - Composant de structure unifié pour toutes les pages du tableau de bord.
 * Garantit une cohérence visuelle sur les marges, le conteneur et le comportement responsive.
 */
export function DashboardPage({ 
    heroProps, 
    children, 
    containerClassName,
    brandingText = "Yakro Ops Elite Framework v4.2",
    className
}: DashboardPageProps) {
    return (
        <div className={cn("min-h-screen bg-transparent pb-16 md:pb-20 relative overflow-x-hidden", className)}>
            <DashboardHero {...heroProps} />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cn(
                    "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 md:-mt-14 relative z-40 pt-2 md:pt-4",
                    containerClassName
                )}
            >
                {children}

                {/* Unified Branding Footer */}
                <div className="mt-8 md:mt-12 text-center opacity-20 group hover:opacity-100 transition-all duration-700 pb-8">
                    <div className="h-px w-24 md:w-32 bg-gradient-to-r from-transparent via-border to-transparent mx-auto mb-6 md:mb-8" />
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground group-hover:text-orange-500 transition-colors">
                        {brandingText} &bull; SECURE FLUX
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
