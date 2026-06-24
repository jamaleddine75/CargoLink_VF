import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedCounter from '@/components/common/AnimatedCounter';

interface StatHUDProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  color: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber';
  trend: string;
  loading: boolean;
  delay: number;
  className?: string;
}

export const StatHUD = ({ title, value, prefix = "", suffix = "", icon: Icon, color, trend, loading, delay, className }: StatHUDProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`bg-accent/10 backdrop-blur-3xl border border-border/40 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-accent/20 transition-all duration-500 shadow-xl hover:shadow-primary/10 hover:-translate-y-1 ${className || ''}`}
  >
    <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] opacity-5 transition-opacity group-hover:opacity-15 ${
      color === 'blue' ? 'bg-blue-500' : 
      color === 'indigo' ? 'bg-indigo-500' : 
      color === 'emerald' ? 'bg-emerald-500' : 
      color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
    }`} />
    
    <div className="flex justify-between items-center mb-6 relative z-10">
      <div className={`p-3 rounded-xl ${
        color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
        color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
        color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
        color === 'rose' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <Badge className="bg-accent/20 text-muted-foreground border border-border/40 font-black text-[7px] uppercase tracking-widest px-2 py-0.5 rounded-full">
        {trend}
      </Badge>
    </div>
    
    <div className="relative z-10">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">{title}</p>
      {loading ? (
        <Skeleton className="h-8 w-20 bg-accent/20 rounded-lg" />
      ) : (
        <h3 className="text-2xl font-black tracking-tighter text-foreground">
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        </h3>
      )}
    </div>
  </motion.div>
);
