import React, { useState } from 'react';
import { 
  Search, Filter, ListFilter, Clock, CheckCircle2, 
  Truck, Navigation, Package, AlertCircle, RefreshCw, 
  Shuffle, Calendar, Download, MoreVertical, MapPin, Phone,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import adminService from '@/services/api/adminService';
import { formatTimestamp, cn } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';

const AdminOrders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const { data: orderData, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'orders', { status: statusFilter, page, search: searchTerm }],
    queryFn: () => adminService.getOrders({ 
      status: statusFilter === 'ALL' ? undefined : statusFilter, 
      page, 
      size: 10,
    }),
  });

  const orders = orderData?.content || [];
  const totalItems = orderData?.totalElements || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) setSelectedOrders([]);
    else setSelectedOrders(orders.map((o: unknown) => o.id));
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const tabs = [
    { id: 'ALL', label: 'All Orders', icon: ListFilter },
    { id: 'PENDING', label: 'Pending', icon: Clock },
    { id: 'VALIDATED', label: 'Validated', icon: CheckCircle2 },
    { id: 'ASSIGNED', label: 'Assigned', icon: Truck },
    { id: 'DELIVERED', label: 'Delivered', icon: Package },
    { id: 'ISSUE', label: 'Issues', icon: AlertCircle },
  ];

  return (
    <div className="space-y-4 md:space-y-6 relative z-10 pb-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Orders</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none font-display">Orders <span className="text-primary">Board</span></h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">Simple delivery tracking, status review, and dispatch actions in one place.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={handleRefresh} variant="outline" className="flex-1 sm:flex-none h-11 rounded-full border-border/40 bg-card/40 backdrop-blur-xl text-foreground font-semibold text-[10px] uppercase tracking-widest px-5 hover:bg-primary/10 hover:text-primary transition-all group">
            <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin text-primary")} />
            Sync
          </Button>
          <Button onClick={() => navigate('/admin/attribution')} className="flex-1 sm:flex-none h-11 rounded-full bg-hero-gradient text-white font-semibold text-[10px] uppercase tracking-widest px-6 shadow-lg shadow-primary/20 active:scale-95 transition-all">
            <Shuffle className="w-4 h-4 mr-2" />
            Auto-Assign
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(0); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                isActive 
                  ? "bg-indigo-600 text-foreground" 
                  : "bg-accent/30 border border-border/40 text-foreground/60 hover:bg-accent/40"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-foreground" : "text-foreground/40")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-card/40 backdrop-blur-3xl p-3 md:p-4 rounded-[1.5rem] border border-border/40 flex flex-col lg:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
          <Input 
            placeholder="Search Tracking ID or Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 h-10 border-border/40 bg-accent/30 rounded-xl text-sm text-foreground placeholder:text-foreground/30 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[140px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
            <Input type="date" className="h-10 pl-10 border-border/40 bg-accent/30 rounded-xl text-xs w-full text-foreground" />
          </div>
          <Button variant="outline" className="h-10 border-border/40 text-foreground/60 hover:bg-accent/30 px-4 rounded-xl flex-1 sm:flex-none">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
          <Button variant="outline" className="h-10 border-border/40 text-foreground/60 hover:bg-accent/30 px-4 rounded-xl flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-40 w-full bg-card/40 rounded-[2rem] animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground bg-card/20 rounded-[2rem] border border-dashed border-border/40 uppercase text-[10px] font-black tracking-widest">No manifests found</div>
        ) : (
          orders.map((order: unknown) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/admin/orders/${order.id}`)}
              className="bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-5 shadow-xl relative overflow-hidden active:scale-[0.98] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md w-fit">
                    <p className="font-black text-primary text-[10px] tracking-widest">{order.trackingNumber}</p>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/60">{formatTimestamp(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Customer</p>
                  <p className="text-xs font-bold text-foreground truncate">{order.receiverName || 'Unknown'}</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Value</p>
                  <p className="text-sm font-black text-primary">{order.codAmount || 0} MAD</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Vector</p>
                  {order.driverName ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">{order.driverName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-bold text-foreground truncate">{order.driverName}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest italic">Unassigned</span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl bg-accent/30 border border-white/5 h-10 w-10">
                  <ChevronRight className="w-4 h-4 text-primary" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="hidden lg:block bg-card/40 backdrop-blur-3xl rounded-[2rem] border border-border/40 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-accent/30 border-b border-border/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px] text-center">
                  <Checkbox 
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Manifest / Date</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recipient</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Logistics Path</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assigned Driver</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Yield</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8} className="py-4"><div className="h-8 w-full bg-accent/30 rounded animate-pulse" /></TableCell></TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-40">
                    No active manifests found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: unknown) => (
                  <TableRow 
                    key={order.id} 
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className={cn(
                      "hover:bg-accent/20 transition-colors cursor-pointer group",
                      selectedOrders.includes(order.id) && "bg-primary/10"
                    )}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleSelectOrder(order.id)}
                        className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md w-fit mb-1">
                        <p className="font-black text-primary text-[10px] tracking-widest">{order.trackingNumber}</p>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground/40">{formatTimestamp(order.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-foreground text-xs uppercase tracking-tight">{order.receiverName || 'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-1"><Phone className="w-3 h-3 text-primary" /> {order.receiverPhone || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="truncate max-w-[150px]">{order.pickupAddress?.split(',')[0] || 'Origin'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <span className="truncate max-w-[150px]">{order.deliveryAddress?.split(',')[0] || 'Destination'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.driverName ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-white/10">
                            {order.driverAvatarUrl && <AvatarImage src={order.driverAvatarUrl} />}
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-black">
                              {order.driverName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-black text-foreground uppercase tracking-tight">{order.driverName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-muted-foreground/40 bg-accent/30 px-2 py-1 rounded uppercase tracking-widest italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-black text-primary text-xs tracking-widest">{order.codAmount || 0} MAD</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/20 group-hover:text-primary transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
