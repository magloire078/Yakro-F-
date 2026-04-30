'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

const RatingsChartInner = dynamic(
  () => import('./ratings-chart-inner').then(m => m.RatingsChartInner),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> }
);

interface RatingsChartProps {
  data: { rating: number; count: number }[];
}

export function RatingsChart({ data }: RatingsChartProps) {
  return (
    <Card>
      <CardContent className="p-2 pt-4">
        <RatingsChartInner data={data} />
      </CardContent>
    </Card>
  );
}
