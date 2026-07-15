import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, Package, Box } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

import { KPIStats } from './components/KPIStats';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { useAuth } from '@/context/AuthContext';
import agencyService from '@/services/api/agencyService';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityCard from '@/components/shared/EntityCard';
import PageHeader from '@/components/shared/PageHeader';
import { formatTimestamp } from '@/lib/utils';
import { ChartSkeleton, ListSkeleton } from '@/pages/agency/shared';

const AgencyDashboardUnified = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, orders, loading, refresh } = useDashboardMetrics();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleConfirmPayment = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await agencyService.confirmPayment(orderId);
      toast.success('COD payment confirmed successfully');
      refresh();
    } catch (error) {
      toast.error('Payment confirmation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const recentOrders = orders.slice(0, 10);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={`${user?.agencyName || 'Agency'} Dashboard`}
        description="Overview of your logistics operations"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/agency/orders')}
              className="gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> New Shipment
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <KPIStats metrics={metrics} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Chart */}
        {loading ? (
          <div className="lg:col-span-12">
            <ChartSkeleton />
          </div>
        ) : (
          <Card className="lg:col-span-12 border border-border bg-card shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Activity Flow</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Weekly order volume
              </p>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.weeklyOrders || []}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      borderRadius: '8px', 
                      border: '1px solid hsl(var(--border))', 
                      padding: '12px',
                    }}
                    labelStyle={{ fontWeight: 600, fontSize: '12px', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                    itemStyle={{ fontSize: '12px', color: 'hsl(var(--primary))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorFlow)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Recent Orders List */}
        <div className="lg:col-span-12 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <ListSkeleton />
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <EntityCard
                    key={order.id}
                    onClick={() => navigate(`/agency/orders/${order.id}`)}
                    avatar={
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Package className="w-5 h-5" />
                      </div>
                    }
                    title={order.trackingNumber}
                    subtitle={`${order.receiverName} • ${order.deliveryAddress} • ${formatTimestamp(order.createdAt)}`}
                    statusBadge={<StatusBadge status={order.status} />}
                    actions={
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>

                        {(order.paymentStatus === 'COLLECTED_BY_DRIVER') && order.codAmount > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmPayment(order.id)}
                            disabled={!!actionLoading}
                            className="h-8 rounded-md px-3 text-xs"
                          >
                            {actionLoading === order.id ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : "Confirm COD"}
                          </Button>
                        )}
                      </div>
                    }
                  />
                ))
              ) : (
                <Card className="border border-border bg-card shadow-sm p-12 text-center">
                  <Box className="w-10 h-10 text-muted-foreground/45 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No recent orders found</p>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboardUnified;
