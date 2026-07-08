import React from 'react';
import { Card } from '@/components/ui/card';

interface SecondaryStat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

interface BalanceHeroProps {
  title: string;
  balance: number;
  secondaryStats?: SecondaryStat[];
  microcopy?: string;
}

export const BalanceHero: React.FC<BalanceHeroProps> = ({
  title,
  balance,
  secondaryStats = [],
  microcopy,
}) => {
  return (
    <Card className="bg-card text-card-foreground border border-border p-6 md:p-8 rounded-lg shadow-sm overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
              {balance.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
            </h2>
            <span className="text-lg font-medium text-muted-foreground">MAD</span>
          </div>
          {microcopy && (
            <p className="text-xs text-muted-foreground max-w-md">{microcopy}</p>
          )}
        </div>

        {secondaryStats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
            {secondaryStats.map((stat, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-muted border border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className={`text-lg font-semibold text-foreground ${stat.className || ''}`}>
                  {stat.prefix || ''}
                  {stat.value.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                  {stat.suffix || ' MAD'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default BalanceHero;
