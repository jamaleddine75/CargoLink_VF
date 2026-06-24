import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'amber';
}

export const StatCard = ({ label, value, icon: Icon, color }: StatCardProps) => (
  <Card className="bg-accent/10 border-border/40 rounded-[2.5rem] p-8 relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10", 
      color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600'
    )} />
    <div className="relative z-10">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">{label}</p>
      <h3 className="text-3xl font-black tracking-tighter text-foreground">
        {value.toLocaleString()} <span className="text-sm opacity-30 italic">MAD</span>
      </h3>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mt-6 border", 
        color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
        color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
        'bg-amber-500/10 text-amber-500 border-amber-500/20'
      )}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </Card>
);

export const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="py-20 text-center opacity-20">
    <Icon className="w-12 h-12 mx-auto mb-4" />
    <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
  </div>
);

export const LoaderPulse = () => (
  <div className="flex gap-1">
    {[1, 2, 3].map(i => <div key={i} className="w-2 h-8 bg-blue-500/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
  </div>
);
