
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { AppRole, UserProfile, SystemRole } from '@/lib/types';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { Loader } from 'lucide-react';

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

const getRoleFromStorage = (): AppRole | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return (localStorage.getItem('activeRole') as AppRole) || null;
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<AppRole>('client');

  React.useEffect(() => {
    const storedRole = getRoleFromStorage();
    if (storedRole) {
        setActiveRoleState(storedRole);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
          setUserProfile(null);
          localStorage.removeItem('activeRole');
          setActiveRoleState('client');
          setLoading(false);
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
      let unsubscribeProfile: (() => void) | undefined;
      
      if (user) {
          setLoading(true);
          const userDocRef = doc(db, 'utilisateurs', user.uid);
          
          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  const profileData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
                  setUserProfile(profileData);
                  
                  const storedRole = getRoleFromStorage();
                  const allowedRoles = profileData.rolesAutorises || ['client'];

                  if (storedRole && allowedRoles.includes(storedRole)) {
                    setActiveRoleState(storedRole);
                  } else {
                    const bestRole = profileData.role || allowedRoles[0] || 'client';
                    setActiveRole(bestRole);
                  }

              } else {
                   console.warn("User profile document not found. This might be a new user.");
                   setUserProfile(null); // Explicitly set to null if not found
              }
              setLoading(false);
          }, (error) => {
              console.error("Error fetching user profile:", error);
              setUserProfile(null);
              setLoading(false);
          });
      } else {
        // If no user, not loading
        setLoading(false);
      }
      
      return () => {
          if (unsubscribeProfile) {
              unsubscribeProfile();
          }
      };
  }, [user]);

  const setActiveRole = (role: AppRole) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeRole', role);
      }
      setActiveRoleState(role);
  }
  
  const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'dateCreation'>>) => {
      const userDocRef = doc(db, 'utilisateurs', uid);
      await updateDoc(userDocRef, data);
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
      const userDocRef = doc(db, 'utilisateurs', uid);
      await updateDoc(userDocRef, data);
  };


  const value = { user, userProfile, loading, activeRole, setActiveRole, updateUserProfile, updateOtherUserProfile };

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
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
