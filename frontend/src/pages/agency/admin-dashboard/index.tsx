import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Users, RefreshCw, 
  Search, Box, Clock, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { Order, Driver } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { formatTimestamp } from '@/lib/utils';

const paymentStatusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Payment Pending', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  COLLECTED_BY_DRIVER: { label: 'Collected by Driver', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  REMITTED_TO_AGENCY: { label: 'Remitted to Agency', className: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  CONFIRMED_BY_AGENCY: { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

const AgencyAdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, driversData] = await Promise.all([
        agencyService.getAdminOrders(),
        agencyService.getAdminDrivers()
      ]);
      setOrders(ordersData.content || []);
      setDrivers(driversData || []);
    } catch (error) {
      toast.error('Sync failure: Operational data node unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleValidateDelivery = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await agencyService.validateDelivery(orderId);
      toast.success('Delivery validated successfully');
      fetchData();
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmingOrderId) return;
    setActionLoading(confirmingOrderId);
    try {
      await agencyService.confirmPayment(confirmingOrderId);
      toast.success('Payment confirmed and recorded');
      setConfirmingOrderId(null);
      fetchData();
    } catch (error) {
      toast.error('Payment confirmation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
    order.receiverName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-primary-foreground p-8 space-y-12 font-sans selection:bg-blue-500/30">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Agency Admin Command Center</p>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Agency <span className="text-blue-500">Admin</span> Dashboard
          </h1>
          <p className="text-muted-foreground/60 mt-4 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
            <Clock className="w-3 h-3" /> System Live — {new Date().toLocaleTimeString()}
          </p>
        </motion.div>

        <Button 
          variant="outline" 
          onClick={fetchData}
          disabled={loading}
          className="rounded-2xl border-border/40 bg-accent/30 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest px-8 h-14 hover:bg-accent/40 transition-all border border-border/40"
        >
          <RefreshCw className={loading ? "w-4 h-4 mr-3 animate-spin" : "w-4 h-4 mr-3"} /> Sync Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Orders Management */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-border/40 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Active Orders</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Operational queue ({filteredOrders.length})</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-12 bg-accent/30 border-border/40 rounded-xl h-11 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-32 rounded-3xl bg-accent/30 animate-pulse" />
                  ))
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order, idx) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 rounded-3xl bg-accent/10 border border-border/40 hover:bg-accent/20 transition-all group relative overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-black tracking-tight uppercase">{order.trackingNumber}</p>
                              <StatusBadge status={order.status} />
                              <Badge variant="outline" className={`rounded-full text-[9px] font-black uppercase tracking-widest ${paymentStatusLabel[order.paymentStatus || 'PENDING']?.className || paymentStatusLabel.PENDING.className}`}>
                                {paymentStatusLabel[order.paymentStatus || 'PENDING']?.label || 'Payment Pending'}
                              </Badge>
                            </div>
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">
                              {order.receiverName} • {order.deliveryAddress} • {formatTimestamp(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {order.status === 'DELIVERED' && (
                            <Button
                              size="sm"
                              onClick={() => handleValidateDelivery(order.id)}
                              disabled={!!actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-500 text-primary-foreground rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-6 shadow-xl shadow-emerald-600/20"
                            >
                              {actionLoading === order.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Validate Delivery"}
                            </Button>
                          )}
                          {(order.paymentStatus === 'COLLECTED_BY_DRIVER' || order.paymentStatus === 'REMITTED_TO_AGENCY') && order.codAmount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => setConfirmingOrderId(order.id)}
                              disabled={!!actionLoading}
                              className="bg-blue-600 hover:bg-blue-500 text-primary-foreground rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-6 shadow-xl shadow-blue-600/20"
                            >
                              {actionLoading === order.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Confirm COD"}
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Background Glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-accent/10 rounded-[2rem] border-2 border-dashed border-border/40">
                    <Box className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No orders in sector queue</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>

        {/* Right Column: Drivers Performance */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-border/40 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Active Fleet</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Driver performance HUB</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-3xl bg-accent/30 animate-pulse" />
                ))
              ) : drivers.length > 0 ? (
                drivers.map((driver, idx) => (
                  <motion.div 
                    key={driver.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-3xl bg-accent/10 border border-border/40 hover:bg-accent/20 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center text-muted-foreground/60">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm">{driver.firstName} {driver.lastName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${driver.status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{driver.status}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black leading-none">{driver.todayDeliveries || 0}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Today</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center bg-accent/10 rounded-[2rem] border-2 border-dashed border-border/40">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No drivers deployed</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 text-center">
              <p className="text-3xl font-black tracking-tight">{orders.filter(o => o.status === 'PENDING').length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mt-1">Pending</p>
            </div>
            <div className="p-6 rounded-[2rem] bg-emerald-600/10 border border-emerald-500/20 text-center">
              <p className="text-3xl font-black tracking-tight">{orders.filter(o => o.status === 'DELIVERED').length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-1">Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={!!confirmingOrderId} onOpenChange={() => setConfirmingOrderId(null)}>
        <AlertDialogContent className="bg-[#0f172a] border border-border/40 rounded-[2rem] p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-primary-foreground uppercase tracking-tight">Confirm Cash Payment</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/60 font-bold mt-4 uppercase text-xs tracking-widest leading-relaxed">
              Are you sure you want to confirm cash received from the driver for this order? This action will finalize the financial record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-xl border-border/40 bg-accent/30 text-muted-foreground/60 font-black text-[10px] uppercase tracking-widest h-12 px-8 hover:bg-accent/40">
              Abort Action
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmPayment}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-primary-foreground font-black text-[10px] uppercase tracking-widest h-12 px-8 shadow-xl shadow-blue-600/20"
            >
              Confirm Reception
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgencyAdminDashboard;
