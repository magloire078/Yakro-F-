
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent } from './ui/card';

interface RatingsChartProps {
  data: { rating: number; count: number }[];
}

export function RatingsChart({ data }: RatingsChartProps) {
  return (
     <Card>
        <CardContent className="p-2 pt-4">
             <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="rating" 
                    type="category" 
                    tickLine={false} 
                    axisLine={false}
                    tick={({ x, y, payload }) => (
                       <g transform={`translate(${x},${y})`}>
                         <text x={0} y={0} dy={4} textAnchor="start" fill="#666" fontSize={14}>
                           {payload.value} étoile{payload.value > 1 ? 's' : ''}
                         </text>
                       </g>
                    )}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16}/>
              </BarChart>
            </ResponsiveContainer>
        </CardContent>
     </Card>
  );
}
    
