
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader } from 'lucide-react';
import CustomerHomePage from '@/components/role-specific/customer-home-page';
import RestaurateurHomePage from '@/components/role-specific/restaurateur-home-page';
import LivreurHomePage from '@/components/role-specific/livreur-home-page';

export default function HomePageSwitcher() {
  const { activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

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
