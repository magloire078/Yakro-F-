
'use client';

import CustomerHomePage from '@/components/role-specific/customer-home-page';

// The /auth/client route is now deprecated as the client view is the default.
// We now render the CustomerHomePage directly to avoid redirection loops
// and race conditions that were causing permission errors.

export default function ClientAuthPage() {
    return <CustomerHomePage />;
}
