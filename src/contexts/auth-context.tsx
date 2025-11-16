
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import type { AppRole, UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/app/actions/user-actions';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  updateOtherUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const getInitialActiveRole = (): AppRole => {
  if (typeof window === 'undefined') return 'client';
  return (localStorage.getItem('activeRole') as AppRole) || 'client';
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth, db } = useFirebase();
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<AppRole>(getInitialActiveRole);
  const router = useRouter();
  const { toast } = useToast();

   React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
          // If user logs out, we can clear the profile and set loading to false.
          setUserProfile(null);
          setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  React.useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'utilisateurs', user.uid);
      unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const profile = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          setUserProfile(profile);
          
          const storedRole = localStorage.getItem('activeRole') as AppRole | null;
          // Always sync active role with the profile's role, as it's the source of truth.
          if (storedRole !== profile.role) {
             setActiveRoleState(profile.role);
             localStorage.setItem('activeRole', profile.role);
          }
        } else {
          // This can happen briefly during signup before the profile is created.
          setUserProfile(null);
        }
        setLoading(false);
      });
    } else {
      setUserProfile(null);
      setLoading(false); // No user, so not loading.
    }
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user, db]);

  const setActiveRole = (role: AppRole) => {
      setActiveRoleState(role);
      localStorage.setItem('activeRole', role);
  }
  
  const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
      await updateUserProfileAction(uid, data);
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    await updateUserProfileAction(uid, data);
  };

  const value = { user, userProfile, loading, activeRole, setActiveRole, updateUserProfile, updateOtherUserProfile };

  if (loading) { 
    return (
        <div className="flex h-screen w-full items-center justify-center">
           <Loader className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
