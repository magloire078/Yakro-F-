
'use client';

import * as React from 'react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, Unsubscribe } from 'firebase/firestore';
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
  createNewUser: (data: {email: string, password: string, nom: string}) => Promise<User | null>;
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
            // Profile is created client-side in user-auth-form now
            // This listener will pick it up once created.
            // We can set a temporary profile state if needed, or just let it load.
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
      updateDoc(userDocRef, data).catch(async (serverError) => {
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
    return updateDoc(userDocRef, data)
      .then(() => {
        toast({ title: 'Succès', description: 'Le profil a été mis à jour.' });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Erreur de permission', description: "Vous n'avez pas les droits pour effectuer cette action." });
        throw permissionError;
    });
  };

  const createNewUser = async (data: {email: string, password: string, nom: string}): Promise<User | null> => {
    try {
      // Note: This creates a new user, but doesn't sign them in for the admin.
      // This is a simplified approach. A more robust solution might use Firebase Admin SDK on a backend.
      const tempAuth = auth; // This is a bit of a hack for isolation, ideally use a separate auth instance
      const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
      const newUser = userCredential.user;

      const userDocRef = doc(db, 'utilisateurs', newUser.uid);
      const newUserProfile: UserProfile = {
          uid: newUser.uid,
          email: data.email,
          nom: data.nom,
          dateCreation: serverTimestamp(),
          role: 'client',
          rolesAutorises: ['client'],
          roleSysteme: 'User',
      };
      
      await setDoc(userDocRef, newUserProfile);
      toast({ title: 'Utilisateur créé', description: `${data.email} a été ajouté.`});
      return newUser;

    } catch (error: any) {
        console.error("Error creating new user:", error);
        let description = "Une erreur est survenue.";
        if (error.code === 'auth/email-already-in-use') {
            description = 'Cette adresse e-mail est déjà utilisée.';
        } else if (error.code === 'auth/weak-password') {
            description = 'Le mot de passe est trop faible.';
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
