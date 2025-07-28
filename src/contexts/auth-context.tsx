
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole | null) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<UserRole | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
          // Clear role on logout
          sessionStorage.removeItem('activeRole');
          setActiveRoleState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    // On initial load, try to get the role from session storage
    const storedRole = sessionStorage.getItem('activeRole') as UserRole | null;
    if (storedRole) {
      setActiveRoleState(storedRole);
    } else {
      setActiveRoleState('customer'); // Default to customer
    }
  }, []);
  
  const setActiveRole = (role: UserRole | null) => {
      if (role) {
        sessionStorage.setItem('activeRole', role);
      } else {
        sessionStorage.removeItem('activeRole');
      }
      setActiveRoleState(role);
  }


  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, activeRole, setActiveRole }}>
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
