import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Search, CheckCircle2, AlertCircle,
  ArrowRight, Package, Activity, RefreshCcw,
  History, Wallet, Clock, SearchX, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import orderService from '@/services/api/orderService';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type HistoryFilter = 'all' | 'DELIVERED' | 'ISSUE';
type PeriodFilter = 'today' | '7d' | 'month' | 'all';

const DriverHistory: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [searchQuery, setSearchQuery] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date();
    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start.setDate(1);
    } else {
      return { start: undefined, end: undefined };
    }
    return { 
      start: start.toISOString().split('T')[0], 
      end: now.toISOString().split('T')[0] 
    };
  }, [period]);

  const { data: historyPage, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['driver-history', activeFilter, period],
    queryFn: () => orderService.getDriverHistory({
      page: 0, size: 100,
      status: activeFilter === 'all' ? undefined : activeFilter,
      startDate: dateRange.start,
      endDate: dateRange.end,
    }),
    enabled: isDriver,
  });

  const orders = historyPage?.content ?? [];

  const filteredOrders = useMemo(() =>
    orders.filter(o =>
      o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())
    ), [orders, searchQuery]);

  // Stats — computed from the visible (filtered) set so they match the list
  const delivered = filteredOrders.filter(o => o.status === 'DELIVERED').length;
  const issues = filteredOrders.filter(o => ['ISSUE', 'RETURNED', 'CANCELLED', 'FAILED'].includes(o.status)).length;
  const totalEarnings = filteredOrders.reduce((sum, o) => sum + (o.driverEarnings ?? 0), 0);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredOrders>();
    filteredOrders.forEach(o => {
      const d = new Date(o.updatedAt || o.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(o);
    });
    return Array.from(map.entries());
  }, [filteredOrders]);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const itemVariants = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-36 lg:pb-8 overflow-x-hidden selection:bg-primary/30">

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-3xl border-b border-border px-5 lg:px-8 pt-8 pb-5">
        <div className="max-w-2xl lg:max-w-none xl:max-w-[1600px] xl:px-[clamp(24px,3vw,48px)] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/driver/dashboard')}
                className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-all shadow-sm">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Archive</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">Nexus History Engine</p>
              </div>
            </div>
            <button onClick={() => refetch()} disabled={isFetching}
              className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-all shadow-sm">
              <RefreshCcw className={cn('w-5 h-5 text-muted-foreground', isFetching && 'animate-spin text-primary')} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Period selector */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['today', '7d', 'month', 'all'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                    period === p 
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "bg-card border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {p === 'today' ? "Aujourd'hui" : p === '7d' ? "7 Jours" : p === 'month' ? "Ce Mois" : "Tout"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tracking ou destination..."
                className="w-full h-14 bg-card border border-border rounded-[1.25rem] pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-muted-foreground/30 text-foreground transition-all shadow-inner" />
            </div>

            {/* Status filters */}
            <div className="flex bg-muted/50 p-1.5 rounded-[1.25rem] border border-border shadow-inner">
              {(['all', 'DELIVERED', 'ISSUE'] as const).map(f => {
                const isActive = activeFilter === f;
                return (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className={cn(
                      'relative flex-1 py-3 rounded-xl font-black text-[9px] tracking-[0.2em] transition-all duration-300 uppercase',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}>
                    {isActive && (
                      <motion.div layoutId="activeFilter"
                        className="absolute inset-0 bg-primary shadow-lg shadow-primary/20"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                    )}
                    <span className="relative z-10">
                      {f === 'all' ? 'Tout' : f === 'DELIVERED' ? 'Livrées' : 'Incidents'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl lg:max-w-none xl:max-w-[1600px] xl:px-[clamp(24px,3vw,48px)] mx-auto px-5 lg:px-8 mt-6 space-y-8">

        {/* ── STATS CARDS ── */}
        {!isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-3xl p-5 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-2xl" />
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{filteredOrders.length}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Colis</p>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-2xl" />
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter">{delivered}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Livrées</p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-2xl" />
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-black text-primary tabular-nums tracking-tighter">{totalEarnings.toFixed(0)}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Gains</p>
            </div>
          </motion.div>
        )}

        {/* ── GROUPED ORDER LIST ── */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {isLoading ? (
            [1,2,3,4].map(i => <Skeleton key={i} className="h-44 w-full rounded-[2.5rem]" />)
          ) : grouped.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-32 text-center flex flex-col items-center">
              <div className="w-24 h-24 rounded-[2rem] bg-muted/50 border border-border flex items-center justify-center mb-8 shadow-inner">
                <SearchX className="w-10 h-10 text-muted-foreground/20" />
              </div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">Signal Perdu</p>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-2 max-w-[200px] leading-relaxed">Aucun enregistrement trouvé pour cette période</p>
            </motion.div>
          ) : (
            grouped.map(([date, dateOrders]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-4 mb-5 px-1">
                  <div className="flex items-center gap-2.5 px-3 py-1.5 bg-muted/50 border border-border rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] capitalize">{date}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                  <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{dateOrders.length} Unit{dateOrders.length > 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
                  {dateOrders.map(order => {
                    const isDelivered = order.status === 'DELIVERED';
                    const isIssue = ['ISSUE', 'RETURNED', 'CANCELLED', 'FAILED'].includes(order.status);
                    return (
                      <motion.div key={order.id} variants={itemVariants} layout
                        onClick={() => navigate(`/driver/orders/${order.id}`)}
                        className="bg-card border border-border rounded-[2.5rem] p-5 shadow-xl relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-all duration-200">
                        {/* Status bar */}
                        <div className={cn('absolute top-0 left-0 w-1.5 h-full',
                          isDelivered ? 'bg-emerald-500' : isIssue ? 'bg-rose-500' : 'bg-indigo-500'
                        )} />

                        <div className="flex justify-between items-start mb-4 pl-2">
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tracking</p>
                            <div className="px-3 py-1 bg-muted border border-border rounded-xl w-fit">
                              <span className="text-[10px] font-black text-foreground tracking-[0.1em] uppercase">{order.trackingNumber}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Gain</p>
                            <p className="text-xl font-black text-emerald-400 tabular-nums">
                              +{order.driverEarnings || 25} <span className="text-[9px] opacity-40">MAD</span>
                            </p>
                          </div>
                        </div>

                        <p className="text-[11px] font-bold text-muted-foreground line-clamp-1 uppercase tracking-tight pl-2 mb-4">
                          {order.deliveryAddress}
                          {order.receiverCity && <span className="text-primary/60"> · {order.receiverCity}</span>}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-border pl-2">
                          <div className={cn(
                            'px-3 py-1.5 rounded-full flex items-center gap-1.5 border text-[8px] font-black uppercase tracking-widest',
                            isDelivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            isIssue ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                          )}>
                            {isDelivered ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {order.status?.replace('_', ' ')}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DriverHistory;



