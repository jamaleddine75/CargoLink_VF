import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface EarningsCardProps {
  amount: number;
  label: string;
  currency?: string;
  trend?: number;
  loading?: boolean;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({ 
  amount, 
  label, 
  currency = 'MAD', 
  trend,
  loading
}) => {
  if (loading) {
    return (
      <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] p-8 space-y-4">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-4 w-32 rounded-full" />
      </div>
    );
  }

  return (
    <div className="group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-white/40 dark:border-white/5 rounded-[32px] p-8 overflow-hidden shadow-2xl shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-500">
      {/* Dynamic Glow Effect */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          {trend !== undefined && (
            <div className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 backdrop-blur-md",
              trend >= 0 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
            )}>
              {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
        
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-lg font-bold text-primary/60">{currency}</span>
        </div>

        <p className="mt-4 text-xs font-medium text-slate-400 dark:text-slate-500">
          Total earnings for the current period
        </p>
      </div>
    </div>
  );
};

export default EarningsCard;

