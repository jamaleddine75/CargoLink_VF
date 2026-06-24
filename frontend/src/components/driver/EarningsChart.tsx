import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface EarningsChartProps {
  data: { date: string; amount: number }[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-2xl ring-1 ring-black/5">
        <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] mb-2">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-slate-900 dark:text-white">
            {payload[0].value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] font-bold text-primary">MAD</span>
        </div>
      </div>
    );
  }
  return null;
};

const EarningsChart: React.FC<EarningsChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="w-full h-[300px] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/5">
        <div className="flex justify-between items-end h-full gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="w-full rounded-t-xl" style={{ height: `${20 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-[32px] p-6 border border-white/40 dark:border-white/5 shadow-xl shadow-black/5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="8 8" 
            vertical={false} 
            stroke="currentColor" 
            className="text-slate-200 dark:text-white/5"
          />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
            className="text-slate-400 dark:text-white/30"
            dy={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
            className="text-slate-400 dark:text-white/30"
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '6 6' }} 
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorAmount)"
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EarningsChart;

