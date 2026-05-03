'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatItem {
    label: string;
    value: string | number;
    growth?: number;
    unit?: string;
    icon?: LucideIcon;
    color?: 'orange' | 'emerald' | 'white';
}

interface DashboardStatsProps {
    items: StatItem[];
    className?: string;
}

/**
 * DashboardStats - Un composant de statistiques standardisé pour le Hero du tableau de bord.
 * Suit l'esthétique "Yakro Elite" avec des séparateurs rotatifs et des animations fluides.
 */
export function DashboardStats({ items, className }: DashboardStatsProps) {
    return (
        <div className={cn("flex justify-center items-center gap-6 md:gap-16 lg:gap-20 mt-4 md:mt-6 px-4 flex-wrap", className)}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <div className="text-center group cursor-default min-w-[70px] md:min-w-[100px] flex-shrink-0">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                {item.icon && <item.icon className={cn(
                                    "h-2.5 w-2.5 md:h-3 md:w-3",
                                    item.color === 'orange' ? "text-orange-500" :
                                    item.color === 'emerald' ? "text-emerald-500" :
                                    "text-muted-foreground"
                                )} />}
                                <p className={cn(
                                    "text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]",
                                    item.color === 'orange' ? "text-orange-500/80" :
                                    item.color === 'emerald' ? "text-emerald-500/80" :
                                    "text-muted-foreground"
                                )}>
                                    {item.label}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 relative">
                                <p className={cn(
                                    "text-2xl md:text-3xl lg:text-5xl font-black text-foreground tracking-tighter transition-all duration-500 group-hover:scale-110",
                                    item.color === 'orange' && "group-hover:text-orange-500",
                                    item.color === 'emerald' && "group-hover:text-emerald-500 text-emerald-400"
                                )}>
                                    {typeof item.value === 'number' ? item.value.toLocaleString('fr-FR') : item.value}
                                    {item.unit && <span className="text-[8px] md:text-[10px] font-black ml-1 opacity-30 uppercase tracking-widest">{item.unit}</span>}
                                </p>
                                
                                {item.growth !== undefined && (
                                    <div className={cn(
                                        "ml-1.5 flex items-center gap-0.5 px-1 md:px-1.5 py-0.5 rounded-md text-[7px] md:text-[9px] font-black shadow-lg",
                                        item.growth >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                    )}>
                                        {item.growth >= 0 ? <ArrowUpRight className="h-2 w-2" /> : <ArrowDownRight className="h-2 w-2" />}
                                        {Math.abs(item.growth).toFixed(0)}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {index < items.length - 1 && (
                        <div className="w-px h-8 md:h-12 lg:h-14 bg-foreground/10 dark:bg-white/10 self-center rotate-12 hidden sm:block" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
