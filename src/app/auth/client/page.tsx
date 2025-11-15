
'use client';
// This file is deprecated. The client view is now the default view at the root /.
// This component now redirects to maintain compatibility.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function ClientAuthPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader className="h-16 w-16 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Redirection en cours...</p>
        </div>
    );
}
