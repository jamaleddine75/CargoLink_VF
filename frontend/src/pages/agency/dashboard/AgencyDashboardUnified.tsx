import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, Plus,
  LayoutDashboard, Activity, BarChart3,
  AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

import { KPIStats } from './components/KPIStats';
import { QuickActions } from './components/QuickActions';
import { OverviewTab } from './components/OverviewTab';
import { LiveOpsTab } from './components/LiveOpsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { useAuth } from '@/context/AuthContext';
import agencyService from '@/services/api/agencyService';

const AgencyDashboardUnified = () => {
  const { user, logout } = useAuth();
  const { metrics, orders, drivers, loading, refresh, agencyId } = useDashboardMetrics();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [remittances, setRemittances] = React.useState<any[]>([]);

  // Fetch remittances separately as they are specific to overview
  React.useEffect(() => {
    if (agencyId) {
      agencyService.getPendingRemittances(agencyId).then(setRemittances);
    }
  }, [agencyId]);

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

  const handleConfirmRemittance = async (txId: string, amount: number) => {
    try {
      await agencyService.confirmRemittance(agencyId, txId);
      toast.success(`Remittance of ${amount} MAD confirmed`);
      const newRem = await agencyService.getPendingRemittances(agencyId);
      setRemittances(newRem);
      refresh();
    } catch {
      toast.error('Remittance verification failed');
    }
  };

  if (!loading && !agencyId) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Agency not found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Your account is not linked to an agency. Please log in again.
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { logout(); window.location.href = '/login'; }}
        >
          Log out and retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{user?.agencyName || 'Agency'} Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your agency operations</p>
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
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => window.location.href = '/agency/create-order'}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> New Order
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <KPIStats metrics={metrics} loading={loading} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <LayoutDashboard className="w-3.5 h-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-1.5 text-xs">
              <Activity className="w-3.5 h-3.5" /> Live Ops
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </TabsTrigger>
          </TabsList>
          <div className="w-full sm:max-w-xs">
            <QuickActions />
          </div>
        </div>

        <TabsContent value="overview" className="mt-0 outline-none">
          <OverviewTab
            metrics={metrics}
            remittances={remittances}
            onConfirmRemittance={handleConfirmRemittance}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="live" className="mt-0 outline-none">
          <LiveOpsTab
            orders={orders}
            drivers={drivers}
            onValidateDelivery={handleValidateDelivery}
            onConfirmPayment={handleConfirmPayment}
            loading={loading}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 outline-none">
          <AnalyticsTab metrics={metrics} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencyDashboardUnified;
