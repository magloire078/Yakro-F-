
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
  createNewUser: (data: {email: string, password: string, nom: string, rolesAutorises: AppRole[]}) => Promise<User | null>;
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
        toast({ variant: 'destructive', title: 'Erreur de permission', description: "Vous n'avez pas les droits pour effectuer cette action." });
        throw permissionError;
    }
  };

  const createNewUser = async (data: {email: string, password: string, nom: string, rolesAutorises: AppRole[]}): Promise<User | null> => {
    let newUser: User | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      newUser = userCredential.user;

      const userDocRef = doc(db, 'utilisateurs', newUser.uid);
      const roles = data.rolesAutorises.length > 0 ? data.rolesAutorises : ['client'];
      const newUserProfile: UserProfile = {
          uid: newUser.uid,
          email: data.email,
          nom: data.nom,
          dateCreation: serverTimestamp(),
          role: roles[0],
          rolesAutorises: roles,
          roleSysteme: 'User',
      };
      
      await setDoc(userDocRef, newUserProfile);
      toast({ title: 'Utilisateur créé', description: `${data.email} a été ajouté.`});

      return newUser;
    } catch (error: any) {
        let description = "Une erreur est survenue.";
        if (error.code === 'auth/email-already-in-use') {
            description = 'Cette adresse e-mail est déjà utilisée.';
        } else if (error.code === 'auth/weak-password') {
            description = 'Le mot de passe est trop faible.';
        } else {
             const permissionError = new FirestorePermissionError({
                path: `utilisateurs/${(newUser?.uid || 'nouvel-utilisateur')}`,
                operation: 'create',
                requestResourceData: { email: data.email, nom: data.nom, roles: data.rolesAutorises },
            });
            errorEmitter.emit('permission-error', permissionError);
            description = "Erreur de permissions lors de la création du profil.";
        }
        toast({
            variant: 'destructive',
            title: "Erreur de création",
            description,
        });
        return null;
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
