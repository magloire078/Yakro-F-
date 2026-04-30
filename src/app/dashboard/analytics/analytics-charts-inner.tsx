'use client';

import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PaymentMethod } from '@/lib/types';

export function RevenueByRestaurantChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v as number) / 1000}k`} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Restaurant</span>
                      <span className="font-bold text-muted-foreground">{payload[0].payload.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Revenu Net</span>
                      <span className="font-bold">{(payload[0].value as number).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueByPaymentChart({
  data,
  colors,
}: {
  data: { name: string; revenue: number; method: PaymentMethod }[];
  colors: Record<PaymentMethod, string>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="revenue"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, value }) => `${name} ${(value as number).toLocaleString('fr-FR')}`}
        >
          {data.map(entry => (
            <Cell key={entry.method} fill={colors[entry.method]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function OrdersByHourChart({ data }: { data: { hour: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <XAxis dataKey="hour" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} interval={1} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OrdersByWeekdayChart({ data }: { data: { label: string; count: number; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v as number) / 1000}k`} />
        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`} />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
