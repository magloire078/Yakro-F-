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
      <div className={cn("bg-orange-500 text-white rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-orange-500/20", iconSizes[size])}>
        <Sparkles className="h-2/3 w-2/3" />
      </div>
      {!compact && (
        <span className={cn("bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300", sizes[size])}>
          Yakro<span className="text-orange-500">Go</span>
        </span>
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
