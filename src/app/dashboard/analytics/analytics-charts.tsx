'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const fallback = () => <Skeleton className="h-[300px] w-full" />;

export const RevenueByRestaurantChart = dynamic(
  () => import('./analytics-charts-inner').then(m => m.RevenueByRestaurantChart),
  { ssr: false, loading: fallback }
);

export const RevenueByPaymentChart = dynamic(
  () => import('./analytics-charts-inner').then(m => m.RevenueByPaymentChart),
  { ssr: false, loading: fallback }
);

export const OrdersByHourChart = dynamic(
  () => import('./analytics-charts-inner').then(m => m.OrdersByHourChart),
  { ssr: false, loading: fallback }
);

export const OrdersByWeekdayChart = dynamic(
  () => import('./analytics-charts-inner').then(m => m.OrdersByWeekdayChart),
  { ssr: false, loading: fallback }
);
