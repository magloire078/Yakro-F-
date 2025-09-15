
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();

    React.useEffect(() => {
        // Redirect to home page since login is disabled
        router.replace('/');
    }, [router]);
    
    // Show a loader while redirecting
    return (
        <div className="flex h-screen w-full items-center justify-center">
           <Loader className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
}
