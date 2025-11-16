
'use client';

import * as React from 'react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, Unsubscribe, getDocs, collection, query, where, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppRole, UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';


// --- MOCK DATA FOR DEVELOPMENT ---
const mockUser = {
  uid: 'mock-user-id',
  email: 'dev@yakrofe.com',
  displayName: 'Dev User',
  // Add other User properties if needed, but they are mostly nullable
} as User;

const mockUserProfile: UserProfile = {
  uid: 'mock-user-id',
  email: 'dev@yakrofe.com',
  nom: 'Utilisateur de Dév.',
  dateCreation: Timestamp.now(),
  role: 'client',
  rolesAutorises: ['client', 'restaurateur', 'livreur'],
  roleSysteme: 'SuperAdmin',
  adresseParDefaut: 'Yamoussoukro, Quartier des Développeurs'
};
// --- END MOCK DATA ---

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
  const [user, setUser] = React.useState<User | null>(mockUser);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(mockUserProfile);
  const [loading, setLoading] = React.useState(false); // Set to false to bypass loading screen
  const [activeRole, setActiveRoleState] = React.useState<AppRole>('client');
  const router = useRouter();
  const { toast } = useToast();

  // The original useEffect for Firebase Auth is commented out to enable mock mode.
  /*
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
  */
  
  React.useEffect(() => {
    // This part remains to handle role switching even in mock mode
    const savedRole = localStorage.getItem('activeRole') as AppRole;
    if (savedRole && mockUserProfile.rolesAutorises?.includes(savedRole)) {
      setActiveRoleState(savedRole);
    }
  }, []);

  const setActiveRole = (role: AppRole) => {
      localStorage.setItem('activeRole', role);
      setActiveRoleState(role);
  }
  
  const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'dateCreation'>>) => {
      console.log("Mock updateUserProfile:", uid, data);
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
      toast({ title: "Profil mis à jour (simulation)" });
      await Promise.resolve();
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    console.log("Mock updateOtherUserProfile:", uid, data);
    toast({ title: 'Profil mis à jour (simulation)' });
    await Promise.resolve();
  };

  const createNewUser = async (data: {email: string, password: string, nom: string, rolesAutorises: AppRole[], telephone?: string}): Promise<void> => {
    console.log("Mock createNewUser:", data);
    toast({ title: 'Utilisateur créé (simulation)' });
    await Promise.resolve();
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
