import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Search, Clock, CheckCircle2, Truck, AlertTriangle,
  Plus, Calendar, Eye, QrCode, X, CreditCard, CheckCircle,
  Filter, RefreshCw, Box, ArrowUpRight, TrendingUp, User, MapPin,
  Globe
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';
import AnimatedCounter from '@/components/common/AnimatedCounter';

const statusConfig: Record<string, { label: string; color: string; glow: string }> = {
  'PENDING': { label: 'Pending', color: 'text-zinc-500 dark:text-zinc-400', glow: 'bg-zinc-500/10' },
  'VALIDATED': { label: 'Validated', color: 'text-emerald-600 dark:text-emerald-400', glow: 'bg-emerald-500/10' },
  'ASSIGNED': { label: 'Assigned', color: 'text-blue-600 dark:text-blue-400', glow: 'bg-blue-500/10' },
  'PICKUP_READY': { label: 'Ready for Pickup', color: 'text-amber-600 dark:text-amber-400', glow: 'bg-amber-500/10' },
  'ON_THE_WAY': { label: 'In Transit', color: 'text-purple-600 dark:text-purple-400', glow: 'bg-purple-500/10' },
  'DELIVERED': { label: 'Delivered', color: 'text-muted-foreground', glow: 'bg-accent/30' },
  'ISSUE': { label: 'Issue', color: 'text-rose-600 dark:text-rose-400', glow: 'bg-rose-500/10' },
  'CANCELLED': { label: 'Cancelled', color: 'text-muted-foreground/40', glow: 'bg-accent/30' },
};

const OrderHUDCard = ({ order, idx, onValidate }: { order: Order; idx: number; onValidate: (id: string) => void }) => {
  const navigate = useNavigate();
  const config = statusConfig[order.status] || statusConfig['PENDING'];
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.validated || isValidating) return;
    
    setIsValidating(true);
    try {
      await onValidate(order.id);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="group"
    >
      <Card 
        onClick={() => navigate(`/agency/orders/${order.id}`)}
        className="bg-card/60 dark:bg-accent/10 backdrop-blur-3xl border border-border/50 dark:border-border/40 rounded-[40px] overflow-hidden hover:bg-card/80 dark:hover:bg-accent/20 hover:border-primary/30 transition-all duration-500 cursor-pointer relative group shadow-2xl"
      >
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${config.glow} flex items-center justify-center border border-border/40 group-hover:scale-110 transition-transform`}>
                <Package className={`w-7 h-7 ${config.color}`} />
              </div>
              <div>
                <h4 className="font-black tracking-tighter text-lg uppercase leading-none">{order.trackingNumber}</h4>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                   <Calendar className="w-3 h-3" /> {formatTimestamp(order.createdAt)}
                </p>
              </div>
            </div>
            <StatusBadge status={order.validated ? 'VALIDATED' : order.status} />
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-blue-400" />
               </div>
               <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Recipient</p>
                  <p className="text-sm font-bold text-foreground/80 truncate">{order.receiverName || '—'}</p>
               </div>
            </div>

            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-400" />
               </div>
               <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-foreground/80 truncate">{order.deliveryAddress || '—'}</p>
               </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">COD Value</span>
              <span className="text-xl font-black text-blue-400 tracking-tight">{order.codAmount || 0} <span className="text-[10px] ml-1 opacity-40">MAD</span></span>
            </div>
            
            <Button
              size="sm"
              disabled={order.validated || isValidating}
              onClick={handleValidateClick}
              className={`rounded-xl px-4 font-black text-[10px] uppercase tracking-widest transition-all ${
                order.validated 
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-accent/30 hover:bg-primary text-muted-foreground hover:text-primary-foreground border border-border/40 hover:border-primary/40'
              }`}
            >
              {isValidating ? (
                <RefreshCw className="w-3 h-3 animate-spin mr-2" />
              ) : order.validated ? (
                <CheckCircle2 className="w-3 h-3 mr-2" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-2" />
              )}
              {order.validated ? 'Validated' : 'Validate Delivery'}
            </Button>
          </div>
        </CardContent>
        {/* Hover Glow */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity ${config.glow}`} />
      </Card>
    </motion.div>
  );
};

