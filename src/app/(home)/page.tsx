
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader } from 'lucide-react';
import CustomerHomePage from '@/components/role-specific/customer-home-page';
import RestaurateurHomePage from '@/components/role-specific/restaurateur-home-page';
import LivreurHomePage from '@/components/role-specific/livreur-home-page';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { activeRole, loading } = useAuth();
  const router = useRouter();

  // Redirect to the correct auth page if the role is not yet determined
  // This acts as a fallback.
  React.useEffect(() => {
    if (!loading && activeRole) {
       router.replace(`/auth/${activeRole}`);
    }
  }, [activeRole, loading, router]);


  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // This part will likely not be rendered due to the redirection above,
  // but it's here as a safeguard.
  switch (activeRole) {
    case 'restaurateur':
      return <RestaurateurHomePage />;
    case 'livreur':
      return <LivreurHomePage />;
    case 'client':
    default:
      return <CustomerHomePage />;
  }
}
