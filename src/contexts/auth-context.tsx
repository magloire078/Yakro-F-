
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const getInitialRole = (): UserRole => {
    if (typeof window === 'undefined') {
        return 'customer';
    }
    // Use localStorage for persistence across sessions
    return (localStorage.getItem('activeRole') as UserRole) || 'customer';
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<UserRole>('customer');

  React.useEffect(() => {
    // Set initial role from localStorage on the client side
    setActiveRoleState(getInitialRole());

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
          // Keep role on logout for better UX on re-login.
          // The login page will handle redirecting based on the stored role.
      }
      setLoading(false);
    });

    // Listen for changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'activeRole') {
            setActiveRoleState((event.newValue as UserRole) || 'customer');
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        unsubscribe();
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setActiveRole = (role: UserRole) => {
      localStorage.setItem('activeRole', role);
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