export default function AgencyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agencyService.getAdminOrders(
        statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        20
      );
      setOrders(data.content || []);
    } catch (error) {
      toast.error('Order synchronization error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleValidate = async (orderId: string) => {
    try {
      await agencyService.validateDelivery(orderId);
      toast.success('Missions validée avec succès');
      
      // Update local state instantly
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, validated: true, status: 'DELIVERED', validatedAt: new Date().toISOString() } 
          : order
      ));
    } catch (error) {
      toast.error('Validation failure');
    }
  };

  const filteredOrders = orders.filter(order => {
    const term = search.toLowerCase();
    return (
      (order.trackingNumber || '').toLowerCase().includes(term) ||
      (order.receiverName || '').toLowerCase().includes(term) ||
      (order.deliveryAddress || '').toLowerCase().includes(term)
    );
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    incidents: orders.filter(o => o.status === 'ISSUE').length
  };

  return (
    <div className="space-y-12 font-sans selection:bg-blue-500/30 relative z-10 pb-12">
      {/* Mesh Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 blur-[150px] rounded-full" />
      </div>
      
      {/* Header HUD */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Regional Distribution Node</p>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">— Live Ops</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
            Manage <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">Orders</span>
          </h1>
          <p className="text-muted-foreground/60 mt-6 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 max-w-xl">
            <Box className="w-4 h-4 text-blue-500/50" /> Monitoring {stats.total} missions in local sector.
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
           <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            className="rounded-2xl border-border/40 bg-accent/30 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest px-8 h-14 hover:bg-accent/40 transition-all border border-border/40 hover:border-blue-500/30"
          >
            <RefreshCw className={`w-5 h-5 mr-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Node
          </Button>
          <Button
            onClick={() => navigate('/agency/create-order')}
            className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-primary-foreground font-black text-[10px] uppercase tracking-widest px-10 h-14 shadow-[0_20px_40px_rgba(37,99,235,0.25)] transition-all active:scale-95 border border-border/40"
          >
            <Plus className="w-5 h-5 mr-3" /> New Shipment
          </Button>
        </div>
      </header>

      {/* Stats HUD Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <StatHUDTile label="Total Missions" value={stats.total} icon={Package} color="blue" />
        <StatHUDTile label="Pending Validation" value={stats.pending} icon={Clock} color="amber" />
        <StatHUDTile label="Critical Incidents" value={stats.incidents} icon={AlertTriangle} color="rose" />
      </div>

      {/* Search & Filter HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sticky top-4 z-20">
        <div className="lg:col-span-8 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="Search by ID, Customer or Destination..."
            className="h-16 pl-16 rounded-[1.5rem] bg-accent/10 dark:bg-accent/20 border-border/50 dark:border-border/40 backdrop-blur-3xl focus-visible:ring-primary/20 font-bold text-sm transition-all text-foreground placeholder:text-muted-foreground/40 uppercase tracking-tight"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="lg:col-span-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-16 rounded-[1.5rem] bg-accent/10 dark:bg-accent/20 border-border/50 dark:border-border/40 backdrop-blur-3xl font-black text-[10px] uppercase tracking-[0.2em] px-8 text-foreground">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-primary" />
                <SelectValue placeholder="All Statuses" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card dark:bg-zinc-950 border-border/40 rounded-2xl">
              <SelectItem value="ALL" className="text-[10px] font-black uppercase text-foreground">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, val]) => (
                <SelectItem key={key} value={key} className="text-[10px] font-black uppercase text-foreground">{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="relative z-10 min-h-[400px]">
        {loading && orders.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 rounded-[40px] bg-accent/10 border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, i) => (
                <OrderHUDCard 
                  key={order.id} 
                  order={order} 
                  idx={i} 
                  onValidate={handleValidate}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-accent/10 rounded-[40px] border-2 border-dashed border-border/40">
            <div className="w-24 h-24 rounded-[2.5rem] bg-blue-500/10 flex items-center justify-center mb-8">
              <Box className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
            <h3 className="text-2xl font-black tracking-tight uppercase">No matching shipments</h3>
            <p className="text-muted-foreground/40 mt-2 font-bold uppercase text-[10px] tracking-widest">Adjust filters or search parameters</p>
          </div>
        )}
      </div>

    </div>
  );
}

const StatHUDTile = ({ label, value, icon: Icon, color }: any) => (
  <Card className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] p-8 relative overflow-hidden group hover:bg-accent/20 transition-all duration-500 shadow-xl hover:shadow-blue-500/10">
    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-colors ${
      color === 'blue' ? 'bg-blue-600' : color === 'amber' ? 'bg-amber-600' : 'bg-rose-600'
    }`} />
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">{label}</p>
    <div className="flex items-end justify-between relative z-10">
      <h3 className="text-4xl font-black tracking-tighter">
        <AnimatedCounter value={value} />
      </h3>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-border/40 ${
        color === 'blue' ? 'bg-primary/10 text-primary' : color === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
      }`}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
  </Card>
);
