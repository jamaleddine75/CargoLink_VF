import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { Award, TrendingUp, AlertCircle, ShieldCheck, Star } from 'lucide-react';
import apiClient from '../../api/client';
import { Skeleton } from '../ui/skeleton';

interface StatsResponse {
  acceptanceRate: number;
  onTimeRate: number;
  avgRating: number;
  codCompliance: number;
  todayEarnings: number;
  weekEarnings: number;
}

const fetchWeeklyStats = async (): Promise<StatsResponse> => {
  const { data } = await apiClient.get('/drivers/stats?period=week');
  return data;
};

// Custom Ring component using CSS conic-gradient and animated via state
const ConicRing = ({ value, label, icon: Icon }: { value: number; label: string; icon: any }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timeout);
  }, [value]);

  const getColor = (v: number) => {
    if (v >= 80) return '#10b981'; // emerald-500
    if (v >= 50) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  const color = getColor(value);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-slate-800/50 shadow-inner">
        {/* The conic gradient ring */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-1000 ease-out"
          style={{ 
            background: `conic-gradient(${color} ${animatedValue}%, transparent ${animatedValue}%)` 
          }}
        />
        {/* Inner circle mask to create the ring effect */}
        <div className="absolute inset-[4px] rounded-full bg-slate-900 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
          <span className="text-[11px] font-black tracking-tight text-white">{Math.round(animatedValue)}%</span>
        </div>
      </div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-tight">
        {label}
      </span>
    </div>
  );
};

export const DriverPerformanceWidget = () => {
  const { data: stats, isLoading, isError } = useQuery<StatsResponse>({
    queryKey: ['driver-weekly-stats'],
    queryFn: fetchWeeklyStats,
    retry: 1,
  });

  // Safe fallback values if stats is undefined
  const statsData = stats || {
    acceptanceRate: 0,
    onTimeRate: 0,
    avgRating: 0,
    codCompliance: 0,
    todayEarnings: 0,
    weekEarnings: 0,
  };

  const overallScore = Math.round(
    (statsData.acceptanceRate + statsData.onTimeRate + (statsData.avgRating * 20) + statsData.codCompliance) / 4
  );

  const getLevel = (score: number) => {
    if (score >= 85) return { label: 'Elite', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' };
    if (score >= 60) return { label: 'Pro', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    return { label: 'Rookie', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  };

  const level = getLevel(overallScore);

  // Generate a mock sparkline based on week earnings
  const avgDaily = statsData.weekEarnings / 7;
  const sparklineData = Array.from({ length: 7 }).map((_, i) => {
    const variance = (Math.random() - 0.5) * 0.4; // +/- 20%
    return { day: i, value: avgDaily > 0 ? avgDaily * (1 + variance) : Math.random() * 100 };
  });

  // Base background gradient depending on score
  const getBackgroundGradient = (score: number) => {
    if (score >= 85) return 'from-violet-900/40 via-slate-900 to-slate-900';
    if (score >= 60) return 'from-emerald-900/20 via-slate-900 to-slate-900';
    return 'from-amber-900/20 via-slate-900 to-slate-900';
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-[2rem] p-6 border border-white/5 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="w-32 h-6 bg-white/5 rounded-full" />
          <Skeleton className="w-20 h-8 bg-white/5 rounded-xl" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className="w-20 h-20 bg-white/5 rounded-full" />
              <Skeleton className="w-16 h-3 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="w-full h-16 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-slate-900 rounded-[2rem] p-6 border border-rose-500/20 flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-bold text-rose-400">Failed to load performance stats</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[2rem] p-8 border border-white/5 bg-gradient-to-br ${getBackgroundGradient(overallScore)} shadow-2xl`}
    >
      {/* Animated subtle background blob */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Performance Hebdomadaire</h2>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{overallScore}</span>
              <span className="text-sm font-bold text-slate-500">Score Global</span>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-xl border ${level.border} ${level.bg} flex items-center gap-2 shadow-lg`}>
            <Award className={`w-4 h-4 ${level.color}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${level.color}`}>
              {level.label}
            </span>
          </div>
        </div>

        {/* Rings Grid */}
        <div className="grid grid-cols-4 gap-2 py-2">
          <ConicRing value={statsData.acceptanceRate} label="Acceptation" icon={ShieldCheck} />
          <ConicRing value={statsData.onTimeRate} label="Ponctualité" icon={TrendingUp} />
          <ConicRing value={statsData.avgRating * 20} label="Évaluation" icon={Star} />
          <ConicRing value={statsData.codCompliance} label="Conformité COD" icon={Award} />
        </div>

        {/* Sparkline & Earnings Summary */}
        <div className="bg-black/40 rounded-2xl p-5 border border-white/5 flex items-center gap-6">
          <div className="flex-1 space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gains de la semaine</p>
            <p className="text-xl font-black text-white tabular-nums">{statsData.weekEarnings.toFixed(2)} MAD</p>
          </div>
          <div className="w-32 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparklineData}>
                <Bar dataKey="value" radius={[2, 2, 2, 2]}>
                  {sparklineData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#10b981' : '#334155'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
