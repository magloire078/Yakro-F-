
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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
  updateUserProfile: (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'dateCreation'>>) => Promise<void>;
  updateOtherUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const getInitialActiveRole = (): AppRole => {
  if (typeof window === 'undefined') return 'client';
  return (localStorage.getItem('activeRole') as AppRole) || 'client';
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<AppRole>(getInitialActiveRole);
  const router = useRouter();
  const { toast } = useToast();

   React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'utilisateurs', user.uid);
      unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const profile = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          setUserProfile(profile);
          // Set the active role from the profile if it hasn't been set by the user yet
          if (localStorage.getItem('activeRole') !== profile.role) {
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
    }
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user]);

  const setActiveRole = (role: AppRole) => {
      setActiveRoleState(role);
      localStorage.setItem('activeRole', role);
      if (userProfile && userProfile.role !== role) {
        // Optimistically update UI, and persist change to DB
        setUserProfile({...userProfile, role});
        updateUserProfileAction(userProfile.uid, { role });
      }
  }
  
  const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'dateCreation'>>) => {
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
