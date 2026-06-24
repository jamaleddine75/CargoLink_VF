import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DriverStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  loading?: boolean;
  description?: string;
}

const DriverStatsCard: React.FC<DriverStatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  colorClass, 
  loading,
  description 
}) => {
  return (
    <Card className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-[24px]">
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12",
        colorClass.replace('text-', 'bg-')
      )} />
      
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group-hover:scale-110",
          colorClass.replace('text-', 'bg-').replace('-600', '-500/10').replace('-500', '-500/10')
        )}>
          <Icon className={cn("w-6 h-6", colorClass)} />
        </div>

        <div className="flex-1 space-y-0.5">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <div className="flex items-baseline gap-1">
              <h3 className={cn("text-2xl font-black tracking-tight", colorClass)}>
                {value}
              </h3>
              {description && (
                <span className="text-[10px] font-medium text-slate-400">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverStatsCard;

