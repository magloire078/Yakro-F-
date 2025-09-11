
'use client';

import * as React from 'react';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { AppRole } from '@/lib/types';

export default function ProfileSelectionPage() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading, setActiveRole, updateUserProfile } = useAuth();
    const [isProcessing, setIsProcessing] = React.useState(true);

    React.useEffect(() => {
        if (authLoading) {
            return; // Wait for authentication to be resolved
        }

        if (!user) {
            router.push('/login');
            return;
        }

        const processUserRole = async () => {
            // If the user already has a role in their profile, use it.
            if (userProfile?.role) {
                setActiveRole(userProfile.role);
                router.push('/');
            } else {
                // If the user is new and has no role, assign 'client' by default.
                const defaultRole: AppRole = 'client';
                try {
                    // Set the role in state and local storage for immediate redirection
                    setActiveRole(defaultRole);
                    // Save the default role to their Firestore profile for persistence
                    if (user.uid) {
                       await updateUserProfile(user.uid, { role: defaultRole });
                    }
                    // Redirect to the homepage
                    router.push('/');
                } catch (error) {
                    console.error("Failed to set default user role:", error);
                    // Handle error, maybe show a message
                    setIsProcessing(false);
                }
            }
        };

        processUserRole();

    }, [user, userProfile, authLoading, router, setActiveRole, updateUserProfile]);
    
    // Show a loader while processing authentication and role assignment.
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <Loader className="h-16 w-16 animate-spin text-primary" />
            <p className="text-muted-foreground">Configuration de votre profil...</p>
        </div>
    )
}
