
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader } from 'lucide-react';
import type { UserRole, UserProfile } from '@/lib/types';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const getInitialRole = (): UserRole => {
    if (typeof window === 'undefined') {
        return 'client';
    }
    return (localStorage.getItem('activeRole') as UserRole) || 'client';
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<UserRole>('client');

  React.useEffect(() => {
    setActiveRoleState(getInitialRole());

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
          localStorage.removeItem('activeRole');
          setActiveRoleState('client');
          setUserProfile(null);
          setLoading(false);
      }
    });

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'activeRole') {
            setActiveRoleState((event.newValue as UserRole) || 'client');
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        unsubscribeAuth();
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  React.useEffect(() => {
      let unsubscribeProfile: (() => void) | undefined;
      if (user) {
          setLoading(true);
          const userDocRef = doc(db, 'users', user.uid);
          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  setUserProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
              } else {
                  // This case happens for new sign-ups. Create a default profile.
                   setDoc(userDocRef, {
                      email: user.email,
                      createdAt: serverTimestamp(),
                      name: user.email?.split('@')[0] || '', // Default name
                  });
              }
              setLoading(false);
          }, (error) => {
              console.error("Error fetching user profile:", error);
              setLoading(false);
          });
      }
      return () => {
          if (unsubscribeProfile) {
              unsubscribeProfile();
          }
      };
  }, [user]);

  const setActiveRole = (role: UserRole) => {
      localStorage.setItem('activeRole', role);
      setActiveRoleState(role);
  }
  
  const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, data);
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, activeRole, setActiveRole, updateUserProfile }}>
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
