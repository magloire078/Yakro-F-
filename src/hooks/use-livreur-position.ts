'use client';

import * as React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';

interface UseLivreurPositionOptions {
  enabled: boolean;
  uid: string | undefined;
  minIntervalMs?: number; // diminue le débit d'écriture
}

export function useLivreurPosition({ enabled, uid, minIntervalMs = 15000 }: UseLivreurPositionOptions) {
  const { db } = useFirebase();
  const lastWriteRef = React.useRef(0);
  const lastPosRef = React.useRef<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (!enabled || !uid) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();
        const last = lastPosRef.current;
        const movedEnough = !last || Math.hypot(last.lat - latitude, last.lng - longitude) > 0.0001; // ~10 m
        if (now - lastWriteRef.current < minIntervalMs && !movedEnough) return;

        lastWriteRef.current = now;
        lastPosRef.current = { lat: latitude, lng: longitude };
        const userRef = doc(db, 'utilisateurs', uid);
        updateDoc(userRef, { latitude, longitude }).catch(() => {
          // silencieux : permission ou réseau
        });
      },
      () => {
        // refus / erreur géoloc : on ignore, le client verra "en attente"
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, uid, db, minIntervalMs]);
}
