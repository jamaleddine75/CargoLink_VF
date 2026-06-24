import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, Users, AlertTriangle, Wallet } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { KPISkeleton } from '@/pages/agency/shared';
import AnimatedCounter from '@/components/common/AnimatedCounter';

interface KPIStatsProps {
  metrics: {
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    pendingPickups: number;
    ongoingDeliveries: number;
    activeDrivers: number;
    pendingCOD: number;
  } | null;
  loading: boolean;
}

export const KPIStats: React.FC<KPIStatsProps> = ({ metrics, loading }) => {
  const stats = [
    {
      title: "Total Orders",
      value: metrics?.totalOrders || 0,
      icon: Package,
      color: "blue",
      trend: "DB",
    },
    {
      title: "Delivered",
      value: metrics?.deliveredOrders || 0,
      icon: Truck,
      color: "emerald",
      trend: "Real",
    },
    {
      title: "Pending Pickups",
      value: metrics?.pendingPickups || 0,
      icon: AlertTriangle,
      color: "rose",
      trend: "Live",
    },
    {
      title: "Ongoing Deliveries",
      value: metrics?.ongoingDeliveries || 0,
      icon: Users,
      color: "indigo",
      trend: "Live",
    },
    {
      title: "Pending COD",
      value: metrics?.pendingCOD || 0,
      suffix: " MAD",
      icon: Wallet,
      color: "amber",
      trend: "Wallet",
    },
  ];

  if (loading) return <KPISkeleton />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-8 rounded-[40px] relative overflow-hidden group hover:bg-accent/20 transition-all duration-500 shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
        >
          <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-5 transition-opacity group-hover:opacity-15 ${
            stat.color === 'blue' ? 'bg-blue-500' : 
            stat.color === 'emerald' ? 'bg-emerald-500' : 
            stat.color === 'rose' ? 'bg-rose-500' : 
            stat.color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
          }`} />
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className={`p-4 rounded-2xl ${
              stat.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
              stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
              stat.color === 'rose' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
              stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <Badge className="bg-accent/30 text-muted-foreground/40 border border-border/40 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
              {stat.trend}
            </Badge>
          </div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">{stat.title}</p>
            <h3 className="text-3xl font-black tracking-tighter text-foreground">
              <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} />
            </h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
