import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import driverService from '@/services/api/driverService';
import orderService from '@/services/api/orderService';
import { useAuth } from '@/context/AuthContext';
import type { DriverDashboardStats } from '@/services/api/driverService';
import type { DriverDetails } from '@/services/api/driverService';
import type { Order } from '@/types';

export const useDriverDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const isDriver = isAuthenticated && (user?.role === 'DRIVER' || user?.role === 'LIVREUR');
  const [accessDenied, setAccessDenied] = useState(false);

  const dashboard = useQuery<DriverDashboardStats>({
    queryKey: ['driver', 'dashboard'],
    queryFn: async () => {
      try {
        return await driverService.getDashboard();
      } catch (error: unknown) {
        if (error?.response?.status === 403) {
          setAccessDenied(true);
        }
        throw error;
      }
    },
    enabled: isDriver && !accessDenied,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const profile = useQuery<DriverDetails>({
    queryKey: ['driver', 'profile'],
    queryFn: async () => {
      try {
        return await driverService.getProfile();
      } catch (error: unknown) {
        if (error?.response?.status === 403) {
          setAccessDenied(true);
        }
        throw error;
      }
    },
    enabled: isDriver && !accessDenied,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activeOrders = useQuery<Order[]>({
    queryKey: ['driver', 'orders', 'active'],
    queryFn: async () => {
      try {
        return await orderService.getDriverActiveOrders();
      } catch (error: unknown) {
        if (error?.response?.status === 403) {
          setAccessDenied(true);
        }
        throw error;
      }
    },
    enabled: isDriver && !accessDenied,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return { dashboard, profile, activeOrders, accessDenied };
};
