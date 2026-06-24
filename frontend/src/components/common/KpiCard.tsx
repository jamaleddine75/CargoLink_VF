import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  description: string;
  loading?: boolean;
  colorClass?: string;
}

export const KpiCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  description, 
  loading, 
  colorClass 
}: KpiCardProps) => (
  <Card className="glass-card overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
    </div>
    <CardContent className="p-6 relative z-10">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{title}</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ) : (
              <h3 className="text-4xl font-black tracking-tighter dark:text-white">{value}</h3>
            )}
            {trend && !loading && (
              <Badge variant="outline" className={`ml-2 border-none font-black text-[10px] ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {trendValue}
              </Badge>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{description}</p>
        </div>
        <div className={cn("p-4 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform duration-500", colorClass || "bg-blue-600 shadow-blue-600/30")}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);
