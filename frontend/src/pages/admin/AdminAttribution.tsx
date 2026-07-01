import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bot, MapPin, Package, Star, Search, Filter, ShieldCheck, 
  Activity, Zap, Target, Users, ArrowRight, RefreshCw, 
  ChevronRight, BrainCircuit, ShieldAlert, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';
import { formatTimestamp } from '@/lib/utils';

const AdminAttribution = () => {
  const queryClient = useQueryClient();
  const [autoAssign, setAutoAssign] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['admin', 'unassigned-orders'],
    queryFn: () => adminService.getOrders({ status: 'VALIDATED', page: 0, size: 50 }).then(res => res.content || []),
  });

  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ['admin', 'available-drivers'],
    queryFn: () => adminService.getAllUsers(0, 50, 'DRIVER', 'ONLINE').then(res => res.content || []),
  });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      adminService.assignOrder(orderId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Mission assigned successfully');
      setSelectedOrderId(null);
    },
    onError: () => toast.error('Assignment failed'),
  });

  return (
    <div className="space-y-12 font-sans selection:bg-primary/30 relative z-10">
      
      {/* Header HUD */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10 pt-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Logistics Intelligence Hub</p>
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
            Order <span className="text-blue-500">Attribution</span>
          </h1>
          <p className="text-foreground/40 mt-6 font-bold uppercase text-[11px] tracking-[0.2em] flex items-center gap-3 max-w-xl">
            <BrainCircuit className="w-4 h-4 text-blue-500/50" /> Neural assignment active. Optimizing {orders.length} pending missions.
          </p>
        </motion.div>

        {/* AI Control Terminal */}
        <div className="bg-accent/20 backdrop-blur-3xl border border-border/40 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl">
           <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-foreground/20 tracking-widest">Optimisation Mode</span>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
                 <Zap className="w-3 h-3" /> Distance + Load Balance
              </div>
           </div>
           <div className="h-10 w-[1px] bg-accent/40" />
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">AI Auto-pilot</span>
              <button 
                onClick={() => setAutoAssign(!autoAssign)}
                className={`w-14 h-8 rounded-full relative transition-all border border-white/10 ${autoAssign ? 'bg-blue-600' : 'bg-accent/30'}`}
              >
                 <motion.div 
                    animate={{ x: autoAssign ? 26 : 4 }}
                    className="absolute top-1 w-5 h-5 bg-foreground rounded-full shadow-lg" 
                 />
              </button>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 h-[calc(100vh-320px)] min-h-[600px]">
        
        {/* LEFT PANEL: PENDING MISSIONS */}
        <div className="flex flex-col space-y-6">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <Package className="w-5 h-5 text-blue-500" />
                 <h2 className="text-xl font-black tracking-tighter uppercase">Pending Queue ({orders.length})</h2>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl text-foreground/20 hover:text-foreground"><Filter className="w-4 h-4" /></Button>
           </div>

           <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                 {orders.map((order: unknown, idx: number) => (
                    <motion.div
                       key={order.id}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: idx * 0.03 }}
                       onClick={() => setSelectedOrderId(order.id)}
                       className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${
                          selectedOrderId === order.id 
                          ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                          : 'bg-accent/20 border-border/40 hover:bg-foreground/[0.05]'
                       }`}
                    >
                       <div className="flex justify-between items-start mb-4 relative z-10">
                          <div>
                             <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase mb-1 block">{order.trackingNumber}</span>
                             <h3 className="text-lg font-black tracking-tight uppercase leading-none">{order.receiverName || 'Anonymous Client'}</h3>
                          </div>
                          <Badge className="bg-accent/30 border-none text-[9px] font-black uppercase text-foreground/40">Priority High</Badge>
                       </div>

                       <div className="space-y-3 relative z-10">
                          <div className="flex items-center gap-3 text-xs font-bold text-foreground/40">
                             <MapPin className="w-3 h-3 text-blue-500" />
                             <span>{order.pickupAddress} &rarr; {order.deliveryAddress}</span>
                          </div>
                          <div className="flex items-center gap-6 pt-4 border-t border-border/40">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest mb-1">Created At</span>
                                <span className="text-[10px] font-bold">{formatTimestamp(order.createdAt)}</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest mb-1">COD Amount</span>
                                <span className="text-[10px] font-black text-emerald-400">{order.codAmount} MAD</span>
                             </div>
                          </div>
                       </div>
                       {selectedOrderId === order.id && (
                          <div className="absolute top-0 right-0 p-6">
                             <Target className="w-6 h-6 text-blue-500 animate-pulse" />
                          </div>
                       )}
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
        </div>

        {/* RIGHT PANEL: AVAILABLE NODES */}
        <div className="flex flex-col space-y-6">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <Users className="w-5 h-5 text-emerald-500" />
                 <h2 className="text-xl font-black tracking-tighter uppercase">Deployment Units ({drivers.length})</h2>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl text-foreground/20 hover:text-foreground"><RefreshCw className="w-4 h-4" /></Button>
           </div>

           <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                 {drivers.map((driver: unknown, idx: number) => {
                    const aiScore = driver.matchScore || 0;
                    return (
                       <motion.div
                          key={driver.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`p-6 rounded-[2rem] bg-accent/20 border border-border/40 hover:bg-foreground/[0.06] hover:border-emerald-500/30 transition-all group relative overflow-hidden`}
                       >
                          <div className="flex justify-between items-start mb-6">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/30 border border-white/10 flex items-center justify-center font-black text-lg text-emerald-400">
                                   {driver.firstName?.charAt(0)}
                                </div>
                                <div>
                                   <h3 className="font-black tracking-tight uppercase leading-none mb-1">{driver.firstName} {driver.lastName}</h3>
                                   <div className="flex items-center gap-2">
                                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                      <span className="text-[10px] font-bold text-foreground/40">4.9 Performance Index</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-2">
                                   Match {aiScore}%
                                </div>
                                <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Load: 2/5 Units</span>
                             </div>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-border/40 mt-4">
                             <div className="flex items-center gap-2 text-foreground/40 text-[10px] font-bold uppercase tracking-widest">
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Approx. 4.2 KM from pickup</span>
                             </div>
                             <Button 
                                onClick={() => selectedOrderId && assignMutation.mutate({ orderId: selectedOrderId, driverId: driver.id })}
                                disabled={!selectedOrderId || assignMutation.isPending}
                                className={`rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest transition-all ${
                                   selectedOrderId 
                                   ? 'bg-blue-600 hover:bg-blue-500 text-foreground shadow-lg shadow-blue-600/20' 
                                   : 'bg-accent/30 text-foreground/10'
                                }`}
                             >
                                {assignMutation.isPending ? 'Deploying...' : 'Assign Mission'}
                             </Button>
                          </div>
                          {/* AI Pulse */}
                          {aiScore > 90 && (
                             <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full animate-pulse" />
                          )}
                       </motion.div>
                    );
                 })}
              </AnimatePresence>
           </div>
        </div>

      </div>

      {/* Global Status HUD Footer */}
      <div className="fixed bottom-10 left-10 z-20 hidden xl:flex items-center gap-10 bg-[#020617]/80 backdrop-blur-3xl p-6 rounded-[2rem] border border-border/40 shadow-2xl">
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">AI Engine Online</span>
         </div>
         <div className="h-6 w-[1px] bg-accent/40" />
         <div className="flex items-center gap-4">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">{drivers.length} Units Ready</span>
         </div>
         <div className="h-6 w-[1px] bg-accent/40" />
         <div className="flex items-center gap-4">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">{orders.length} missions in backlog</span>
         </div>
      </div>
    </div>
  );
};

export default AdminAttribution;
