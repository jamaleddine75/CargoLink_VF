import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'indigo' | 'violet' | 'emerald' | 'sky' | 'rose';
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

const colorMap = {
  indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-100 dark:border-indigo-900/30",
  violet: "bg-violet-500/10 text-violet-600 border-violet-100 dark:border-violet-900/30",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-900/30",
  sky: "bg-sky-500/10 text-sky-600 border-sky-100 dark:border-sky-900/30",
  rose: "bg-rose-500/10 text-rose-600 border-rose-100 dark:border-rose-900/30",
};

const iconColorMap = {
  indigo: "bg-indigo-600 shadow-indigo-600/20",
  violet: "bg-violet-600 shadow-violet-600/20",
  emerald: "bg-emerald-600 shadow-emerald-600/20",
  sky: "bg-sky-600 shadow-sky-600/20",
  rose: "bg-rose-600 shadow-rose-600/20",
};

const decorativeMap = {
  indigo: "bg-indigo-600",
  violet: "bg-violet-600",
  emerald: "bg-emerald-600",
  sky: "bg-sky-600",
  rose: "bg-rose-600",
};

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
  loading
}) => {
  if (loading) {
    return (
      <Card className="border-none bg-accent/5 dark:bg-white/[0.03] border border-border/50 dark:border-white/5 shadow-2xl p-4 md:p-5 rounded-3xl relative overflow-hidden group min-h-[120px] md:min-h-[156px] backdrop-blur-3xl">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <Skeleton className="h-9 w-9 md:h-11 md:w-11 rounded-xl md:rounded-2xl bg-muted dark:bg-white/5" />
          <Skeleton className="h-4 w-12 md:h-5 md:w-16 rounded-full bg-muted dark:bg-white/5" />
        </div>
        <Skeleton className="h-3 w-20 md:w-28 mb-1.5 md:mb-2 bg-muted dark:bg-white/5" />
        <Skeleton className="h-5 w-16 md:w-24 bg-muted dark:bg-white/5" />
      </Card>
    );
  }

  return (
    <Card className="border-none bg-accent/5 dark:bg-white/[0.03] border border-border/50 dark:border-white/5 shadow-2xl p-4 md:p-5 rounded-[1.5rem] md:rounded-3xl relative overflow-hidden group hover:bg-accent/10 dark:hover:bg-white/[0.05] transition-all duration-300 backdrop-blur-3xl min-h-[120px] md:min-h-[156px]">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className={cn(
          "w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 duration-500",
          iconColorMap[color]
        )}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm whitespace-nowrap",
            trendUp 
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-900/30"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100 dark:border-rose-900/30"
          )}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>

      <p className="text-[9px] md:text-[10px] font-black text-foreground/40 dark:text-white/40 uppercase tracking-[0.2em] mb-0.5 md:mb-1 truncate">{title}</p>
      <h3 className="text-base md:text-xl font-black text-foreground dark:text-white tracking-tight leading-tight">
        {value}
      </h3>
      
      {/* Decorative element */}
      <div className={cn(
        "absolute -right-3 -bottom-3 w-20 h-20 rounded-full opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500",
        decorativeMap[color]
      )} />
    </Card>
  );
};
