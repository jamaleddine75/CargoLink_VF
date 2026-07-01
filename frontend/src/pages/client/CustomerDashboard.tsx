import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Activity, CheckCircle2, 
  PlusCircle, ArrowRight, Wallet, 
  ChevronRight, Zap, Box
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import customerService from '@/services/api/customerService';
import { cn } from '@/lib/utils';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<unknown>(null);
  const [recentOrders, setRecentOrders] = useState<unknown[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [kpiData, ordersData] = await Promise.all([
          customerService.getKPIs(user.id),
          customerService.getRecentOrders(0, 5)
        ]);
        setKpis(kpiData);
        setRecentOrders(ordersData.content || []);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  return (
    <div className="space-y-4 md:space-y-8 relative z-10 pb-10">
      
      {/* Top Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Status: Operational</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase leading-none font-display">
            Command <span className="text-primary">Center</span>
          </h1>
          <p className="text-muted-foreground/50 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1 md:mt-2">
            Bienvenue, {user?.firstName} • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
           <Button
              onClick={() => navigate('/client/create-order')}
              className="group relative px-4 md:px-8 h-10 md:h-12 bg-primary text-white rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-2xl shadow-primary/20 overflow-hidden transition-all active:scale-95 flex-1 md:flex-none"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-1.5 md:gap-3">
                <PlusCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Nouvelle Mission
              </span>
            </Button>
        </div>
      </div>

      <div className="space-y-6 lg:space-y-8">
        
        {/* KPI HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <StatCard title="Total Missions" value={kpis?.totalSent || 0} icon={Box} color="primary" />
          <StatCard title="Active Pulse" value={kpis?.inTransit || 0} icon={Activity} color="blue" />
          <StatCard title="Completions" value={kpis?.delivered || 0} icon={CheckCircle2} color="emerald" />
          <StatCard title="Net Equity" value={kpis?.pendingPayment || 0} icon={Wallet} suffix="MAD" color="amber" />
        </div>

        {/* Recent Missions Table */}
        <Card className="border-none bg-card/60 dark:bg-card/40 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] border border-border/50 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="p-4 md:p-8 border-b border-border/40 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-transparent to-primary/5">
               <div>
                 <h3 className="text-base md:text-xl font-black uppercase tracking-tighter italic">Flux d'activités</h3>
                 <p className="text-[7.5px] md:text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1 md:mt-2">Dernières missions</p>
               </div>
               <Button variant="ghost" onClick={() => navigate('/client/orders')} className="h-7 md:h-9 px-2.5 md:px-4 rounded-lg md:rounded-xl border border-border/40 text-[7px] md:text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                 Historique <ArrowRight className="ml-1 md:ml-2 w-3 h-3" />
               </Button>
            </div>
           
            <div className="p-3 md:p-8">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 md:h-20 rounded-2xl md:rounded-3xl bg-muted dark:bg-white/5" />)}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {recentOrders.map((order, idx) => (
                    <MissionRow key={order.id} order={order} idx={idx} navigate={navigate} />
                  ))}
                </div>
              ) : (
                <div className="py-16 md:py-20 text-center bg-accent/5 rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-border/40 dark:border-white/5">
                   <Zap className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/10 mx-auto mb-4" />
                   <p className="text-[9px] md:text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">En attente d'activités...</p>
                </div>
              )}
            </div>
        </Card>
      </div>
    </div>
  );
};

/* Mini Sub-components */

const StatCard = ({ title, value, icon: Icon, color, suffix }: unknown) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-card/60 dark:bg-card/40 backdrop-blur-3xl border border-border/50 dark:border-white/5 p-3 md:p-6 rounded-xl md:rounded-3xl relative overflow-hidden group shadow-xl"
  >
    <div className={cn(
      "absolute top-0 right-0 w-24 h-24 blur-3xl opacity-[0.03] group-hover:opacity-10 transition-opacity",
      color === 'primary' ? "bg-primary" : "bg-secondary"
    )} />
    <div className={cn(
      "w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl mb-2 md:mb-4 flex items-center justify-center relative z-10 border transition-transform group-hover:scale-110 shadow-lg",
      color === 'primary' ? "bg-primary/10 text-primary border-primary/20" :
      color === 'blue' ? "bg-primary/10 text-primary border-primary/20" :
      color === 'emerald' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
      "bg-amber-500/10 text-amber-500 border-amber-500/20"
    )}>
      <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{title}</p>
      </div>
      <h3 className="text-base md:text-2xl font-black tracking-tighter text-foreground mt-0.5 md:mt-1">
        {value}{suffix && <span className="text-[9px] md:text-xs opacity-30 ml-1 font-bold">{suffix}</span>}
      </h3>
    </div>
  </motion.div>
);

const MissionRow = ({ order, idx, navigate }: unknown) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.05 }}
    onClick={() => navigate(`/client/orders/${order.id}`)}
    className="flex items-center justify-between p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-accent/5 dark:bg-white/[0.02] border border-border/50 dark:border-white/5 hover:bg-primary/[0.04] hover:border-primary/20 transition-all group cursor-pointer"
  >
    <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-accent/20 flex items-center justify-center border border-border/40 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0">
        <Package className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground group-hover:text-primary" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[9px] md:text-[11px] font-black text-foreground truncate">{order.trackingNumber}</p>
        <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
          <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate max-w-[100px] md:max-w-[120px]">{order.receiverName}</p>
          <div className="w-0.5 h-0.5 rounded-full bg-border" />
          <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground/30 uppercase truncate">{order.receiverCity}</p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 md:gap-4 shrink-0">
      <div className="hidden sm:flex flex-col items-end mr-1 md:mr-2">
         <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">Statut Mission</p>
         <p className="text-[8px] md:text-[9px] font-black text-foreground/60 uppercase italic tracking-tighter mt-0.5">{order.status.replace(/_/g, ' ')}</p>
      </div>
      <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
        <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
      </div>
    </div>
  </motion.div>
);

export default CustomerDashboard;