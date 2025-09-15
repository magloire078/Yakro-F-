
'use client';

import * as React from 'react';
import { User } from 'firebase/auth';
import type { AppRole, UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

// --- MOCK USER DATA FOR DEVELOPMENT ---
const mockUser = {
  uid: 'mock-superadmin-user-uid',
  email: 'superadmin@example.com',
  // Add other properties if your components expect them
} as User;

const mockUserProfile: UserProfile = {
  uid: 'mock-superadmin-user-uid',
  email: 'superadmin@example.com',
  nom: 'Super Administrateur',
  role: undefined, // SuperAdmin may not have a functional role
  rolesAutorises: ['client', 'restaurateur', 'livreur'], // Can see everything
  roleSysteme: 'SuperAdmin',
  dateCreation: new Date().toISOString(),
};
// --- END MOCK USER DATA ---


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(mockUser);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(mockUserProfile);
  const [loading, setLoading] = React.useState(false); // Set loading to false
  const [activeRole, setActiveRoleState] = React.useState<AppRole>('client');

  const setActiveRole = (role: AppRole) => {
      // In this disabled state, we don't need to do anything
      setActiveRoleState(role);
  }
  
  const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'dateCreation'>>) => {
      console.log('updateUserProfile called (disabled):', uid, data);
      // Mock update
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
  };
  
  const updateOtherUserProfile = async (uid: string, data: Partial<UserProfile>) => {
      console.log('updateOtherUserProfile called (disabled):', uid, data);
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
