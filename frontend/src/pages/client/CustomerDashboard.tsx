import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, TrendingUp, Clock, CheckCircle2, 
  PlusCircle, ArrowRight, Wallet, MapPin, 
  ChevronRight, AlertCircle, Loader2, Search,
  Box, Sparkles, Navigation, Bell, Activity,
  ArrowUpRight, ShieldCheck, Zap, MessageSquare
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import customerService from '@/services/api/customerService';
import { cn } from '@/lib/utils';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

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
             <div className="hidden lg:flex flex-col items-end mr-4">
                <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Performance Global</p>
                <div className="flex items-center gap-2 mt-1">
                   <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <div key={i} className={cn("w-1 h-3 rounded-full", i < 5 ? "bg-primary" : "bg-muted")} />)}
                   </div>
                   <span className="text-xs font-black italic">94.2%</span>
                </div>
             </div>
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

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* LEFT COLUMN: STATS & ACTIVITY (8 COLS) */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* KPI HUD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <StatCard title="Total Missions" value={kpis?.totalSent || 0} icon={Box} trend="+12%" color="primary" />
              <StatCard title="Active Pulse" value={kpis?.inTransit || 0} icon={Activity} trend="Live" color="blue" />
              <StatCard title="Completions" value={kpis?.delivered || 0} icon={CheckCircle2} trend="98%" color="emerald" />
              <StatCard title="Net Equity" value={kpis?.pendingPayment || 0} icon={Wallet} suffix="MAD" color="amber" />
            </div>

            {/* Main Content Area: Recent Missions */}
            <Card className="border-none bg-card/60 dark:bg-card/40 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] border border-border/50 dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="p-4 md:p-8 border-b border-border/40 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-transparent to-primary/5">
                   <div>
                     <h3 className="text-base md:text-xl font-black uppercase tracking-tighter italic">Flux d'activités</h3>
                     <p className="text-[7.5px] md:text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1 md:mt-2">Dernières synchronisations système</p>
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
                       <p className="text-[9px] md:text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">En attente de données...</p>
                    </div>
                  )}
                </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: UTILITIES (4 COLS) */}
          <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            
            {/* Wallet Widget */}
            <Card className="border-none bg-gradient-to-br from-indigo-600 to-primary rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-110 transition-transform" />
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                       <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-none px-3 py-1 font-black text-[7px] md:text-[8px] uppercase tracking-widest">Compte Vérifié</Badge>
                  </div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1.5 md:mb-2">Solde Retirable</p>
                  <div className="flex items-baseline gap-1.5 md:gap-2 mb-6 md:mb-8">
                     <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic">{(kpis?.pendingPayment || 0).toLocaleString()}</h2>
                     <span className="text-base md:text-lg font-black opacity-40">MAD</span>
                  </div>
                  <Button 
                    onClick={() => navigate('/client/wallet')}
                    className="w-full h-11 md:h-14 bg-white/10 hover:bg-white/20 text-white rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] backdrop-blur-md border border-white/10 transition-all active:scale-95"
                  >
                    Gérer mes fonds <ArrowUpRight className="ml-2 w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
               </div>
            </Card>

            {/* Quick Actions Hub */}
            <Card className="border-none bg-card/60 dark:bg-card/40 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-border/50 dark:border-white/5 shadow-xl">
               <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
                 <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" /> Actions Rapides
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <ActionButton icon={MapPin} label="Adresses" onClick={() => navigate('/client/address-book')} color="blue" />
                  <ActionButton icon={MessageSquare} label="Support" onClick={() => navigate('/client/support')} color="emerald" />
                  <ActionButton icon={ShieldCheck} label="Sécurité" onClick={() => {}} color="indigo" />
                  <ActionButton icon={Bell} label="Alertes" onClick={() => {}} color="rose" />
               </div>
            </Card>

            {/* Performance Tip */}
            <div className="bg-accent/10 dark:bg-accent/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-border/50 dark:border-white/5 relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[8px] md:text-[9px] font-black uppercase text-primary tracking-widest mb-3 md:mb-4">Intelligence Logistique</p>
                  <p className="text-[11px] md:text-xs font-bold text-foreground/70 leading-relaxed italic">
                    "Saviez-vous ? Les envois effectués avant 10h00 ont un taux de réussite de livraison 15% supérieur."
                  </p>
               </div>
               <Sparkles className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-10 h-10 md:w-12 md:h-12 text-primary/5 group-hover:scale-125 transition-transform" />
            </div>

        </div>
      </div>
    </div>
  );
};

/* Mini Sub-components */

const StatCard = ({ title, value, icon: Icon, trend, color, suffix }: any) => (
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
        {trend && <span className="text-[7px] md:text-[8px] font-black text-emerald-500">{trend}</span>}
      </div>
      <h3 className="text-base md:text-2xl font-black tracking-tighter text-foreground mt-0.5 md:mt-1">
        {value}{suffix && <span className="text-[9px] md:text-xs opacity-30 ml-1 font-bold">{suffix}</span>}
      </h3>
    </div>
  </motion.div>
);

const MissionRow = ({ order, idx, navigate }: any) => (
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

const ActionButton = ({ icon: Icon, label, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-3 md:p-4 rounded-xl md:rounded-2xl bg-accent/5 dark:bg-white/[0.02] border border-border/50 dark:border-white/5 hover:bg-accent/10 dark:hover:bg-white/5 hover:border-primary/30 dark:hover:border-white/10 transition-all group"
  >
    <div className={cn(
      "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl mb-2.5 md:mb-3 flex items-center justify-center border transition-all group-hover:scale-110",
      color === 'blue' ? "bg-primary/10 text-primary border-primary/20" :
      color === 'emerald' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
      color === 'indigo' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
      "bg-rose-500/10 text-rose-500 border-rose-500/20"
    )}>
      <Icon className="w-4 h-4 md:w-5 md:h-5" />
    </div>
    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground">{label}</span>
  </button>
);

export default CustomerDashboard;