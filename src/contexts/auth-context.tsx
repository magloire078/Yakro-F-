
'use client';

import * as React from 'react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, Unsubscribe, getDocs, collection, query, where, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppRole, UserProfile, SystemRole } from '@/lib/types';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  createNewUser: (data: {email: string, password: string, nom: string, role: AppRole, telephone?: string}) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(mockUser);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(mockUserProfile);
  const [loading, setLoading] = React.useState(false); // Set to false to bypass loading screen
  const [activeRole, setActiveRoleState] = React.useState<AppRole>('client');
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    // This effect ensures the active role is set from the mock profile on initial load.
    if (userProfile) {
        setActiveRoleState(userProfile.role);
    }
  }, [userProfile]);


  const setActiveRole = (role: AppRole) => {
      // With a single role system, this just updates the state.
      setActiveRoleState(role);
      // We also update the mock profile for consistency during the session.
      if (userProfile) {
        setUserProfile({...userProfile, role: role });
      }
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

  const createNewUser = async (data: {email: string, password: string, nom: string, role: AppRole, telephone?: string}): Promise<void> => {
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
