
'use client';

import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { useData } from '@/contexts/data-context';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { fetchData, isLoading } = useData();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  return (
      <div className="flex min-h-screen">
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col">
          <MobileHeader />
          <main className="flex-1 p-4 md:p-8 bg-muted/30">{children}</main>
        </div>
      </div>
  );
}
