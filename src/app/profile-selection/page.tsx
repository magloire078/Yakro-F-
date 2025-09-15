
'use client';

import * as React from 'react';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { AppRole } from '@/lib/types';

export default function ProfileSelectionPage() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading, setActiveRole, updateUserProfile } = useAuth();
    
    React.useEffect(() => {
        if (authLoading) {
            return; // Wait until loading is finished
        }

        if (!user) {
            router.replace('/login');
            return;
        }

        if (userProfile) {
            // Special path for SuperAdmin
            if (userProfile.roleSysteme === 'SuperAdmin') {
                router.replace('/dashboard/admin');
                return;
            }

            const allowedRoles = userProfile.rolesAutorises || ['client'];
            const currentRole = userProfile.role;

            let roleToSet: AppRole = 'client'; // Default role

            if (currentRole && allowedRoles.includes(currentRole)) {
                roleToSet = currentRole;
            } else if (allowedRoles.length > 0) {
                roleToSet = allowedRoles[0];
            }
            
            setActiveRole(roleToSet);

            // If the profile doesn't have a main role set, update it.
            if (!currentRole) {
                updateUserProfile(user.uid, { role: roleToSet });
            }
            
            // Redirect to the role-specific auth page
            router.replace(`/auth/${roleToSet}`);
        } else {
            // If there's no profile yet (e.g., first login), just wait. 
            // The AuthProvider will create it, and this useEffect will re-run.
        }

    }, [user, userProfile, authLoading, router, setActiveRole, updateUserProfile]);
    
    // Display a loader while processing
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <Loader className="h-16 w-16 animate-spin text-primary" />
            <p className="text-muted-foreground">Configuration de votre session...</p>
        </div>
    )
}
