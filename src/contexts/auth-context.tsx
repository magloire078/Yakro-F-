'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import type { AppRole, UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<{ success: boolean; error?: FirestorePermissionError | Error }>;
  updateOtherUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<{ success: boolean; error?: FirestorePermissionError | Error }>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const getInitialActiveRole = (): AppRole => {
  return 'client'; // Start safe for SSR
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth, db } = useFirebase();
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<AppRole>(getInitialActiveRole);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Load active role from localStorage on mount
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        const storedRole = window.localStorage.getItem('activeRole') as AppRole | null;
        if (storedRole) {
            setActiveRoleState(storedRole);
        }
    }

    return () => unsubscribeAuth();
  }, [auth]);

  React.useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'utilisateurs', user.uid);

      unsubscribeProfile = onSnapshot(userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const profile = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
            setUserProfile(profile);

            if (typeof window !== 'undefined' && window.localStorage) {
              const storedRole = window.localStorage.getItem('activeRole') as AppRole | null;
              
              // Validation logic: 
              // 1. If no stored role, use profile role
              // 2. If stored role exists, check if it's allowed for this user profile
              // For now, if the profile role is 'client', only 'client' is allowed.
              // If profile role is 'restaurateur', both 'client' and 'restaurateur' might be allowed (if we want role switching), 
              // but for safety during stabilization, we force match profile.role if mismatch is found.
              
              const isRoleValid = storedRole && (
                storedRole === profile.role || 
                (profile.role === 'restaurateur' && (storedRole === 'restaurateur' || storedRole === 'client')) ||
                (profile.role === 'livreur' && (storedRole === 'livreur' || storedRole === 'client'))
              );

              if (!isRoleValid) {
                setActiveRoleState(profile.role);
                window.localStorage.setItem('activeRole', profile.role);
              } else if (storedRole && storedRole !== activeRole) {
                setActiveRoleState(storedRole);
              }
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        () => {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
          setLoading(false);
        }
      );
    } else {
      setUserProfile(null);
      setLoading(false);
    }
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user, db, activeRole]);

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role);
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem('activeRole', role);
    }
  }

  const updateUserProfile = React.useCallback(async (uid: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'utilisateurs', uid);
    try {
      await updateDoc(userDocRef, data);
      return { success: true };
    } catch {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return { success: false, error: permissionError };
    }
  }, [db]);

  const updateOtherUserProfile = React.useCallback(async (uid: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'utilisateurs', uid);
    try {
      await updateDoc(userDocRef, data);
      return { success: true };
    } catch {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return { success: false, error: permissionError };
    }
  }, [db]);

  const value = React.useMemo(() => ({
    user,
    userProfile,
    loading,
    activeRole,
    setActiveRole,
    updateUserProfile,
    updateOtherUserProfile
  }), [user, userProfile, loading, activeRole, updateUserProfile, updateOtherUserProfile]);

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
