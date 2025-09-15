
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
      setLoading(true); // Set loading to true whenever auth state changes
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
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
          const userDocRef = doc(db, 'utilisateurs', user.uid);
          
          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  const profileData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
                  setUserProfile(profileData);
                  
                  // This is the right place to set the role based on fresh profile data
                  const storedRole = getRoleFromStorage();
                  const allowedRoles = profileData.rolesAutorises || ['client'];

                  if (storedRole && allowedRoles.includes(storedRole)) {
                    setActiveRoleState(storedRole);
                  } else {
                    const bestRole = profileData.role || allowedRoles[0] || 'client';
                    setActiveRole(bestRole); // This updates both state and localStorage
                  }

              } else {
                   console.warn("User profile document not found. This might be a new user.");
              }
              setLoading(false); // Profile loaded or not found, we are done loading
          }, (error) => {
              console.error("Error fetching user profile:", error);
              setUserProfile(null);
              setLoading(false);
          });
      } else {
        setLoading(false);
      }
      
      return () => {
          if (unsubscribeProfile) {
              unsubscribeProfile();
          }
      };
  }, [user]);

  const setActiveRole = (role: AppRole) => {
      if (userProfile?.rolesAutorises?.includes(role) || !userProfile) { // Allow setting for not-yet-loaded profiles
        localStorage.setItem('activeRole', role);
        setActiveRoleState(role);
      } else if (userProfile?.rolesAutorises && userProfile.rolesAutorises.length > 0) {
        const firstAllowedRole = userProfile.rolesAutorises[0];
        localStorage.setItem('activeRole', firstAllowedRole);
        setActiveRoleState(firstAllowedRole);
      } else {
        localStorage.setItem('activeRole', 'client');
        setActiveRoleState('client');
      }
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
