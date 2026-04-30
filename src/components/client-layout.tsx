'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { NotificationPermissionPrompt } from '@/components/notification-permission-prompt';
import { OnboardingTour } from '@/components/onboarding-tour';
import { FeedbackButton } from '@/components/feedback-button';
import { InstallPrompt } from '@/components/install-prompt';
import { ErrorBoundary } from '@/components/error-boundary';
import { useOrderNotifications } from '@/hooks/use-order-notifications';
import { useGlobalErrorReporter } from '@/hooks/use-global-error-reporter';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const pathname = usePathname();

  // Notifications toast + Browser API sur les changements de statut.
  useOrderNotifications();
  // Capture les erreurs JS globales et les pousse dans /erreurs.
  useGlobalErrorReporter();

  const isAuthPage = pathname === '/login' || pathname === '/profile-selection';

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-foreground transition-colors duration-300">
      <a href="#main-content" className="skip-link">Aller au contenu principal</a>
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col md:pl-64">
        <MobileHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-10 pb-24 md:pb-10">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <BottomNavBar />
        <OnboardingTour />
        <NotificationPermissionPrompt />
        <InstallPrompt />
        <FeedbackButton />
      </div>
    </div>
  );
}