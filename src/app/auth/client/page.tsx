
'use client';

import CustomerHomePage from '@/components/role-specific/customer-home-page';

// Since the app now defaults to the client view, we redirect to the main page
// to avoid confusion with the /auth/client route. The content is still rendered
// via the CustomerHomePage component inside the main layout.
import { useRouter } from 'next/navigation';
import React from 'react';

export default function ClientAuthPage() {
    const router = useRouter();
    React.useEffect(() => {
        router.replace('/');
    }, [router]);

    // Render the home page content directly as a fallback
    return <CustomerHomePage />;
}
