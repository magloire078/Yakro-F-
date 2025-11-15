
'use client';
// This file is deprecated and its content has been merged into /dashboard/admin/page.tsx
// It will be removed in a future cleanup.
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {Loader} from 'lucide-react';

export default function DeprecatedAdminHomePage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/admin');
    }, [router]);
    
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
}
