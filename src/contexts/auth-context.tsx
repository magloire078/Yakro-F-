
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader } from 'lucide-react';
import type { AppRole, UserProfile } from '@/lib/types';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  updateUserProfile: (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt'>>) => Promise<void>;
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
    // Set initial role from localStorage for faster UI response
    const storedRole = getRoleFromStorage();
    if (storedRole) {
        setActiveRoleState(storedRole);
    }

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
            setActiveRoleState((event.newValue as AppRole) || 'client');
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
          const userDocRef = doc(db, 'utilisateurs', user.uid);

          const checkAndPromoteSuperAdmin = async () => {
             if (user.email === 'magloire078@gmail.com') {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().systemRole !== 'SuperAdmin') {
                    await updateDoc(userDocRef, {
                        systemRole: 'SuperAdmin',
                        allowedRoles: ['client', 'restaurateur', 'livreur']
                    });
                }
             }
          };

          checkAndPromoteSuperAdmin();

          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  const profileData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
                  setUserProfile(profileData);
                  
                  const storedRole = getRoleFromStorage();
                  const allowedRoles = profileData.allowedRoles || ['client'];

                  if (storedRole && allowedRoles.includes(storedRole)) {
                    setActiveRoleState(storedRole);
                  } else if (allowedRoles.length > 0) {
                    setActiveRole(allowedRoles[0]);
                  } else {
                    setActiveRole('client');
                  }
              } else {
                   const isSuperAdmin = user.email === 'magloire078@gmail.com';
                   const defaultProfile: Omit<UserProfile, 'uid'> = {
                      email: user.email!,
                      createdAt: serverTimestamp(),
                      name: user.email?.split('@')[0] || '',
                      role: 'client',
                      systemRole: isSuperAdmin ? 'SuperAdmin' : 'User',
                      allowedRoles: isSuperAdmin ? ['client', 'restaurateur', 'livreur'] : ['client'],
                  };
                   setDoc(userDocRef, defaultProfile);
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

  const setActiveRole = (role: AppRole) => {
      if (userProfile?.allowedRoles?.includes(role)) {
        localStorage.setItem('activeRole', role);
        setActiveRoleState(role);
      } else if (userProfile?.allowedRoles && userProfile.allowedRoles.length > 0) {
        const firstAllowedRole = userProfile.allowedRoles[0];
        localStorage.setItem('activeRole', firstAllowedRole);
        setActiveRoleState(firstAllowedRole);
      } else {
        localStorage.setItem('activeRole', 'client');
        setActiveRoleState('client');
      }
  }
  
  const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt'>>) => {
      const userDocRef = doc(db, 'utilisateurs', uid);
      await updateDoc(userDocRef, data);
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
      const userDocRef = doc(db, 'utilisateurs', uid);
      await updateDoc(userDocRef, data);
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, activeRole, setActiveRole, updateUserProfile, updateOtherUserProfile }}>
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
