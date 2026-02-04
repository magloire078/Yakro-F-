'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import type { AppRole, UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

   React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
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
      
      unsubscribeProfile = onSnapshot(userDocRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            const profile = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
            setUserProfile(profile);
            
            const storedRole = localStorage.getItem('activeRole') as AppRole | null;
            if (!storedRole) {
               setActiveRoleState(profile.role);
               localStorage.setItem('activeRole', profile.role);
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          });
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
  }, [user, db]);

  const setActiveRole = (role: AppRole) => {
      setActiveRoleState(role);
      localStorage.setItem('activeRole', role);
  }
  
  const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
      const userDocRef = doc(db, 'utilisateurs', uid);
      updateDoc(userDocRef, data)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: data,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'utilisateurs', uid);
    updateDoc(userDocRef, data)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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