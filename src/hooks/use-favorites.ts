'use client';

import * as React from 'react';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useFavorites() {
  const { user, userProfile } = useAuth();
  const { db } = useFirebase();

  const favorites = React.useMemo<string[]>(
    () => userProfile?.favorisRestaurants ?? [],
    [userProfile]
  );

  const isFavorite = React.useCallback(
    (restaurantId: string) => favorites.includes(restaurantId),
    [favorites]
  );

  const toggleFavorite = React.useCallback(
    async (restaurantId: string) => {
      if (!user) return;
      const userDocRef = doc(db, 'utilisateurs', user.uid);
      const isFav = favorites.includes(restaurantId);
      const data = {
        favorisRestaurants: isFav ? arrayRemove(restaurantId) : arrayUnion(restaurantId),
      };
      try {
        await updateDoc(userDocRef, data);
      } catch (serverError) {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    },
    [user, db, favorites]
  );

  return { favorites, isFavorite, toggleFavorite, isAuthenticated: !!user };
}
