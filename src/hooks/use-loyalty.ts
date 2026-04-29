'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { computePointsFromOrders, getTierForPoints, TIERS } from '@/lib/loyalty';

export function useLoyalty() {
  const { user } = useAuth();
  const { orders } = useData();

  const points = React.useMemo(() => {
    if (!user) return 0;
    return computePointsFromOrders(orders, user.uid);
  }, [orders, user]);

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

  return { points, tier: tierInfo.tier, tierInfo, progress, pointsToNext, allTiers: TIERS };
}
