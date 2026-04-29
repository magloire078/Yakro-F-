'use client';

import * as React from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { computePointsFromOrders, getTierForPoints, TIERS } from '@/lib/loyalty';
import type { Parrainage } from '@/lib/types';

export function useLoyalty() {
  const { user, userProfile } = useAuth();
  const { orders } = useData();
  const { db } = useFirebase();
  const [parrainBonusPoints, setParrainBonusPoints] = React.useState(0);
  const [filleulCount, setFilleulCount] = React.useState(0);

  // Souscrit aux parrainages où le code du parrain est le mien.
  React.useEffect(() => {
    const code = userProfile?.codeParrainage;
    if (!code) {
      setParrainBonusPoints(0);
      setFilleulCount(0);
      return;
    }
    const q = query(collection(db, 'parrainages'), where('parrainCode', '==', code));
    const unsub = onSnapshot(
      q,
      snap => {
        const docs = snap.docs.map(d => d.data() as Parrainage);
        setParrainBonusPoints(docs.reduce((s, p) => s + (p.pointsBonus || 0), 0));
        setFilleulCount(docs.length);
      },
      () => {
        // silencieux : permission, réseau, etc.
      }
    );
    return () => unsub();
  }, [db, userProfile?.codeParrainage]);

  const points = React.useMemo(() => {
    if (!user) return 0;
    return computePointsFromOrders(orders, user.uid) + parrainBonusPoints;
  }, [orders, user, parrainBonusPoints]);

  const tierInfo = React.useMemo(() => getTierForPoints(points), [points]);

  const progress = React.useMemo(() => {
    const next = tierInfo.nextThreshold;
    if (!next) return 1;
    const start = tierInfo.minPoints;
    return Math.max(0, Math.min(1, (points - start) / (next - start)));
  }, [tierInfo, points]);

  const pointsToNext = React.useMemo(() => {
    if (!tierInfo.nextThreshold) return 0;
    return Math.max(0, tierInfo.nextThreshold - points);
  }, [tierInfo, points]);

  return {
    points,
    tier: tierInfo.tier,
    tierInfo,
    progress,
    pointsToNext,
    allTiers: TIERS,
    parrainBonusPoints,
    filleulCount,
  };
}
