import { useState, useEffect, useCallback } from 'react';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { DashboardState, AgencyMetrics } from '../types/dashboard.types';

export const useDashboardMetrics = () => {
  const { user } = useAuth();
  const agencyId = user?.agencyId || '';

  const [state, setState] = useState<DashboardState>({
    metrics: null,
    orders: [],
    drivers: [],
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!agencyId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [metricsData, ordersData, driversData] = await Promise.all([
        agencyService.getAgencyMetrics(agencyId),
        agencyService.getAdminOrders(),
        agencyService.getAdminDrivers(),
      ]);

      const normalizedMetrics: AgencyMetrics = {
        totalOrders: metricsData.totalOrders || 0,
        deliveredOrders: (ordersData.content || []).filter((o: unknown) => o.status === 'DELIVERED').length,
        pendingOrders: (metricsData.pendingPickups || 0) + (metricsData.ongoingDeliveries || 0),
        pendingPickups: metricsData.pendingPickups || 0,
        ongoingDeliveries: metricsData.ongoingDeliveries || 0,
        activeDrivers: metricsData.activeDrivers || 0,
        totalRevenue: Number(metricsData.totalRevenue || 0),
        walletBalance: Number(metricsData.walletBalance || 0),
        pendingCOD: Number(metricsData.pendingCOD || 0),
        issuesCount: metricsData.issuesCount || 0,
        weeklyOrders: metricsData.weeklyOrders || [],
        driversStatus: metricsData.driversStatus || [],
      };

      setState({
        metrics: normalizedMetrics,
        orders: ordersData.content || [],
        drivers: driversData || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Dashboard data sync error:', error);
      setState((prev) => ({ ...prev, loading: false, error: 'Failed to sync with command center' }));
      toast.error('Data synchronization error');
    }
  }, [agencyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh: fetchData,
    agencyId,
  };
};
