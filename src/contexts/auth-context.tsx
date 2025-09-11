

'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader } from 'lucide-react';
import type { AppRole, UserProfile } from '@/lib/types';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { updateUserAction } from '@/app/actions/update-user-action';

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
                   // This part handles auto-creation of a user profile document on first sign-in.
                   // The security rules must allow this specific `create` operation.
                   const isSuperAdmin = user.email === 'magloire078@gmail.com';
                   const defaultProfile: Omit<UserProfile, 'uid'> = {
                      email: user.email!,
                      createdAt: serverTimestamp(),
                      name: user.email?.split('@')[0] || '',
                      role: 'client',
                      systemRole: isSuperAdmin ? 'SuperAdmin' : 'User',
                      allowedRoles: isSuperAdmin ? ['client', 'restaurateur', 'livreur'] : ['client'],
                  };
                   setDoc(userDocRef, defaultProfile).catch(err => {
                       console.error("Error creating user profile, this may be a permissions issue:", err)
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
      // A user should only be able to update their own profile.
      // We could add a check here `if (user?.uid !== uid) return;` but for now we trust the client code.
      // We now use the server action for all updates.
      await updateUserAction(uid, data);
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
      // For security, only SuperAdmins can call this. 
      // The server action should also verify the caller's privileges.
      if (userProfile?.systemRole !== 'SuperAdmin') {
          throw new Error('You do not have permission to perform this action.');
      }
      await updateUserAction(uid, data);
  };


  const value = { user, userProfile, loading, activeRole, setActiveRole, updateUserProfile, updateOtherUserProfile };

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
