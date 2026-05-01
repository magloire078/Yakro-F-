'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MobileBackButtonProps {
  className?: string;
  label?: string;
  href?: string;
}

export function MobileBackButton({ className, label = "Retour", href }: MobileBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn(
        "md:hidden flex items-center gap-2 -ml-2 mb-6 group transition-all duration-300",
        "text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl px-3 h-10",
        "animate-in fade-in slide-in-from-left-4 duration-500",
        className
      )}
    >
      <div className="p-1.5 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors border border-orange-500/20">
        <ChevronLeft className="h-4 w-4" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{label}</span>
    </Button>
  );
}
