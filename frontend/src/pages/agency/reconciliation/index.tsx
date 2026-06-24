import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Download, Filter, RefreshCw, 
  DollarSign, FileSpreadsheet, Search
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';

export default function CODReconciliation() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  const agencyId = user?.agencyId || '';

  const fetchOrders = useCallback(async () => {
    if (!agencyId) return;
    try {
      setLoading(true);
      const data = await agencyService.getAgencyOrders(agencyId, 0, 100); // Fetch top 100 for recon
      setOrders(data.content || []);
    } catch (error) {
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!agencyId) return;
    try {
      setIsExporting(true);
      await agencyService.exportCOD(agencyId, {
        status: filters.status === 'all' ? undefined : filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        format
      });
      toast.success(`${format.toUpperCase()} Report generated successfully`);
    } catch (error) {
      toast.error(`Failed to generate ${format.toUpperCase()} report`);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.trackingNumber?.toLowerCase().includes(filters.search.toLowerCase()) || 
                       o.receiverName?.toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus = filters.status === 'all' || o.status === filters.status;
    return matchSearch && matchStatus;
  });

  const totalCod = filteredOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0);

  return (
    <div className="space-y-12 pb-12 relative z-10">
      {/* Mesh Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Financial Integrity Module</p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
            COD <span className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">Reconciliation</span>
          </h1>
          <p className="text-muted-foreground/60 mt-6 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
             <DollarSign className="w-4 h-4 text-emerald-500/50" /> Auditing and exporting local cash-on-delivery flows.
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-4">
           <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="rounded-2xl border-border/40 bg-accent/30 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest px-8 h-14 hover:bg-accent/40 transition-all"
          >
            <FileSpreadsheet className="w-5 h-5 mr-3 text-emerald-400" /> Export CSV
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-primary-foreground font-black text-[10px] uppercase tracking-widest px-8 h-14 shadow-2xl transition-all active:scale-95 border border-border/40"
          >
            <Download className="w-5 h-5 mr-3" /> Export PDF Report
          </Button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         <Card className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] p-8">
            <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-2">Total COD Analyzed</p>
            <h3 className="text-4xl font-black tracking-tighter text-emerald-400">
               {totalCod.toLocaleString()} <span className="text-sm opacity-40 ml-1">MAD</span>
            </h3>
         </Card>
         <Card className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] p-8">
            <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-2">Total Missions</p>
            <h3 className="text-4xl font-black tracking-tighter">
               {filteredOrders.length}
            </h3>
         </Card>
         <Card className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] p-8 md:col-span-2">
            <div className="flex gap-8 h-full items-center">
               <div className="flex-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-4">Date Range Filter</p>
                  <div className="flex gap-4">
                     <Input 
                        type="date" 
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        className="bg-accent/30 border-border/40 h-10 rounded-xl text-[10px] uppercase font-black" 
                     />
                     <Input 
                        type="date" 
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        className="bg-accent/30 border-border/40 h-10 rounded-xl text-[10px] uppercase font-black" 
                     />
                  </div>
               </div>
               <Button size="icon" variant="ghost" onClick={fetchOrders} className="rounded-2xl hover:bg-accent/40">
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
               </Button>
            </div>
         </Card>
      </div>

      {/* Filters HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
          <Input
            placeholder="Search by Tracking ID or Customer Name..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="h-16 pl-16 rounded-[1.5rem] bg-accent/20 border-border/40 backdrop-blur-3xl font-bold text-sm"
          />
        </div>
        <div className="lg:col-span-4">
          <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
            <SelectTrigger className="h-16 rounded-[1.5rem] bg-accent/20 border-border/40 px-8 font-black text-[10px] uppercase tracking-widest">
               <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-emerald-500" />
                  <SelectValue placeholder="All Statuses" />
               </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-border/40 rounded-2xl">
               <SelectItem value="all" className="text-[10px] font-black uppercase">All Orders</SelectItem>
               <SelectItem value="DELIVERED" className="text-[10px] font-black uppercase text-emerald-400">Delivered</SelectItem>
               <SelectItem value="ON_THE_WAY" className="text-[10px] font-black uppercase text-blue-400">In Transit</SelectItem>
               <SelectItem value="FAILED" className="text-[10px] font-black uppercase text-rose-400">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reconciliation Table */}
      <Card className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-accent/10">
                <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Tracking #</th>
                <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Date</th>
                <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Status</th>
                <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Receiver</th>
                <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right">COD Amount</th>
                <th className="p-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, i) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="hover:bg-accent/10 transition-colors group"
                  >
                    <td className="p-8">
                       <p className="font-black tracking-tighter uppercase text-sm group-hover:text-emerald-400 transition-colors">{order.trackingNumber}</p>
                    </td>
                    <td className="p-8">
                       <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{formatTimestamp(order.createdAt)}</p>
                    </td>
                    <td className="p-8">
                       <StatusBadge status={order.status} />
                    </td>
                    <td className="p-8">
                       <p className="text-xs font-bold text-foreground/80">{order.receiverName}</p>
                       <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">{order.receiverCity}</p>
                    </td>
                    <td className="p-8 text-right">
                       <p className="font-black text-emerald-400 text-lg tracking-tighter">{(order.codAmount || 0).toLocaleString()} <span className="text-[9px] opacity-40 ml-1">MAD</span></p>
                    </td>
                    <td className="p-8">
                       <Badge className={`border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 ${
                         order.paymentStatus === 'CONFIRMED_BY_AGENCY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-accent/30 text-muted-foreground/60'
                       }`}>
                          {order.paymentStatus?.replace(/_/g, ' ') || 'UNPAID'}
                       </Badge>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                     <div className="flex flex-col items-center gap-4 opacity-20">
                        <FileText className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No reconciliation records found</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
