'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ContributionChartProps {
  contributions: {
    priceFit?: number;
    fuel?: number;
    vehicleType?: number;
    safety?: number;
    technology?: number;
    space?: number;
    performance?: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ContributionChart({ contributions }: ContributionChartProps) {
  const data = [
    { name: 'Price Fit', value: (contributions.priceFit ?? 0) * 100 },
    { name: 'Fuel', value: (contributions.fuel ?? 0) * 100 },
    { name: 'Vehicle Type', value: (contributions.vehicleType ?? 0) * 100 },
    { name: 'Safety', value: (contributions.safety ?? 0) * 100 },
    { name: 'Technology', value: (contributions.technology ?? 0) * 100 },
    { name: 'Space', value: (contributions.space ?? 0) * 100 },
    { name: 'Performance', value: (contributions.performance ?? 0) * 100 },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
        <XAxis type="number" domain={[0, 100]} />
        <YAxis type="category" dataKey="name" />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

