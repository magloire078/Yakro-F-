'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disableLink?: boolean;
  compact?: boolean;
}

export function Logo({ className, size = 'md', disableLink = false, compact = false }: LogoProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
    xl: 'h-16 w-16',
  };

  const content = (
    <div className={cn("flex items-center gap-2 font-black italic tracking-tighter", className)}>
      <div className={cn("bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-600 text-white rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-orange-500/25", iconSizes[size])}>
        <Sparkles className="h-2/3 w-2/3" />
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className={cn("bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300", sizes[size])}>
            Yakro<span className="text-orange-500">F</span><span className="text-emerald-500 dark:text-emerald-400">ê</span>
          </span>
          <div className="flex h-0.5 w-full rounded-full overflow-hidden mt-0.5 opacity-90 shadow-xs">
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-white dark:bg-slate-200" />
            <div className="flex-1 bg-emerald-500" />
          </div>
        </div>
      )}
    </div>
  );

  if (disableLink) return content;

  return (
    <Link href="/" className="hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
}
