import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedCounter from '@/components/common/AnimatedCounter';
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title?: string;
  label?: string; // Support both naming styles
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  trend?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  label,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend,
  loading = false,
  onClick,
  className,
  valueClassName,
}) => {
  const displayTitle = title || label || "";

  return (
    <Card
      onClick={onClick}
      className={`bg-card text-card-foreground border border-border p-6 rounded-lg transition-all duration-200 shadow-sm ${
        onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-md' : ''
      } ${className || ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-medium text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
            {trend}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{displayTitle}</p>
        {loading ? (
          <Skeleton className="h-8 w-20 bg-muted rounded-md" />
        ) : (
          <h3 className={`text-2xl font-semibold tracking-tight text-foreground ${valueClassName || ''}`}>
            {typeof value === 'number' ? (
              <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
            ) : (
              `${prefix}${value}${suffix}`
            )}
          </h3>
        )}
      </div>
    </Card>
  );
};
export default StatCard;
