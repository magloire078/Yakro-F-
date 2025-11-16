
'use client';

import * as React from 'react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, Unsubscribe, getDocs, collection, query, where, writeBatch, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppRole, UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  updateUserProfile: (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'dateCreation'>>) => Promise<void>;
  updateOtherUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  createNewUser: (data: {email: string, password: string, nom: string, rolesAutorises: AppRole[], telephone?: string}) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<AppRole>('client');
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'utilisateurs', user.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile({ ...profile, uid: docSnap.id });

            const savedRole = localStorage.getItem('activeRole') as AppRole;
            const validRoles = profile.rolesAutorises?.filter(r => ['client', 'restaurateur', 'livreur'].includes(r)) || ['client'];

            if (savedRole && validRoles.includes(savedRole)) {
              setActiveRoleState(savedRole);
            } else if (profile.role && validRoles.includes(profile.role)) {
              setActiveRoleState(profile.role);
            } else if (validRoles.length > 0) {
              setActiveRoleState(validRoles[0]);
            } else {
              setActiveRoleState('client');
            }
          } else {
            // This case should ideally not happen if signup flow is robust.
            // But as a fallback, we can clear the state.
            setUserProfile(null);
            console.warn("User is authenticated but has no profile document.");
          }
          setLoading(false);
        }, (error) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
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
  }, []);
  
  const setActiveRole = (role: AppRole) => {
      localStorage.setItem('activeRole', role);
      setActiveRoleState(role);
  }
  
  const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'dateCreation'>>) => {
      const userDocRef = doc(db, 'utilisateurs', uid);
      try {
        await updateDoc(userDocRef, data);
      } catch(e) {
          const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'update',
              requestResourceData: data,
          });
          errorEmitter.emit('permission-error', permissionError);
          // Re-throw the error so the calling component knows the operation failed.
          throw permissionError;
      }
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'utilisateurs', uid);
    try {
        await updateDoc(userDocRef, data);
        toast({ title: 'Succès', description: 'Le profil a été mis à jour.' });
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        // Do not toast here, let the listener handle it.
        throw permissionError;
    }
  };

  const createNewUser = async (data: {email: string, password: string, nom: string, rolesAutorises: AppRole[], telephone?: string}): Promise<void> => {
    const roles = data.rolesAutorises.length > 0 ? data.rolesAutorises : ['client'];
    
    // This function is for admins to create users. Client-side SDKs cannot create Firebase Auth users 
    // on behalf of others. This is a prototype simulation. We'll create the Firestore document only.
    // In a real app, this would be a server-side Cloud Function.

    const userDocRef = doc(collection(db, 'utilisateurs')); // Create a new doc ref to get an ID
    const newUserProfile: UserProfile = {
        uid: userDocRef.id,
        email: data.email,
        nom: data.nom,
        dateCreation: serverTimestamp(),
        role: 'client', // Default active role is always 'client' for a good UX on first login
        rolesAutorises: roles,
        roleSysteme: 'User',
        ...(data.telephone && { telephone: data.telephone }),
    };

    try {
        await setDoc(userDocRef, newUserProfile);
        toast({ title: 'Utilisateur créé (Profil Firestore)', description: `Le profil pour ${data.email} a été créé. La création de l'authentification est simulée.`});
    } catch (error: any) {
       const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: newUserProfile,
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Erreur de permission', description: 'Impossible de créer le profil utilisateur dans la base de données.'});
      throw error; // Re-throw for the form to handle its loading state
    }
  }


  const value = { user, userProfile, loading, activeRole, setActiveRole, updateUserProfile, updateOtherUserProfile, createNewUser };

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
