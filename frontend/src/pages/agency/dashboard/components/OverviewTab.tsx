import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Activity, Wallet, Banknote, 
  CheckCircle2, ArrowRight, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChartSkeleton } from '@/pages/agency/shared';

interface OverviewTabProps {
  metrics: any;
  remittances: any[];
  onConfirmRemittance: (txId: string, amount: number) => void;
  loading: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  metrics, 
  remittances, 
  onConfirmRemittance,
  loading
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Activity Chart */}
      {loading ? (
        <div className="lg:col-span-8">
          <ChartSkeleton />
        </div>
      ) : (
        <Card className="lg:col-span-8 border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] p-8 md:p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Activity Flow</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                Weekly mission throughput matrix
              </p>
            </div>
            <div className="flex gap-3">
              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 font-black text-[9px] uppercase tracking-widest">Volume</Badge>
            </div>
          </div>

          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.weeklyOrders || []}>
                <defs>
                  <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.03} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#ffffff30', fontSize: 10, fontWeight: 900}}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#ffffff30', fontSize: 10, fontWeight: 900}}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(2, 6, 23, 0.8)',
                    borderRadius: '24px', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    padding: '20px',
                    backdropFilter: 'blur(20px)'
                  }}
                  itemStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#3b82f6' }}
                  labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', color: 'white', marginBottom: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorFlow)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-40 h-40 text-blue-500" />
          </div>
        </Card>
      )}

      {/* COD Remittances */}
      <Card className="lg:col-span-4 border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] p-8 md:p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">COD Queue</h3>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              Driver return validation
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {remittances.length > 0 ? (
              remittances.slice(0, 4).map((tx, idx) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-6 rounded-[2.5rem] bg-accent/10 border border-border/40 hover:bg-accent/20 transition-all group relative overflow-hidden shadow-sm"
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xl font-black tracking-tight">{tx.amount} <span className="text-[10px] text-muted-foreground/40">MAD</span></p>
                      <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Driver: {tx.driverId?.slice(0,8)}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onConfirmRemittance(tx.id, tx.amount)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-primary-foreground rounded-xl font-black text-[9px] uppercase tracking-widest h-11 px-8 shadow-xl shadow-emerald-600/20 relative z-10 border border-border/40 active:scale-95 transition-all"
                  >
                    Confirm
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center bg-accent/10 rounded-[2.5rem] border-2 border-dashed border-border/40">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No pending remittances</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};
