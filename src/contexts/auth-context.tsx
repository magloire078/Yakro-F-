'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, type Unsubscribe, type DocumentSnapshot } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import type { AppRole, UserProfile } from '@/lib/types';
import { Loader } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  /**
   * true si la lecture du profil a échoué en PERMISSION_DENIED après
   * épuisement des tentatives (voir plus bas), plutôt que d'avoir confirmé
   * que le document n'existe pas. Sert à distinguer un « nouvel
   * utilisateur » (document absent, confirmé) d'un échec technique — les
   * deux se traduisent par `userProfile === null`, mais seul le premier cas
   * doit rediriger vers /complete-profile : sinon un compte existant (ex.
   * SuperAdmin) pourrait se voir proposer de « finaliser son inscription »
   * et écraser son propre profil.
   */
  profileError: boolean;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<{ success: boolean; error?: FirestorePermissionError | Error }>;
  updateOtherUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<{ success: boolean; error?: FirestorePermissionError | Error }>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const getInitialActiveRole = (): AppRole => {
  return 'client'; // Start safe for SSR
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth, db } = useFirebase();
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [profileError, setProfileError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [activeRole, setActiveRoleState] = React.useState<AppRole>(getInitialActiveRole);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Attend que le jeton d'ID soit réellement prêt avant de déclencher
        // la moindre lecture Firestore. `onAuthStateChanged` peut se
        // déclencher avant que le SDK Firestore n'ait fini de propager les
        // identifiants à ses requêtes internes — sans cette attente, le
        // premier `onSnapshot` sur `/utilisateurs/{uid}` (juste après
        // inscription ou connexion) peut essuyer un PERMISSION_DENIED
        // définitif, que Firestore ne retente jamais de lui-même.
        try {
          await firebaseUser.getIdToken();
        } catch (e) {
          console.error('Échec du rafraîchissement du jeton ID:', e);
        }
      }
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Load active role from localStorage on mount
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        const storedRole = window.localStorage.getItem('activeRole') as AppRole | null;
        if (storedRole) {
            setActiveRoleState(storedRole);
        }
    }

    return () => unsubscribeAuth();
  }, [auth]);

  React.useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribeProfile: Unsubscribe | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const currentUser = user;
    const userDocRef = doc(db, 'utilisateurs', currentUser.uid);

    const handleSnapshot = (docSnap: DocumentSnapshot) => {
      setProfileError(false);
      if (docSnap.exists()) {
        const profile = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        setUserProfile(profile);

        if (typeof window !== 'undefined' && window.localStorage) {
          const storedRole = window.localStorage.getItem('activeRole') as AppRole | null;

          // Validation logic:
          // 1. If no stored role, use profile role
          // 2. If stored role exists, check if it's allowed for this user profile
          // For now, if the profile role is 'client', only 'client' is allowed.
          // If profile role is 'restaurateur', both 'client' and 'restaurateur' might be allowed (if we want role switching),
          // but for safety during stabilization, we force match profile.role if mismatch is found.

          const isRoleValid = storedRole && (
            storedRole === profile.role ||
            (profile.role === 'restaurateur' && (storedRole === 'restaurateur' || storedRole === 'client')) ||
            (profile.role === 'livreur' && (storedRole === 'livreur' || storedRole === 'client'))
          );

          if (!isRoleValid) {
            setActiveRoleState(profile.role);
            window.localStorage.setItem('activeRole', profile.role);
          } else if (storedRole && storedRole !== activeRole) {
            setActiveRoleState(storedRole);
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    };

    // Filet de sécurité : si, malgré l'attente du jeton d'ID dans l'effet
    // ci-dessus, la toute première lecture essuie encore un PERMISSION_DENIED
    // (fenêtre de course connue entre `onAuthStateChanged` et la propagation
    // des identifiants côté SDK Firestore), on retente plusieurs fois avec
    // un délai croissant plutôt que d'abandonner définitivement — Firestore
    // ne retente jamais un refus de permission de lui-même. Sur le terrain à
    // Yamoussoukro, le réseau mobile est parfois assez lent/instable pour
    // que la propagation du jeton dépasse largement quelques centaines de
    // millisecondes (observé en conditions réelles avec 2 barres de
    // réseau) : le budget total va donc jusqu'à ~15s sur 5 tentatives
    // plutôt que ~4s sur 3, pour laisser le temps à une connexion lente de
    // rattraper son retard avant d'afficher un écran d'erreur.
    const RETRY_DELAYS_MS = [400, 1000, 2000, 4000, 8000];
    const attach = (attempt: number) => {
      unsubscribeProfile = onSnapshot(userDocRef, handleSnapshot, async () => {
        if (cancelled) return;
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay !== undefined) {
          try {
            await currentUser.getIdToken(true);
          } catch (e) {
            console.error('Échec du rafraîchissement forcé du jeton ID:', e);
          }
          retryTimer = setTimeout(() => {
            if (!cancelled) attach(attempt + 1);
          }, delay);
          return;
        }
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'get',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setUserProfile(null);
        setProfileError(true);
        setLoading(false);
      });
    };

    setLoading(true);
    setProfileError(false);
    attach(0);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user, db, activeRole]);

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role);
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem('activeRole', role);
    }
  }

  const updateUserProfile = React.useCallback(async (uid: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'utilisateurs', uid);
    try {
      await updateDoc(userDocRef, data);
      return { success: true };
    } catch {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return { success: false, error: permissionError };
    }
  }, [db]);

  const updateOtherUserProfile = React.useCallback(async (uid: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'utilisateurs', uid);
    try {
      await updateDoc(userDocRef, data);
      return { success: true };
    } catch {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return { success: false, error: permissionError };
    }
  }, [db]);

  const value = React.useMemo(() => ({
    user,
    userProfile,
    profileError,
    loading,
    activeRole,
    setActiveRole,
    updateUserProfile,
    updateOtherUserProfile
  }), [user, userProfile, profileError, loading, activeRole, updateUserProfile, updateOtherUserProfile]);

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
