import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Filter, Calendar, RefreshCw,
  ArrowUpRight, DollarSign, CheckCircle2, AlertCircle,
  FileSpreadsheet, Search, ShieldCheck, Activity,
  Globe, Zap, ChevronRight, ArrowRight, Banknote,
  Wallet, User, Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { formatTimestamp, cn } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';

export default function CODReconciliation() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingRemittances, setPendingRemittances] = useState<any[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
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
      const [ordersData, remittances] = await Promise.all([
        agencyService.getAgencyOrders(agencyId, 0, 100),
        agencyService.getPendingRemittances(agencyId).catch(() => []),
      ]);
      setOrders(ordersData.content || []);
      setPendingRemittances(remittances || []);
    } catch (error) {
      toast.error('Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  const handleConfirmRemittance = async (txId: string) => {
    if (!agencyId) return;
    try {
      setConfirmingId(txId);
      await agencyService.confirmRemittance(agencyId, txId);
      toast.success('Remise confirmée avec succès');
      fetchOrders();
    } catch (error) {
      toast.error('Erreur lors de la confirmation');
    } finally {
      setConfirmingId(null);
    }
  };

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
      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch (error) {
      toast.error(`Erreur d'export`);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = (o.trackingNumber || '').toLowerCase().includes(filters.search.toLowerCase()) || 
                       (o.receiverName || '').toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus = filters.status === 'all' || o.status === filters.status;
    return matchSearch && matchStatus;
  });

  const totalCod = filteredOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans overflow-x-hidden selection:bg-primary/30">
      
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* HUD Header - Refined */}
        <div className="pt-12 md:pt-20 pb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-10 text-left">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400/80 leading-none">Nexus Financial Node — Integrity</p>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-foreground leading-none">
              COD <span className="text-emerald-500">Sync</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchOrders} className="h-12 px-6 rounded-2xl bg-accent/30 border-border/40 hover:bg-accent/40 text-[10px] font-black uppercase tracking-widest gap-2 transition-all">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
            </Button>
            <div className="flex gap-2">
               <Button onClick={() => handleExport('csv')} disabled={isExporting} className="h-12 px-5 rounded-2xl bg-accent/30 border border-border/40 text-foreground font-black uppercase text-[10px] hover:bg-accent/40">CSV</Button>
               <Button onClick={() => handleExport('pdf')} disabled={isExporting} className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-foreground font-black uppercase text-[10px] shadow-lg shadow-emerald-600/20 border-none">PDF Report</Button>
            </div>
          </div>
        </div>

        <div className="space-y-12">

          {/* Pending Remittances — Driver COD Confirmation */}
          {pendingRemittances.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-400/80">
                  Pending Remittances — {pendingRemittances.length} awaiting confirmation
                </p>
              </div>
              {pendingRemittances.map((tx: any) => {
                const grossCollected = parseFloat(tx.metadata?.grossCollected || tx.amount) || 0;
                const driverKept = parseFloat(tx.metadata?.driverKept || '0') || 0;
                const toRemit = parseFloat(tx.amount) || 0;
                const orderCount = tx.referenceIds ? tx.referenceIds.split(',').length : 0;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0a0b] border border-amber-500/20 rounded-[2rem] p-8 flex flex-col md:flex-row items-start md:items-center gap-6"
                  >
                    {/* Driver info */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase text-foreground">{tx.driverName || 'Driver'}</p>
                        <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-0.5">
                          <Package size={10} className="inline mr-1" />{orderCount} order{orderCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Financial breakdown */}
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-xl bg-accent/10 border border-border/40">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Collected</p>
                        <p className="text-xl font-black text-foreground">{grossCollected.toFixed(2)} <span className="text-[9px] text-muted-foreground/40">MAD</span></p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60 mb-1">Driver Kept</p>
                        <p className="text-xl font-black text-emerald-400">{driverKept.toFixed(2)} <span className="text-[9px] text-emerald-400/30">MAD</span></p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/60 mb-1">Expected Remittance</p>
                        <p className="text-xl font-black text-amber-400">{toRemit.toFixed(2)} <span className="text-[9px] text-amber-400/30">MAD</span></p>
                      </div>
                    </div>

                    {/* Confirm button */}
                    <Button
                      onClick={() => handleConfirmRemittance(tx.id)}
                      disabled={confirmingId === tx.id}
                      className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-foreground font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20 border-none shrink-0 transition-all"
                    >
                      {confirmingId === tx.id ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <><CheckCircle2 size={16} className="mr-2" />Confirm</>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Stats HUD - Balanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardGrand label="Analyzed COD" value={totalCod} icon={Banknote} color="emerald" trend="Volume" />
            <StatCardGrand label="Nodes Count" value={filteredOrders.length} icon={Globe} color="blue" trend="Active" isAmount={false} />
            
            <Card className="lg:col-span-2 bg-background border border-border/40 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl flex flex-col justify-between group overflow-hidden relative">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 mb-6">Cycle Filter</p>
                  <div className="flex gap-4">
                     <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 ml-2">Start</label>
                        <Input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="h-12 bg-accent/30 border-border/40 rounded-xl text-xs font-black px-4 uppercase" />
                     </div>
                     <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 ml-2">End</label>
                        <Input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="h-12 bg-accent/30 border-border/40 rounded-xl text-xs font-black px-4 uppercase" />
                     </div>
                  </div>
               </div>
            </Card>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
             <div className="xl:col-span-8 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  placeholder="Identify mission (ID, Receiver)..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="h-16 pl-14 pr-6 rounded-2xl border-border/40 bg-accent/30 w-full text-sm font-bold text-foreground focus:ring-emerald-500/30 transition-all uppercase tracking-widest"
                />
             </div>
             <div className="xl:col-span-4">
                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                   <SelectTrigger className="h-16 rounded-2xl bg-accent/30 border-border/40 px-6 font-black text-[10px] uppercase tracking-widest group hover:bg-accent/40 transition-all">
                      <div className="flex items-center gap-3">
                         <Filter className="w-4 h-4 text-emerald-500" />
                         <SelectValue placeholder="State" />
                      </div>
                   </SelectTrigger>
                   <SelectContent className="bg-background border-border/40 rounded-2xl">
                      <SelectItem value="all" className="text-[10px] font-black uppercase">All</SelectItem>
                      <SelectItem value="DELIVERED" className="text-[10px] font-black uppercase text-emerald-400">Delivered</SelectItem>
                      <SelectItem value="ON_THE_WAY" className="text-[10px] font-black uppercase text-blue-400">Transit</SelectItem>
                   </SelectContent>
                </Select>
             </div>
          </div>

          {/* Table Ledger */}
          <Card className="bg-[#0a0a0b] border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
             <div className="overflow-x-auto text-foreground">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-border/40 bg-accent/10 h-20">
                         <th className="px-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Reference</th>
                         <th className="px-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Node State</th>
                         <th className="px-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Endpoint</th>
                         <th className="px-10 text-right text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Volume</th>
                         <th className="px-10 text-right text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Settlement</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border/40">
                      {loading ? (
                        [1,2,3,4].map(i => (
                          <tr key={i} className="h-24"><td colSpan={5} className="px-10 py-6"><div className="h-10 w-full bg-accent/30 animate-pulse rounded-xl" /></td></tr>
                        ))
                      ) : filteredOrders.map((order, i) => (
                        <motion.tr 
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-24 hover:bg-accent/10 transition-colors group"
                        >
                           <td className="px-10">
                              <p className="font-black tracking-tight uppercase text-sm group-hover:text-emerald-400 transition-colors">{order.trackingNumber}</p>
                              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-0.5">{formatTimestamp(order.createdAt)}</p>
                           </td>
                           <td className="px-10"><StatusBadge status={order.status} /></td>
                           <td className="px-10">
                              <p className="font-black text-xs text-foreground/80 uppercase">{order.receiverName}</p>
                           </td>
                           <td className="px-10 text-right">
                              <p className="font-black text-emerald-400 text-xl tracking-tighter italic">{(order.codAmount || 0).toLocaleString()} <span className="text-[10px] opacity-30 not-italic ml-1">MAD</span></p>
                           </td>
                           <td className="px-10 text-right">
                              <Badge className={cn("border-none text-[8px] font-black uppercase px-3 py-1 rounded-md", 
                                 order.paymentStatus === 'CONFIRMED_BY_AGENCY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-accent/30 text-muted-foreground/60'
                              )}>
                                 {order.paymentStatus?.replace(/_/g, ' ') || 'UNSETTLED'}
                              </Badge>
                           </td>
                        </motion.tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const StatCardGrand = ({ label, value, icon: Icon, color, trend, isAmount = true }: any) => (
  <motion.div whileHover={{ y: -5 }} className="flex-1 bg-background border border-border/40 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-xl group hover:bg-accent/10 transition-all flex flex-col justify-between overflow-hidden relative">
     <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-[0.03]", 
        color === 'emerald' ? "bg-emerald-500" : "bg-blue-500"
     )} />
     <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl",
          color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-blue-500/10 text-blue-400 border-blue-500/10'
        )}>
           <Icon size={28} />
        </div>
        <Badge variant="outline" className="border-border/40 bg-accent/30 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">{trend}</Badge>
     </div>
     <div className="relative z-10 text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 mb-2">{label}</p>
        <h4 className="text-3xl font-black tracking-tighter leading-none italic text-foreground group-hover:text-emerald-400 transition-colors">
          {isAmount ? value.toLocaleString() : value}
          {isAmount && <span className="text-sm opacity-20 ml-2 italic">MAD</span>}
        </h4>
     </div>
  </motion.div>
);
