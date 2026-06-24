import React from 'react';
import { Card } from "@/components/ui/card";
import AnimatedCounter from '@/components/common/AnimatedCounter';

interface FleetStatTileProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'rose' | 'amber';
  onClick?: () => void;
}

const colorMap = {
  blue: {
    glow: 'bg-blue-600',
    icon: 'bg-blue-500/10 text-blue-400',
  },
  emerald: {
    glow: 'bg-emerald-600',
    icon: 'bg-emerald-500/10 text-emerald-400',
  },
  rose: {
    glow: 'bg-rose-600',
    icon: 'bg-rose-500/10 text-rose-400',
  },
  amber: {
    glow: 'bg-amber-600',
    icon: 'bg-amber-500/10 text-amber-400',
  },
};

export const FleetStatTile = ({ label, value, icon: Icon, color, onClick }: FleetStatTileProps) => {
  const c = colorMap[color];
  return (
    <Card
      onClick={onClick}
      className={`bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] p-8 relative overflow-hidden group hover:bg-accent/20 transition-all duration-500 shadow-xl hover:shadow-blue-500/10 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-colors ${c.glow}`} />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">{label}</p>
      <div className="flex items-end justify-between relative z-10">
        <h3 className="text-4xl font-black tracking-tighter">
          <AnimatedCounter value={value} />
        </h3>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-border/40 ${c.icon}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </Card>
  );
};
