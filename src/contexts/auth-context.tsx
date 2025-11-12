
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppRole, UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateUserProfileAction, setupInitialUserAction } from '@/app/actions/user-actions';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

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


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<AppRole>('client');
  const router = useRouter();

  React.useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'utilisateurs', user.uid);

        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);

            // Set active role from localStorage or profile
            const savedRole = localStorage.getItem('activeRole') as AppRole;
            if (savedRole && profile.rolesAutorises?.includes(savedRole)) {
              setActiveRoleState(savedRole);
            } else if (profile.role) {
              setActiveRoleState(profile.role);
            } else if (profile.rolesAutorises && profile.rolesAutorises.length > 0) {
              setActiveRoleState(profile.rolesAutorises[0]);
            } else {
              setActiveRoleState('client');
            }

          } else {
            // Create profile if it doesn't exist
            const newUserProfile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              nom: user.displayName || user.email?.split('@')[0],
              dateCreation: serverTimestamp(),
              role: 'client',
              rolesAutorises: ['client'],
              roleSysteme: 'User',
            };
            try {
                await setupInitialUserAction(user.uid, newUserProfile);
                setUserProfile(newUserProfile);
                setActiveRoleState('client');
            } catch (e) {
                console.error("Failed to create user profile", e);
            }
          }
          setLoading(false);
        }, (error) => {
            console.error("Error listening to user profile:", error);
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            router.push('/login');
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        if (unsubscribeProfile) unsubscribeProfile();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [router]);
  
  const setActiveRole = (role: AppRole) => {
      localStorage.setItem('activeRole', role);
      setActiveRoleState(role);
  }
  
  const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'dateCreation'>>) => {
      const userDocRef = doc(db, 'utilisateurs', uid);
      await updateDoc(userDocRef, data).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'update',
              requestResourceData: data,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
      });
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
      const userDocRef = doc(db, 'utilisateurs', uid);
      await updateDoc(userDocRef, data).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'update',
              requestResourceData: data,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
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
      <FirebaseErrorListener />
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
