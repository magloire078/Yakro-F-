'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MobileBackButton } from '@/components/mobile-back-button';
import { cn } from '@/lib/utils';

export interface DashboardHeroProps {
    backgroundImage: string;
    badgeIcon?: React.ReactNode;
    badgeText?: string;
    title: React.ReactNode;
    subtitle?: string;
    backButtonHref?: string;
    backButtonLabel?: string;
    children?: React.ReactNode;
    className?: string;
}

/**
 * DashboardHero - A unified cinematic header for all dashboard pages.
 * Ensures "Yakro Elite" consistency in heights, font sizes, and animations.
 */
export function DashboardHero({
    backgroundImage,
    badgeIcon,
    badgeText,
    title,
    subtitle,
    backButtonHref = "/restaurateur",
    backButtonLabel = "Dashboard",
    children,
    className
}: DashboardHeroProps) {
    return (
        <div className={cn("relative min-h-[30vh] md:min-h-[40vh] w-full overflow-hidden flex items-start justify-center pt-16 md:pt-20 pb-16 md:pb-24", className)}>
            {/* Background Image with Cinematic Effects */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={backgroundImage}
                    alt="Hero Background"
                    fill
                    className="object-cover scale-110 animate-slow-zoom opacity-10"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60 z-10" />
            </div>
            
            <div className="relative z-30 text-center space-y-2 md:space-y-4 px-6 max-w-5xl pt-4 md:pt-0">
                {/* Mobile Back Button */}
                <div className="md:hidden absolute -top-4 left-0 z-50">
                    <MobileBackButton label={backButtonLabel} href={backButtonHref} />
                </div>

                {/* Badge */}
                {badgeText && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-2xl mb-1 shadow-2xl"
                    >
                        {badgeIcon && <span className="text-orange-500">{badgeIcon}</span>}
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-orange-500">
                            {badgeText}
                        </span>
                    </motion.div>
                )}
                
                {/* Title & Subtitle */}
                <div className="space-y-1 md:space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white mb-0.5 leading-[0.9] md:leading-none"
                    >
                        {title}
                    </motion.h1>
                    {subtitle && (
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-muted-foreground font-bold text-[7px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.4em] italic opacity-80"
                        >
                            {subtitle}
                        </motion.p>
                    )}
                </div>

                {/* Additional Content (Stats, Actions, etc.) */}
                {children && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {children}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
