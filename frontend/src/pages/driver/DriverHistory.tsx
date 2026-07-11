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
      <div className="sticky top-0 z-50 bg-background border-b border-border px-5 lg:px-8 pt-8 pb-5">
        <div className="max-w-2xl lg:max-w-none xl:max-w-[1600px] xl:px-[clamp(24px,3vw,48px)] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/driver/dashboard')}
                className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Archive</h1>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">Nexus History Engine</p>
              </div>
            </div>
            <button onClick={() => refetch()} disabled={isFetching}
              className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
              <RefreshCcw className={cn('w-4 h-4 text-muted-foreground', isFetching && 'animate-spin text-primary')} />
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
                    "px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors whitespace-nowrap",
                    period === p 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p === 'today' ? "Aujourd'hui" : p === '7d' ? "7 Jours" : p === 'month' ? "Ce Mois" : "Tout"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tracking ou destination..."
                className="w-full h-12 bg-card border border-border rounded-md pl-12 pr-4 text-sm font-medium focus:border-primary/50 outline-none placeholder:text-muted-foreground text-foreground transition-colors" />
            </div>

            {/* Status filters */}
            <div className="flex bg-muted p-1 rounded-md border border-border">
              {(['all', 'DELIVERED', 'ISSUE'] as const).map(f => {
                const isActive = activeFilter === f;
                return (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className={cn(
                      'relative flex-1 py-2 rounded-sm font-black text-[9px] tracking-[0.2em] transition-colors duration-200 uppercase',
                      isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    )}>
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
            <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
              <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center mb-3 border border-indigo-500/20">
                <Package className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">{filteredOrders.length}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Colis</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-5 shadow-sm">
              <div className="w-8 h-8 rounded-md bg-emerald-500/20 flex items-center justify-center mb-3 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-black text-emerald-500 tabular-nums tracking-tighter">{delivered}</p>
              <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mt-1">Livrées</p>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-5 shadow-sm">
              <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center mb-3 border border-primary/30">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-black text-primary tabular-nums tracking-tighter">{totalEarnings.toFixed(0)}</p>
              <p className="text-[9px] font-black text-primary/70 uppercase tracking-widest mt-1">Gains</p>
            </div>
          </motion.div>
        )}

        {/* ── GROUPED ORDER LIST ── */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {isLoading ? (
            [1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-md" />)
          ) : grouped.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-32 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-muted border border-border flex items-center justify-center mb-6">
                <SearchX className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Signal Perdu</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-2 max-w-[200px] leading-relaxed">Aucun enregistrement trouvé pour cette période</p>
            </motion.div>
          ) : (
            grouped.map(([date, dateOrders]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2.5 px-3 py-1 bg-muted border border-border rounded-md">
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest capitalize">{date}</span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{dateOrders.length} Unit{dateOrders.length > 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
                  {dateOrders.map(order => {
                    const isDelivered = order.status === 'DELIVERED';
                    const isIssue = ['ISSUE', 'RETURNED', 'CANCELLED', 'FAILED'].includes(order.status);
                    return (
                      <motion.div key={order.id} variants={itemVariants} layout
                        onClick={() => navigate(`/driver/orders/${order.id}`)}
                        className="bg-card border border-border rounded-md p-4 shadow-sm relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors">
                        {/* Status bar */}
                        <div className={cn('absolute top-0 left-0 w-1 h-full',
                          isDelivered ? 'bg-emerald-500' : isIssue ? 'bg-rose-500' : 'bg-indigo-500'
                        )} />

                        <div className="flex justify-between items-start mb-3 pl-2">
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tracking</p>
                            <div className="px-2 py-0.5 bg-muted border border-border rounded-sm w-fit">
                              <span className="text-[10px] font-black text-foreground tracking-widest uppercase">{order.trackingNumber}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Gain</p>
                            <p className="text-lg font-black text-emerald-500 tabular-nums">
                              +{order.driverEarnings || 25} <span className="text-[9px] opacity-60">MAD</span>
                            </p>
                          </div>
                        </div>

                        <p className="text-[11px] font-medium text-foreground line-clamp-1 uppercase tracking-widest pl-2 mb-4">
                          {order.deliveryAddress}
                          {order.receiverCity && <span className="text-muted-foreground"> · {order.receiverCity}</span>}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-border pl-2">
                          <div className={cn(
                            'px-2 py-0.5 rounded-md flex items-center gap-1.5 border text-[8px] font-black uppercase tracking-widest',
                            isDelivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            isIssue ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                          )}>
                            {isDelivered ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {order.status?.replace('_', ' ')}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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



