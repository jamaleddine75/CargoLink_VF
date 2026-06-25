import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Plus, Activity,
  Package, Box
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

import { KPIStats } from './components/KPIStats';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { useAuth } from '@/context/AuthContext';
import agencyService from '@/services/api/agencyService';
import StatusBadge from '@/components/common/StatusBadge';
import { formatTimestamp } from '@/lib/utils';
import { ChartSkeleton, ListSkeleton } from '@/pages/agency/shared';

const AgencyDashboardUnified = () => {
  const { user } = useAuth();
  const { metrics, orders, loading, refresh, agencyId } = useDashboardMetrics();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleValidateDelivery = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await agencyService.validateDelivery(orderId);
      toast.success('Mission validated successfully');
      refresh();
    } catch (error) {
      toast.error('Validation protocol failure');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await agencyService.confirmPayment(orderId);
      toast.success('COD Credit synchronized');
      refresh();
    } catch (error) {
      toast.error('Financial sync failed');
    } finally {
      setActionLoading(null);
    }
  };

  const recentOrders = orders.slice(0, 10); // Display only recent ones

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{user?.agencyName || 'Agency'} Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vue d'ensemble de vos opérations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={() => window.location.href = '/agency/create-order'}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvelle Expédition
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <KPIStats metrics={metrics} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Activity Chart */}
        {loading ? (
          <div className="lg:col-span-12">
            <ChartSkeleton />
          </div>
        ) : (
          <Card className="lg:col-span-12 border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] p-8 md:p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-12 relative z-10">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Flux d'Activité</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                  Volume Hebdomadaire
                </p>
              </div>
            </div>

            <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.weeklyOrders || []}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.03} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#ffffff30', fontSize: 10, fontWeight: 900}}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#ffffff30', fontSize: 10, fontWeight: 900}}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(2, 6, 23, 0.8)',
                      borderRadius: '24px', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      padding: '20px',
                      backdropFilter: 'blur(20px)'
                    }}
                    itemStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#3b82f6' }}
                    labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', color: 'white', marginBottom: '8px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorFlow)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-40 h-40 text-blue-500" />
            </div>
          </Card>
        )}

        {/* Recent Orders Table */}
        <div className="lg:col-span-12 space-y-6 mt-4">
          <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-border/40 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black uppercase tracking-tight mb-6">Missions Récentes</h3>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <ListSkeleton />
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order: any, idx: number) => (
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
                              {actionLoading === order.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Valider"}
                            </Button>
                          )}
                          {(order.paymentStatus === 'COLLECTED_BY_DRIVER') && order.codAmount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmPayment(order.id)}
                              disabled={!!actionLoading}
                              className="bg-blue-600 hover:bg-blue-500 text-primary-foreground rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-6 shadow-xl shadow-blue-600/20"
                            >
                              {actionLoading === order.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Confirmer COD"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-accent/10 rounded-[2rem] border-2 border-dashed border-border/40">
                    <Box className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Aucune mission trouvée</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboardUnified;
