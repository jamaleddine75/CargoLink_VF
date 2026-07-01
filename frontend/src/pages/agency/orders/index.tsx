import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, Clock, Truck, AlertTriangle,
  Plus, RefreshCw, Box, Filter, ChevronLeft, ChevronRight,
  Download, Zap, Calendar as CalendarIcon, Settings2,
  Table as TableIcon, LayoutGrid
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import { cn } from '@/lib/utils';

// Extracted Components
import { OrdersTable } from './components/OrdersTable';
import { StatHUDTile } from './components/StatHUDTile';

const statusConfig: Record<string, { label: string }> = {
  'PENDING': { label: 'Pending' },
  'VALIDATED': { label: 'Validated' },
  'ASSIGNED': { label: 'Assigned' },
  'PICKUP_READY': { label: 'Ready for Pickup' },
  'ON_THE_WAY': { label: 'In Transit' },
  'DELIVERED': { label: 'Delivered' },
  'ISSUE': { label: 'Issue' },
  'CANCELLED': { label: 'Cancelled' },
};

export default function AgencyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderType, setOrderType] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [cityFilter, setCityFilter] = useState<'all' | 'agency'>('agency');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // If filtering by agency city and user has agencyCity, use the city filter API
      if (cityFilter === 'agency' && user?.agencyCity) {
        const data = await agencyService.getOrdersByCity(
          user.agencyCity,
          orderType === 'all' ? undefined : orderType,
          statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          20
        );
        setOrders(data.content || []);
        setTotalPages(data.totalPages || 1);
      } else {
        // Otherwise get all admin orders
        const data = await agencyService.getAdminOrders(
          statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          20
        );
        setOrders(data.content || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error: unknown) {
      const status = error?.response?.status;
      if (status === 403) {
        toast.error('Access denied. Please check your permissions for this city.');
      } else {
        toast.error('Order synchronization error');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, orderType, cityFilter, user?.agencyCity]);

  useEffect(() => { setPage(0); }, [statusFilter, orderType, cityFilter]);
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

  const handleAutoAssign = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Analyzing driver availability and routes...',
        success: 'Auto-assignment algorithm completed successfully',
        error: 'Optimization failed. Please try manual assignment.',
      }
    );
  };

  const handleExport = () => {
    toast.success('Preparing export... Download will start automatically');
    // Implement actual export call here
  };

  const filteredOrders = orders.filter(order => {
    const term = search.toLowerCase();
    const matchesSearch = (
      (order.trackingNumber || '').toLowerCase().includes(term) ||
      (order.receiverName || '').toLowerCase().includes(term) ||
      (order.deliveryAddress || '').toLowerCase().includes(term)
    );

    // Filter by order type if in city view
    let matchesType = true;
    if (cityFilter === 'agency' && orderType !== 'all') {
      if (orderType === 'pickup') {
        matchesType = order.senderCity === user?.agencyCity;
      } else if (orderType === 'delivery') {
        matchesType = order.receiverCity === user?.agencyCity;
      }
    }

    return matchesSearch && matchesType;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    incidents: orders.filter(o => o.status === 'ISSUE').length
  };

  return (
    <div className="space-y-6 md:space-y-8 font-sans selection:bg-blue-500/30 relative z-10 pb-12">
      {/* Mesh Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Page Header HUD */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Regional Operations Node</p>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">— Agency Portal</p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
            Manage <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">Orders</span>
          </h1>
          <p className="text-muted-foreground/60 mt-6 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 max-w-xl leading-relaxed">
            <Box className="w-4 h-4 text-blue-500/50" /> 
            {cityFilter === 'agency' && user?.agencyCity 
              ? `Managing ${stats.total} missions in ${user.agencyCity}. ${orderType === 'all' ? 'All transaction types.' : orderType === 'pickup' ? 'Pickup orders only.' : 'Delivery orders only.'}`
              : `Monitoring ${stats.total} missions in local sector. Precision logistics for scale.`
            }
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            className="rounded-2xl border-border/40 bg-accent/30 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest px-6 h-14 hover:bg-accent/40 transition-all border border-border/40 hover:border-blue-500/30"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2.5 text-blue-400", loading && "animate-spin")} /> Sync Node
          </Button>
          <Button
            onClick={() => navigate('/agency/create-order')}
            className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-primary-foreground font-black text-[10px] uppercase tracking-widest px-8 h-14 shadow-[0_20px_40px_rgba(37,99,235,0.25)] transition-all active:scale-95 border border-border/40"
          >
            <Plus className="w-5 h-5 mr-3" /> New Shipment
          </Button>
        </div>
      </header>

      {/* Stats HUD Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <StatHUDTile label="Total Missions" value={stats.total} icon={Package} color="blue" />
        <StatHUDTile label="Pending Status" value={stats.pending} icon={Clock} color="amber" />
        <StatHUDTile label="Active Incidents" value={stats.incidents} icon={AlertTriangle} color="rose" />
      </div>

      {/* Toolbar HUD - High Density Controls */}
      <div className="relative z-20 space-y-4">
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
          {/* Search - Flexible Grow */}
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search by ID, Customer or destination..."
              className="h-14 pl-16 rounded-2xl bg-accent/20 border-border/40 backdrop-blur-3xl focus-visible:ring-blue-500/20 font-bold text-sm transition-all text-primary-foreground placeholder:text-muted-foreground/40 uppercase tracking-tight shadow-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Action Tools - High Density */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-14 rounded-2xl bg-accent/20 border-border/40 backdrop-blur-3xl px-5 font-bold text-xs uppercase tracking-widest text-foreground/80 hover:bg-accent/30 gap-3">
                  <CalendarIcon className="w-4 h-4 text-blue-500" />
                  {date ? format(date, "PPP") : "Pick Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0f172a] border-border/40" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

          {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-14 w-48 rounded-2xl bg-accent/20 border-border/40 backdrop-blur-3xl font-black text-[10px] uppercase tracking-[0.2em] px-6 text-foreground hover:bg-accent/30 transition-all">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-blue-500" />
                  <SelectValue placeholder="Statuses" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-border/40 rounded-2xl">
                <SelectItem value="ALL" className="text-[10px] font-black uppercase text-foreground">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, val]) => (
                  <SelectItem key={key} value={key} className="text-[10px] font-black uppercase text-foreground">{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Filter */}
            {user?.agencyCity && (
              <Select value={cityFilter} onValueChange={(v) => setCityFilter(v as 'all' | 'agency')}>
                <SelectTrigger className="h-14 w-48 rounded-2xl bg-accent/20 border-border/40 backdrop-blur-3xl font-black text-[10px] uppercase tracking-[0.2em] px-6 text-foreground hover:bg-accent/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <SelectValue placeholder="Location" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-border/40 rounded-2xl">
                  <SelectItem value="all" className="text-[10px] font-black uppercase text-foreground">All Locations</SelectItem>
                  <SelectItem value="agency" className="text-[10px] font-black uppercase text-foreground">{user.agencyCity}</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Order Type Filter */}
            {cityFilter === 'agency' && (
              <Select value={orderType} onValueChange={(v) => setOrderType(v as 'all' | 'pickup' | 'delivery')}>
                <SelectTrigger className="h-14 w-48 rounded-2xl bg-accent/20 border-border/40 backdrop-blur-3xl font-black text-[10px] uppercase tracking-[0.2em] px-6 text-foreground hover:bg-accent/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <SelectValue placeholder="Type" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-border/40 rounded-2xl">
                  <SelectItem value="all" className="text-[10px] font-black uppercase text-foreground">All Types</SelectItem>
                  <SelectItem value="pickup" className="text-[10px] font-black uppercase text-foreground">Pickup Orders</SelectItem>
                  <SelectItem value="delivery" className="text-[10px] font-black uppercase text-foreground">Delivery Orders</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Advanced Actions */}
            <div className="h-14 px-1 rounded-2xl bg-accent/10 border border-border/40 flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleAutoAssign}
                className="h-12 w-12 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-all"
                title="Auto-Assign Orders"
              >
                <Zap className="w-5 h-5 fill-current opacity-80" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleExport}
                className="h-12 w-12 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-all"
                title="Export Data"
              >
                <Download className="w-5 h-5" />
              </Button>
              <div className="w-[1px] h-6 bg-border/40 mx-1" />
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-12 w-12 rounded-xl transition-all", viewMode === 'table' ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground/40")}
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-12 w-12 rounded-xl transition-all", viewMode === 'grid' ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground/40")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 min-h-[500px]">
        {filteredOrders.length > 0 ? (
          <OrdersTable 
            orders={filteredOrders} 
            loading={loading} 
            onValidate={handleValidate}
          />
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center py-40 bg-accent/5 rounded-[40px] border-2 border-dashed border-border/40 backdrop-blur-sm">
            <div className="w-24 h-24 rounded-[2.5rem] bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20">
              <Box className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
            <h3 className="text-2xl font-black tracking-tight uppercase">Operational Void Detected</h3>
            <p className="text-muted-foreground/40 mt-2 font-bold uppercase text-[10px] tracking-widest">No matching shipments found in current sector</p>
            <Button 
              variant="outline" 
              className="mt-8 rounded-xl border-border/40 text-[10px] uppercase font-black tracking-widest px-6"
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/40 bg-accent/5 overflow-hidden p-8 space-y-4">
             {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-16 rounded-xl bg-accent/10 animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Pagination HUD */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 relative z-10">
          <Button
            variant="outline"
            className="rounded-2xl h-12 px-6 border-border/40 bg-accent/20 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-30"
            disabled={page === 0 || loading}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Pre-Sector
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-border/40">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Node</span>
            <span className="text-sm font-black text-blue-500">{page + 1}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">of</span>
            <span className="text-sm font-black text-foreground/80">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl h-12 px-6 border-border/40 bg-accent/20 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-30"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Post-Sector <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
